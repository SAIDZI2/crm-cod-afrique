// CRM COD — Types TypeScript

export type UserRole = 'media_buyer' | 'call_center' | 'livreur' | 'admin' | 'superviseur_cc' | 'responsable_logistique';

export type StatutStock = 'en_stock' | 'faible' | 'rupture';

export type StatutCommande =
  | 'nouveau'
  | 'confirme'
  | 'en_preparation'
  | 'expedie'
  | 'livre'
  | 'echoue'
  | 'reporte'
  | 'en_retour'
  | 'retourne';

export type TypeProduitCommande = 'principal' | 'upsell';
export type StatutCommission = 'en_attente' | 'approuvee' | 'rejetee' | 'payee';
export type ResultatAppel = 'confirme' | 'echoue' | 'reporte' | 'pas_de_reponse' | 'occupe' | 'numero_invalide';
export type StatutRappel = 'en_attente' | 'effectue' | 'manque';
export type StatutTournee = 'en_preparation' | 'en_cours' | 'cloturee';
export type StatutLivraison = 'en_attente' | 'en_cours' | 'livre' | 'retourne' | 'reporte';
export type MotifRetour = 'absent' | 'refus' | 'adresse_introuvable' | 'injoignable' | 'ne_peut_pas_payer' | 'colis_endommage' | 'mauvais_produit' | 'autre';

// --- Entities ---

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  parent_id?: string;
  commission_pct: number;
  actif: boolean;
  created_at: string;
}

export interface Produit {
  id: string;
  nom: string;
  sku: string;
  categorie: string;
  prix: number;
  commission_livraison: number;
  stock: number;
  statut_stock: StatutStock;
  image_url?: string;
  description?: string;
  actif: boolean;
}

export interface Commande {
  id: string;
  user_id: string;
  agent_id?: string;
  livreur_id?: string;
  destinataire_nom: string;
  telephone: string;
  adresse: string;
  ville: string;
  statut: StatutCommande;
  montant_total: number;
  remise: number;
  code_suivi?: string;
  commentaire?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  // Joined
  produits?: CommandeProduit[];
  user?: User;
}

export interface CommandeProduit {
  id: string;
  commande_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  type: TypeProduitCommande;
  produit?: Produit;
}

export interface Blacklist {
  id: string;
  telephone: string;
  motif?: string;
  user_id?: string;
  created_at: string;
}

export interface Depense {
  id: string;
  user_id: string;
  produit_id?: string;
  date_depense: string;
  montant: number;
  note?: string;
  created_at: string;
  produit?: Produit;
}

export interface Commission {
  id: string;
  user_id: string;
  commande_id?: string;
  montant: number;
  statut: StatutCommission;
  date_approbation?: string;
  date_paiement?: string;
  created_at: string;
}

export interface Paiement {
  id: string;
  user_id: string;
  montant: number;
  methode?: string;
  reference?: string;
  statut: string;
  created_at: string;
}

export interface Appel {
  id: string;
  commande_id: string;
  agent_id: string;
  date_appel: string;
  duree_secondes: number;
  resultat: ResultatAppel;
  note?: string;
}

export interface Rappel {
  id: string;
  commande_id: string;
  agent_id: string;
  date_rappel: string;
  statut: StatutRappel;
  note?: string;
  created_at: string;
  commande?: Commande;
}

export interface ModificationCommande {
  id: string;
  commande_id: string;
  agent_id: string;
  champ_modifie: string;
  ancienne_valeur?: string;
  nouvelle_valeur?: string;
  date_modification: string;
}

export interface Tournee {
  id: string;
  livreur_id: string;
  date: string;
  statut: StatutTournee;
  created_by?: string;
  date_creation: string;
  date_cloture?: string;
  commandes?: TourneeCommande[];
}

export interface TourneeCommande {
  id: string;
  tournee_id: string;
  commande_id: string;
  ordre: number;
  statut_livraison: StatutLivraison;
  heure_prise_en_charge?: string;
  heure_livraison?: string;
  montant_collecte?: number;
  motif_retour?: MotifRetour;
  photo_preuve?: string;
  note?: string;
  commande?: Commande;
}

export interface RemiseCash {
  id: string;
  livreur_id: string;
  tournee_id?: string;
  montant_remis: number;
  montant_theorique: number;
  ecart: number;
  valide_par?: string;
  date_remise: string;
  note?: string;
}

export interface Retour {
  id: string;
  commande_id: string;
  livreur_id: string;
  motif: MotifRetour;
  note?: string;
  recu_au_depot: boolean;
  date_retour: string;
  date_reception_depot?: string;
  commande?: Commande;
}

// Extended types for queries with joins
export interface CommandeWithRelations extends Commande {
  user?: User;
  agent?: User;
  livreur?: User;
  commande_produits?: (CommandeProduit & { produit?: Produit })[];
}

export interface CommissionWithRelations extends Commission {
  user?: User;
  commande?: Commande;
}

export interface PaiementWithRelations extends Paiement {
  user?: User;
}

export interface RappelWithRelations extends Rappel {
  commande?: Commande;
}

// --- Dashboard KPIs ---

export interface KpiData {
  label: string;
  value: number | string;
  color: string;
  icon?: string;
  trend?: number;
}

// --- Navigation ---

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
