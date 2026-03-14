-- ============================================
-- CRM COD Afrique — Row Level Security (RLS)
-- Migration 003 — Mars 2026
-- ============================================
-- IMPORTANT: auth.uid() ≠ public.users.id
-- La liaison se fait par email: auth.jwt()->>'email' = public.users.email
-- Deux fonctions helper SECURITY DEFINER resolvent cette indirection.
-- ============================================


-- ============================================
-- SECTION 1 : FONCTIONS HELPER
-- ============================================

-- Retourne le public.users.id de l'utilisateur connecte
CREATE OR REPLACE FUNCTION public.get_my_crm_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE email = auth.jwt()->>'email' LIMIT 1;
$$;

-- Retourne le public.users.role de l'utilisateur connecte
CREATE OR REPLACE FUNCTION public.get_my_crm_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE email = auth.jwt()->>'email' LIMIT 1;
$$;


-- ============================================
-- SECTION 2 : ACTIVER RLS SUR LES 15 TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifications_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournee_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remises_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retours ENABLE ROW LEVEL SECURITY;


-- ============================================
-- SECTION 3 : POLITIQUES PAR TABLE
-- ============================================


-- --------------------------------------------------------
-- 3.1  USERS
-- --------------------------------------------------------
-- SELECT : tous les authentifies (necessaire pour lookups/affichage noms)
CREATE POLICY users_select_authenticated ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE : admin uniquement
CREATE POLICY users_insert_admin ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY users_update_admin ON public.users
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY users_delete_admin ON public.users
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.2  PRODUITS
-- --------------------------------------------------------
-- SELECT : tous les authentifies (catalogue global)
CREATE POLICY produits_select_authenticated ON public.produits
  FOR SELECT TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE : admin uniquement
CREATE POLICY produits_insert_admin ON public.produits
  FOR INSERT TO authenticated
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY produits_update_admin ON public.produits
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY produits_delete_admin ON public.produits
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.3  COMMANDES (table la plus complexe)
-- --------------------------------------------------------
-- SELECT : role-based
--   admin, call_center, superviseur_cc, responsable_logistique → TOUT
--   media_buyer → own (user_id) + sub-affiliates (parent_id)
--   livreur → own (livreur_id)
CREATE POLICY commandes_select ON public.commandes
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'call_center', 'superviseur_cc', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'media_buyer'
      AND (
        user_id = get_my_crm_id()
        OR user_id IN (SELECT id FROM public.users WHERE parent_id = get_my_crm_id())
      )
    )
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- INSERT : media_buyer (user_id = own) + admin
CREATE POLICY commandes_insert ON public.commandes
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'admin'
    OR (
      get_my_crm_role() = 'media_buyer'
      AND user_id = get_my_crm_id()
    )
  );

-- UPDATE : call_center, superviseur_cc, responsable_logistique, admin → tout
--          livreur → own (livreur_id) seulement
CREATE POLICY commandes_update ON public.commandes
  FOR UPDATE TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'call_center', 'superviseur_cc', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  )
  WITH CHECK (
    get_my_crm_role() IN ('admin', 'call_center', 'superviseur_cc', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- DELETE : admin uniquement
CREATE POLICY commandes_delete_admin ON public.commandes
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.4  COMMANDE_PRODUITS (cascade via commandes)
-- --------------------------------------------------------
-- SELECT : visible si la commande parent est visible (RLS cascading)
CREATE POLICY commande_produits_select ON public.commande_produits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.commandes c
      WHERE c.id = commande_id
    )
  );

-- INSERT : media_buyer (si commande parent visible) + admin
CREATE POLICY commande_produits_insert ON public.commande_produits
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('media_buyer', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.commandes c
      WHERE c.id = commande_id
    )
  );

-- UPDATE/DELETE : admin uniquement
CREATE POLICY commande_produits_update_admin ON public.commande_produits
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY commande_produits_delete_admin ON public.commande_produits
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.5  BLACKLIST
-- --------------------------------------------------------
-- SELECT : media_buyer, call_center, superviseur_cc, admin
CREATE POLICY blacklist_select ON public.blacklist
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('media_buyer', 'call_center', 'superviseur_cc', 'admin')
  );

