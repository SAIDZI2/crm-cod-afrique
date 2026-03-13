import type { Commande, Produit, User, Depense, Commission, Appel, Rappel, Tournee, TourneeCommande, RemiseCash } from './types';

// --- Users ---
export const mockUsers: User[] = [
  { id: 'u1', nom: 'Said MB', email: 'said@crm.com', role: 'media_buyer', commission_pct: 10, actif: true, created_at: '2026-01-15T00:00:00Z' },
  { id: 'u2', nom: 'Yassine RDC', email: 'yassine@crm.com', role: 'media_buyer', parent_id: 'u1', commission_pct: 8, actif: true, created_at: '2026-01-22T00:00:00Z' },
  { id: 'u3', nom: 'Hamid RDC', email: 'hamid@crm.com', role: 'media_buyer', parent_id: 'u1', commission_pct: 8, actif: true, created_at: '2026-02-01T00:00:00Z' },
  { id: 'u4', nom: 'Agent Karim', email: 'karim@crm.com', role: 'call_center', commission_pct: 0, actif: true, created_at: '2026-02-10T00:00:00Z' },
  { id: 'u5', nom: 'Agent Fatima', email: 'fatima@crm.com', role: 'call_center', commission_pct: 0, actif: true, created_at: '2026-02-10T00:00:00Z' },
  { id: 'u6', nom: 'Livreur Moise', email: 'moise@crm.com', role: 'livreur', commission_pct: 5, actif: true, created_at: '2026-02-15T00:00:00Z' },
  { id: 'u7', nom: 'Livreur Patrick', email: 'patrick@crm.com', role: 'livreur', commission_pct: 5, actif: true, created_at: '2026-02-15T00:00:00Z' },
];

// --- Produits ---
export const mockProduits: Produit[] = [
  { id: 'p1', nom: 'Bee Venom Cream', sku: 'BVC-001', categorie: 'Beaute', prix: 35, commission_livraison: 5, stock: 150, statut_stock: 'en_stock', image_url: '/placeholder-product.png', actif: true },
  { id: 'p2', nom: 'Smartwatch Pro X', sku: 'SWP-002', categorie: 'Electronique', prix: 45, commission_livraison: 7, stock: 80, statut_stock: 'en_stock', image_url: '/placeholder-product.png', actif: true },
  { id: 'p3', nom: 'Hair Growth Serum', sku: 'HGS-003', categorie: 'Beaute', prix: 25, commission_livraison: 4, stock: 12, statut_stock: 'faible', image_url: '/placeholder-product.png', actif: true },
  { id: 'p4', nom: 'Wireless Earbuds V2', sku: 'WEB-004', categorie: 'Electronique', prix: 30, commission_livraison: 5, stock: 0, statut_stock: 'rupture', image_url: '/placeholder-product.png', actif: true },
  { id: 'p5', nom: 'Anti-Aging Eye Cream', sku: 'AAE-005', categorie: 'Beaute', prix: 40, commission_livraison: 6, stock: 200, statut_stock: 'en_stock', image_url: '/placeholder-product.png', actif: true },
  { id: 'p6', nom: 'Solar Power Bank 20K', sku: 'SPB-006', categorie: 'Electronique', prix: 28, commission_livraison: 4, stock: 95, statut_stock: 'en_stock', image_url: '/placeholder-product.png', actif: true },
];

// --- Commandes ---
const villes = ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi', 'Bukavu'];
const statuts: Commande['statut'][] = ['nouveau', 'confirme', 'en_preparation', 'expedie', 'livre', 'echoue', 'reporte', 'en_retour', 'retourne'];

function genId(ville: string): string {
  const code = ville.substring(0, 3).toUpperCase();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${code}-${id}`;
}

export const mockCommandes: Commande[] = Array.from({ length: 50 }, (_, i) => {
  const ville = villes[i % villes.length];
  const statut = statuts[i % statuts.length];
  const produit = mockProduits[i % mockProduits.length];
  const day = String((i % 28) + 1).padStart(2, '0');
  return {
    id: genId(ville),
    user_id: i % 3 === 0 ? 'u1' : i % 3 === 1 ? 'u2' : 'u3',
    agent_id: i % 2 === 0 ? 'u4' : 'u5',
    livreur_id: statut === 'expedie' || statut === 'livre' || statut === 'en_retour' ? (i % 2 === 0 ? 'u6' : 'u7') : undefined,
    destinataire_nom: `Client ${i + 1}`,
    telephone: `+243 ${800 + i} ${String(100000 + i * 37).slice(0, 6)}`,
    adresse: `${i + 10} Avenue de la Paix`,
    ville,
    statut,
    montant_total: produit.prix * (1 + (i % 3)),
    remise: i % 5 === 0 ? 5 : 0,
    code_suivi: `TRK${String(1000 + i)}`,
    commentaire: i % 4 === 0 ? 'Client VIP' : undefined,
    source: i % 2 === 0 ? 'Facebook Ads' : 'TikTok Ads',
    created_at: `2026-03-${day}T${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
    updated_at: `2026-03-${day}T${String(10 + (i % 10)).padStart(2, '0')}:00:00Z`,
  };
});

