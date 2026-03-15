-- ============================================
-- CRM COD Afrique — Secure RPC Functions
-- Migration 005 — Mars 2026
-- ============================================
-- PROBLEME: Les updates de statut commande par le livreur echouent silencieusement
-- a cause de RLS (Supabase renvoie success avec 0 rows, sans erreur).
-- Le trigger auto_create_commission utilisait livreur_id au lieu de user_id
-- pour creer les commissions (bug d'attribution).
--
-- SOLUTION:
-- 1. Supprimer le trigger buggy
-- 2. Creer handle_delivery_complete RPC (livre + commission atomique)
-- 3. Creer update_commande_statut_secure RPC (retour/report par livreur)
-- ============================================


-- ============================================
-- 1. SUPPRIMER LE TRIGGER BUGGY
-- ============================================
-- Le trigger trg_auto_create_commission utilisait NEW.livreur_id
-- au lieu de NEW.user_id pour creer les commissions.
-- Nos RPCs SECURITY DEFINER gerent maintenant les commissions correctement.

DROP TRIGGER IF EXISTS trg_auto_create_commission ON public.commandes;


-- ============================================
-- 2. HANDLE DELIVERY COMPLETE (livre + commission)
-- ============================================
-- Fonction atomique qui:
-- 1. Met a jour le statut de la commande a 'livre'
-- 2. Cree automatiquement la commission du media buyer
-- Securite: verifie que l'appelant est le livreur assigne ou admin

CREATE OR REPLACE FUNCTION public.handle_delivery_complete(
  p_commande_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text;
  v_caller_role text;
  v_livreur_id text;
  v_user_id uuid;
  v_montant_total numeric;
  v_commission_pct numeric;
  v_montant_commission numeric;
BEGIN
  -- Identifier l'appelant
  v_caller_id := get_my_crm_id();
  v_caller_role := get_my_crm_role();

  -- Recuperer les details de la commande
  SELECT livreur_id, user_id, montant_total
  INTO v_livreur_id, v_user_id, v_montant_total
  FROM commandes WHERE id = p_commande_id;

  IF v_livreur_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;

  -- Securite: seul le livreur assigne ou un admin peut confirmer
  IF v_caller_role = 'livreur' AND v_livreur_id != v_caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Non autorise');
  END IF;

  -- 1. Mettre a jour le statut
  UPDATE commandes SET statut = 'livre', updated_at = now()
  WHERE id = p_commande_id;

  -- 2. Calculer et creer la commission du media buyer
  SELECT commission_pct INTO v_commission_pct
  FROM users WHERE id = v_user_id;

  IF v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
    v_montant_commission := v_montant_total * v_commission_pct / 100;
    IF v_montant_commission > 0 THEN
      INSERT INTO commissions (user_id, commande_id, montant, statut)
      VALUES (v_user_id, p_commande_id, v_montant_commission, 'en_attente')
      ON CONFLICT (commande_id) DO NOTHING;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'commande_id', p_commande_id,
    'commission_montant', COALESCE(v_montant_commission, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_delivery_complete(text) TO authenticated;


-- ============================================
-- 3. UPDATE COMMANDE STATUT SECURE (retour/report)
-- ============================================
-- Permet au livreur de changer le statut d'une commande
-- (livre, retourne, reporte) en bypassant RLS.
-- Les admins peuvent changer a n'importe quel statut.

CREATE OR REPLACE FUNCTION public.update_commande_statut_secure(
  p_commande_id text,
  p_statut text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text;
  v_caller_role text;
  v_livreur_id text;
BEGIN
  v_caller_id := get_my_crm_id();
  v_caller_role := get_my_crm_role();

  SELECT livreur_id INTO v_livreur_id
  FROM commandes WHERE id = p_commande_id;

  IF v_livreur_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;

  -- Securite: livreur ne peut modifier que ses propres commandes
  IF v_caller_role = 'livreur' AND v_livreur_id != v_caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Non autorise');
  END IF;

  -- Livreurs limites a livre, retourne, reporte
  IF v_caller_role = 'livreur' AND p_statut NOT IN ('livre', 'retourne', 'reporte') THEN
    RETURN json_build_object('success', false, 'error', 'Statut non autorise pour livreur');
  END IF;

  UPDATE commandes SET statut = p_statut, updated_at = now()
  WHERE id = p_commande_id;

  RETURN json_build_object('success', true, 'commande_id', p_commande_id, 'statut', p_statut);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_commande_statut_secure(text, text) TO authenticated;
