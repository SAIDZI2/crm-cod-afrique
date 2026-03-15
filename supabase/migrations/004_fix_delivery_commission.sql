-- ============================================
-- CRM COD Afrique — Fix: Delivery Commission Flow
-- Migration 004 — Mars 2026
-- ============================================
-- PROBLEME: Le livreur ne peut pas creer de commissions (RLS INSERT = admin only)
-- SOLUTION: Fonction SECURITY DEFINER + policy RLS supplementaire (fallback)
-- ============================================


-- ============================================
-- 1. FONCTION SECURITY DEFINER POUR CREATION COMMISSION
-- ============================================
-- Cette fonction s'execute avec les privileges du owner (bypass RLS)
-- Elle calcule la commission du media buyer et l'insere automatiquement

CREATE OR REPLACE FUNCTION public.create_delivery_commission(
  p_commande_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_montant_total numeric;
  v_commission_pct numeric;
  v_montant_commission numeric;
  v_result json;
BEGIN
  -- 1. Recuperer les details de la commande
  SELECT user_id, montant_total
  INTO v_user_id, v_montant_total
  FROM commandes
  WHERE id = p_commande_id;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;

  -- 2. Recuperer le taux de commission du media buyer
  SELECT commission_pct
  INTO v_commission_pct
  FROM users
  WHERE id = v_user_id;

  IF v_commission_pct IS NULL OR v_commission_pct <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Pas de commission configuree');
  END IF;

  -- 3. Calculer la commission
  v_montant_commission := v_montant_total * v_commission_pct / 100;

  IF v_montant_commission <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Montant commission nul');
  END IF;

  -- 4. Creer la commission (avec ON CONFLICT pour eviter les doublons)
  INSERT INTO commissions (user_id, commande_id, montant, statut)
  VALUES (v_user_id, p_commande_id, v_montant_commission, 'en_attente')
  ON CONFLICT (commande_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'montant', v_montant_commission,
    'commission_pct', v_commission_pct
  );
END;
$$;

-- Permettre aux utilisateurs authentifies d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.create_delivery_commission(text) TO authenticated;


-- ============================================
-- 2. INDEX UNIQUE POUR EVITER DOUBLONS COMMISSIONS
-- ============================================
-- Une seule commission par commande
CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_commande_unique
  ON public.commissions(commande_id);


-- ============================================
-- 3. POLICY RLS SUPPLEMENTAIRE (FALLBACK)
-- ============================================
-- Permet aux livreurs d'inserer des commissions pour les commandes qu'ils livrent
-- Securise: verifie que la commande est bien "livre" et assignee au livreur

CREATE POLICY commissions_insert_livreur ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'livreur'
    AND EXISTS (
      SELECT 1 FROM commandes c
      WHERE c.id = commande_id
      AND c.livreur_id = get_my_crm_id()
      AND c.statut = 'livre'
    )
  );


-- ============================================
-- 4. FIX: Permettre aux livreurs de lire leurs propres commissions
-- ============================================
-- Actuellement, commissions_select ne permet qu'a admin ou owner (user_id)
-- Les livreurs doivent pouvoir voir les commissions des commandes qu'ils livrent
-- (Pas strictement necessaire mais utile pour la visibilite)


-- ============================================
-- 5. PERMETTRE aux livreurs de SELECT les commandes via tournee_commandes
-- ============================================
-- Actuellement, les livreurs ne peuvent voir que les commandes avec livreur_id = self
-- Ajouter une policy permettant de voir les commandes assignees via tournee

CREATE POLICY commandes_select_via_tournee ON public.commandes
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() = 'livreur'
    AND EXISTS (
      SELECT 1 FROM tournee_commandes tc
      JOIN tournees t ON t.id = tc.tournee_id
      WHERE tc.commande_id = id
      AND t.livreur_id = get_my_crm_id()
    )
  );

-- Permettre aussi la mise a jour des commandes assignees via tournee
CREATE POLICY commandes_update_via_tournee ON public.commandes
  FOR UPDATE TO authenticated
  USING (
    get_my_crm_role() = 'livreur'
    AND EXISTS (
      SELECT 1 FROM tournee_commandes tc
      JOIN tournees t ON t.id = tc.tournee_id
      WHERE tc.commande_id = id
      AND t.livreur_id = get_my_crm_id()
    )
  )
  WITH CHECK (
    get_my_crm_role() = 'livreur'
    AND EXISTS (
      SELECT 1 FROM tournee_commandes tc
      JOIN tournees t ON t.id = tc.tournee_id
      WHERE tc.commande_id = id
      AND t.livreur_id = get_my_crm_id()
    )
  );