// --- KPI helpers ---
export function countByStatut(statut: Commande['statut']) {
  return mockCommandes.filter(c => c.statut === statut).length;
}

export const mockKpis = {
  total: mockCommandes.length,
  nouveau: countByStatut('nouveau'),
  confirme: countByStatut('confirme'),
  en_preparation: countByStatut('en_preparation'),
  expedie: countByStatut('expedie'),
  livre: countByStatut('livre'),
  echoue: countByStatut('echoue'),
  reporte: countByStatut('reporte'),
  en_retour: countByStatut('en_retour'),
  retourne: countByStatut('retourne'),
};

// --- Depenses ---
export const mockDepenses: Depense[] = [
  { id: 'd1', user_id: 'u1', produit_id: 'p1', date_depense: '2026-03-01', montant: 150, note: 'Facebook Ads - Bee Venom S1', created_at: '2026-03-01T00:00:00Z' },
  { id: 'd2', user_id: 'u1', produit_id: 'p2', date_depense: '2026-03-03', montant: 200, note: 'TikTok Ads - Smartwatch', created_at: '2026-03-03T00:00:00Z' },
  { id: 'd3', user_id: 'u2', produit_id: 'p1', date_depense: '2026-03-05', montant: 100, note: 'Facebook Ads - Bee Venom S2', created_at: '2026-03-05T00:00:00Z' },
  { id: 'd4', user_id: 'u1', produit_id: 'p5', date_depense: '2026-03-08', montant: 180, note: 'Instagram Ads - Anti-Aging', created_at: '2026-03-08T00:00:00Z' },
  { id: 'd5', user_id: 'u3', produit_id: 'p6', date_depense: '2026-03-10', montant: 120, note: 'Facebook Ads - Power Bank', created_at: '2026-03-10T00:00:00Z' },
];

// --- Commissions ---
export const mockCommissions: Commission[] = mockCommandes
  .filter(c => c.statut === 'livre')
  .map((c, i) => ({
    id: `com${i}`,
    user_id: c.user_id,
    commande_id: c.id,
    montant: 5 + (i % 3) * 2,
    statut: i % 3 === 0 ? 'approuvee' as const : i % 3 === 1 ? 'en_attente' as const : 'payee' as const,
    date_approbation: i % 3 !== 1 ? '2026-03-12T00:00:00Z' : undefined,
    date_paiement: i % 3 === 2 ? '2026-03-13T00:00:00Z' : undefined,
    created_at: c.created_at,
  }));

// --- Appels (Call Centre) ---
export const mockAppels: Appel[] = mockCommandes.slice(0, 20).map((c, i) => ({
  id: `a${i}`,
  commande_id: c.id,
  agent_id: i % 2 === 0 ? 'u4' : 'u5',
  date_appel: c.created_at,
  duree_secondes: 60 + (i * 23) % 240,
  resultat: (['confirme', 'echoue', 'reporte', 'pas_de_reponse', 'occupe'] as const)[i % 5],
  note: i % 3 === 0 ? 'Client disponible' : undefined,
}));

// --- Rappels ---
export const mockRappels: Rappel[] = mockCommandes
  .filter(c => c.statut === 'reporte')
  .map((c, i) => ({
    id: `r${i}`,
    commande_id: c.id,
    agent_id: i % 2 === 0 ? 'u4' : 'u5',
    date_rappel: `2026-03-13T${String(9 + i).padStart(2, '0')}:00:00Z`,
    statut: (['en_attente', 'effectue', 'manque'] as const)[i % 3],
    note: 'Rappeler apres 16h',
    created_at: c.created_at,
    commande: c,
  }));

// --- Tournees ---
export const mockTourneeCommandes: TourneeCommande[] = mockCommandes
  .filter(c => ['expedie', 'livre', 'en_retour'].includes(c.statut))
  .map((c, i) => ({
    id: `tc${i}`,
    tournee_id: 't1',
    commande_id: c.id,
    ordre: i + 1,
    statut_livraison: c.statut === 'livre' ? 'livre' as const : c.statut === 'en_retour' ? 'retourne' as const : 'en_cours' as const,
    montant_collecte: c.statut === 'livre' ? c.montant_total : undefined,
    commande: c,
  }));

export const mockTournees: Tournee[] = [
  {
    id: 't1',
    livreur_id: 'u6',
    date: '2026-03-13',
    statut: 'en_cours',
    created_by: 'u1',
    date_creation: '2026-03-13T07:00:00Z',
    commandes: mockTourneeCommandes,
  },
];

export const mockRemisesCash: RemiseCash[] = [
  { id: 'rc1', livreur_id: 'u6', tournee_id: 't1', montant_remis: 180, montant_theorique: 185, ecart: 5, date_remise: '2026-03-12T18:00:00Z', note: 'Ecart du au rendu monnaie' },
];