-- INSERT : media_buyer, call_center, superviseur_cc, admin
CREATE POLICY blacklist_insert ON public.blacklist
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('media_buyer', 'call_center', 'superviseur_cc', 'admin')
  );

-- DELETE : admin uniquement
CREATE POLICY blacklist_delete_admin ON public.blacklist
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.6  DEPENSES
-- --------------------------------------------------------
-- SELECT : owner (user_id) + admin
CREATE POLICY depenses_select ON public.depenses
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() = 'admin'
    OR user_id = get_my_crm_id()
  );

-- INSERT : media_buyer (user_id = own) + admin
CREATE POLICY depenses_insert ON public.depenses
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'admin'
    OR (
      get_my_crm_role() = 'media_buyer'
      AND user_id = get_my_crm_id()
    )
  );

-- UPDATE/DELETE : admin uniquement
CREATE POLICY depenses_update_admin ON public.depenses
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY depenses_delete_admin ON public.depenses
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.7  COMMISSIONS
-- --------------------------------------------------------
-- SELECT : owner (user_id) + admin
CREATE POLICY commissions_select ON public.commissions
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() = 'admin'
    OR user_id = get_my_crm_id()
  );

-- INSERT/UPDATE/DELETE : admin uniquement
CREATE POLICY commissions_insert_admin ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY commissions_update_admin ON public.commissions
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY commissions_delete_admin ON public.commissions
  FOR DELETE TO authenticated
  USING (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.8  PAIEMENTS
-- --------------------------------------------------------
-- SELECT : owner (user_id) + admin
CREATE POLICY paiements_select ON public.paiements
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() = 'admin'
    OR user_id = get_my_crm_id()
  );

-- INSERT/UPDATE : admin uniquement
CREATE POLICY paiements_insert_admin ON public.paiements
  FOR INSERT TO authenticated
  WITH CHECK (get_my_crm_role() = 'admin');

CREATE POLICY paiements_update_admin ON public.paiements
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() = 'admin')
  WITH CHECK (get_my_crm_role() = 'admin');


-- --------------------------------------------------------
-- 3.9  APPELS
-- --------------------------------------------------------
-- SELECT : agent (own) + superviseur_cc + admin
CREATE POLICY appels_select ON public.appels
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'superviseur_cc')
    OR agent_id = get_my_crm_id()
  );

-- INSERT : call_center/superviseur_cc (agent_id = own) + admin
CREATE POLICY appels_insert ON public.appels
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'admin'
    OR (
      get_my_crm_role() IN ('call_center', 'superviseur_cc')
      AND agent_id = get_my_crm_id()
    )
  );


-- --------------------------------------------------------
-- 3.10  RAPPELS
-- --------------------------------------------------------
-- SELECT : agent (own) + superviseur_cc + admin
CREATE POLICY rappels_select ON public.rappels
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'superviseur_cc')
    OR agent_id = get_my_crm_id()
  );

-- INSERT : call_center/superviseur_cc + admin
CREATE POLICY rappels_insert ON public.rappels
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('call_center', 'superviseur_cc', 'admin')
  );

-- UPDATE : call_center (own) + superviseur_cc + admin
CREATE POLICY rappels_update ON public.rappels
  FOR UPDATE TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'superviseur_cc')
    OR (
      get_my_crm_role() = 'call_center'
      AND agent_id = get_my_crm_id()
    )
  )
  WITH CHECK (
    get_my_crm_role() IN ('admin', 'superviseur_cc')
    OR (
      get_my_crm_role() = 'call_center'
      AND agent_id = get_my_crm_id()
    )
  );


-- --------------------------------------------------------
-- 3.11  MODIFICATIONS_COMMANDE
-- --------------------------------------------------------
-- SELECT : agent (own) + superviseur_cc + admin
CREATE POLICY modifications_commande_select ON public.modifications_commande
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'superviseur_cc')
    OR agent_id = get_my_crm_id()
  );

