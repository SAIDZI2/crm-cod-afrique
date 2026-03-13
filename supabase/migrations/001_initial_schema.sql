-- CRM COD Afrique — Schema complet
-- Version 1.0 — Mars 2026

-- Enums
CREATE TYPE user_role AS ENUM ('media_buyer', 'call_center', 'livreur', 'admin', 'superviseur_cc', 'responsable_logistique');
CREATE TYPE statut_stock AS ENUM ('en_stock', 'faible', 'rupture');
CREATE TYPE statut_commande AS ENUM ('nouveau', 'confirme', 'en_preparation', 'expedie', 'livre', 'echoue', 'reporte', 'en_retour', 'retourne');
CREATE TYPE type_produit_commande AS ENUM ('principal', 'upsell');
CREATE TYPE statut_commission AS ENUM ('en_attente', 'approuvee', 'rejetee', 'payee');
CREATE TYPE resultat_appel AS ENUM ('confirme', 'echoue', 'reporte', 'pas_de_reponse', 'occupe', 'numero_invalide');
CREATE TYPE statut_rappel AS ENUM ('en_attente', 'effectue', 'manque');
CREATE TYPE statut_tournee AS ENUM ('en_preparation', 'en_cours', 'cloturee');
CREATE TYPE statut_livraison AS ENUM ('en_attente', 'en_cours', 'livre', 'retourne', 'reporte');
CREATE TYPE motif_retour AS ENUM ('absent', 'refus', 'adresse_introuvable', 'injoignable', 'ne_peut_pas_payer', 'colis_endommage', 'mauvais_produit', 'autre');

-- ============================================
-- TABLES PARTAGEES
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'media_buyer',
  parent_id UUID REFERENCES users(id),
  commission_pct DECIMAL(5,2) DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  categorie VARCHAR(100) DEFAULT 'Autre',
  prix DECIMAL(10,2) NOT NULL,
  commission_livraison DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  statut_stock statut_stock DEFAULT 'en_stock',
  image_url TEXT,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commandes (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  agent_id UUID REFERENCES users(id),
  livreur_id UUID REFERENCES users(id),
  destinataire_nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) NOT NULL,
  adresse TEXT NOT NULL,
  ville VARCHAR(100) NOT NULL,
  statut statut_commande DEFAULT 'nouveau',
  montant_total DECIMAL(10,2) DEFAULT 0,
  remise DECIMAL(10,2) DEFAULT 0,
  code_suivi VARCHAR(100),
  commentaire TEXT,
  source VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commande_produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id VARCHAR(20) REFERENCES commandes(id) ON DELETE CASCADE NOT NULL,
  produit_id UUID REFERENCES produits(id) NOT NULL,
  quantite INTEGER DEFAULT 1,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  type type_produit_commande DEFAULT 'principal'
);

CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telephone VARCHAR(50) NOT NULL,
  motif TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blacklist_telephone ON blacklist(telephone);

-- ============================================
-- TABLES MEDIA BUYER
-- ============================================

CREATE TABLE depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  produit_id UUID REFERENCES produits(id),
  date_depense DATE NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  commande_id VARCHAR(20) REFERENCES commandes(id),
  montant DECIMAL(10,2) NOT NULL,
  statut statut_commission DEFAULT 'en_attente',
  date_approbation TIMESTAMPTZ,
  date_paiement TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  methode VARCHAR(100),
  reference VARCHAR(255),
  statut VARCHAR(50) DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLES CALL CENTRE
-- ============================================

CREATE TABLE appels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id VARCHAR(20) REFERENCES commandes(id) NOT NULL,
  agent_id UUID REFERENCES users(id) NOT NULL,
  date_appel TIMESTAMPTZ DEFAULT now(),
  duree_secondes INTEGER DEFAULT 0,
  resultat resultat_appel NOT NULL,
  note TEXT
);

CREATE TABLE rappels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id VARCHAR(20) REFERENCES commandes(id) NOT NULL,
  agent_id UUID REFERENCES users(id) NOT NULL,
  date_rappel TIMESTAMPTZ NOT NULL,
  statut statut_rappel DEFAULT 'en_attente',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE modifications_commande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id VARCHAR(20) REFERENCES commandes(id) NOT NULL,
  agent_id UUID REFERENCES users(id) NOT NULL,
  champ_modifie VARCHAR(100) NOT NULL,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  date_modification TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLES LIVREUR
-- ============================================

CREATE TABLE tournees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  statut statut_tournee DEFAULT 'en_preparation',
  created_by UUID REFERENCES users(id),
  date_creation TIMESTAMPTZ DEFAULT now(),
  date_cloture TIMESTAMPTZ
);

CREATE TABLE tournee_commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournee_id UUID REFERENCES tournees(id) ON DELETE CASCADE NOT NULL,
  commande_id VARCHAR(20) REFERENCES commandes(id) NOT NULL,
  ordre INTEGER DEFAULT 0,
  statut_livraison statut_livraison DEFAULT 'en_attente',
  heure_prise_en_charge TIMESTAMPTZ,
  heure_livraison TIMESTAMPTZ,
  montant_collecte DECIMAL(10,2),
  motif_retour motif_retour,
  photo_preuve TEXT,
  note TEXT
);

CREATE TABLE remises_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id UUID REFERENCES users(id) NOT NULL,
  tournee_id UUID REFERENCES tournees(id),
  montant_remis DECIMAL(10,2) NOT NULL,
  montant_theorique DECIMAL(10,2) NOT NULL,
  ecart DECIMAL(10,2) GENERATED ALWAYS AS (montant_theorique - montant_remis) STORED,
  valide_par UUID REFERENCES users(id),
  date_remise TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

CREATE TABLE retours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id VARCHAR(20) REFERENCES commandes(id) NOT NULL,
  livreur_id UUID REFERENCES users(id) NOT NULL,
  motif motif_retour NOT NULL,
  note TEXT,
  recu_au_depot BOOLEAN DEFAULT false,
  date_retour TIMESTAMPTZ DEFAULT now(),
  date_reception_depot TIMESTAMPTZ
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX idx_commandes_user ON commandes(user_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_created ON commandes(created_at);
CREATE INDEX idx_commandes_telephone ON commandes(telephone);
CREATE INDEX idx_appels_agent ON appels(agent_id);
CREATE INDEX idx_rappels_agent_date ON rappels(agent_id, date_rappel);
CREATE INDEX idx_tournees_livreur ON tournees(livreur_id);
CREATE INDEX idx_tournee_commandes_tournee ON tournee_commandes(tournee_id);