-- INSERT : call_center/superviseur_cc + admin
CREATE POLICY modifications_commande_insert ON public.modifications_commande
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('call_center', 'superviseur_cc', 'admin')
  );


-- --------------------------------------------------------
-- 3.12  TOURNEES
-- --------------------------------------------------------
-- SELECT : livreur (own) + responsable_logistique + admin
CREATE POLICY tournees_select ON public.tournees
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- INSERT : responsable_logistique + admin
CREATE POLICY tournees_insert ON public.tournees
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('responsable_logistique', 'admin')
  );

-- UPDATE : livreur (own) + responsable_logistique + admin
CREATE POLICY tournees_update ON public.tournees
  FOR UPDATE TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  )
  WITH CHECK (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );


-- --------------------------------------------------------
-- 3.13  TOURNEE_COMMANDES (cascade via tournees)
-- --------------------------------------------------------
-- SELECT : visible si la tournee parent est visible (RLS cascading)
CREATE POLICY tournee_commandes_select ON public.tournee_commandes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournees t
      WHERE t.id = tournee_id
    )
  );

-- INSERT : responsable_logistique + admin
CREATE POLICY tournee_commandes_insert ON public.tournee_commandes
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() IN ('responsable_logistique', 'admin')
  );

-- UPDATE : livreur (own via tournee parent) + responsable_logistique + admin
CREATE POLICY tournee_commandes_update ON public.tournee_commandes
  FOR UPDATE TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND EXISTS (
        SELECT 1 FROM public.tournees t
        WHERE t.id = tournee_id
        AND t.livreur_id = get_my_crm_id()
      )
    )
  )
  WITH CHECK (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND EXISTS (
        SELECT 1 FROM public.tournees t
        WHERE t.id = tournee_id
        AND t.livreur_id = get_my_crm_id()
      )
    )
  );


-- --------------------------------------------------------
-- 3.14  REMISES_CASH
-- --------------------------------------------------------
-- SELECT : livreur (own) + responsable_logistique + admin
CREATE POLICY remises_cash_select ON public.remises_cash
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- INSERT : livreur (own) + admin
CREATE POLICY remises_cash_insert ON public.remises_cash
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'admin'
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- UPDATE : responsable_logistique + admin (validation)
CREATE POLICY remises_cash_update ON public.remises_cash
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() IN ('admin', 'responsable_logistique'))
  WITH CHECK (get_my_crm_role() IN ('admin', 'responsable_logistique'));


-- --------------------------------------------------------
-- 3.15  RETOURS
-- --------------------------------------------------------
-- SELECT : livreur (own) + responsable_logistique + admin
CREATE POLICY retours_select ON public.retours
  FOR SELECT TO authenticated
  USING (
    get_my_crm_role() IN ('admin', 'responsable_logistique')
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- INSERT : livreur (own) + admin
CREATE POLICY retours_insert ON public.retours
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_crm_role() = 'admin'
    OR (
      get_my_crm_role() = 'livreur'
      AND livreur_id = get_my_crm_id()
    )
  );

-- UPDATE : responsable_logistique + admin (reception depot)
CREATE POLICY retours_update ON public.retours
  FOR UPDATE TO authenticated
  USING (get_my_crm_role() IN ('admin', 'responsable_logistique'))
  WITH CHECK (get_my_crm_role() IN ('admin', 'responsable_logistique'));


-- ============================================
-- SECTION 4 : INDEX DE PERFORMANCE POUR RLS
-- ============================================

-- Sub-affiliates lookup dans la policy commandes
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON public.users(parent_id);

-- Commandes filtrees par livreur_id
CREATE INDEX IF NOT EXISTS idx_commandes_livreur ON public.commandes(livreur_id);

-- Commandes filtrees par agent_id
CREATE INDEX IF NOT EXISTS idx_commandes_agent ON public.commandes(agent_id);

-- Remises cash filtrees par livreur_id
CREATE INDEX IF NOT EXISTS idx_remises_cash_livreur ON public.remises_cash(livreur_id);

-- Retours filtres par livreur_id
CREATE INDEX IF NOT EXISTS idx_retours_livreur ON public.retours(livreur_id);
