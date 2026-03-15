import { createClient } from './client';
import type {
  User, Produit, Commande, CommandeProduit, Blacklist,
  Depense, Commission, Appel, Rappel, Tournee,
  TourneeCommande, RemiseCash, Retour, StatutCommande,
  StatutCommission
} from '../types';

const supabase = createClient();

// ============================================
// USERS
// ============================================
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as User[];
}

export async function getUsersByRole(role: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('nom');
  if (error) throw error;
  return data as User[];
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as User;
}

export async function getSubAffiliates(parentId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('parent_id', parentId)
    .order('nom');
  if (error) throw error;
  return data as User[];
}

// ============================================
// PRODUITS
// ============================================
export async function getProduits() {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .order('nom');
  if (error) throw error;
  return data as Produit[];
}

export async function getProduitById(id: string) {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Produit;
}

export async function createProduit(produit: Partial<Produit>) {
  const { data, error } = await supabase
    .from('produits')
    .insert(produit)
    .select()
    .single();
  if (error) throw error;
  return data as Produit;
}

export async function updateProduit(id: string, updates: Partial<Produit>) {
  const { error } = await supabase
    .from('produits')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProduit(id: string) {
  const { error } = await supabase
    .from('produits')
    .update({ actif: false } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// COMMANDES
// ============================================
export async function getCommandes(filters?: {
  userId?: string;
  statut?: StatutCommande;
  ville?: string;
  search?: string;
}) {
  let query = supabase
    .from('commandes')
    .select('*, user:users!commandes_user_id_fkey(*), commande_produits(*, produit:produits(*))')
    .order('created_at', { ascending: false });

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.statut) query = query.eq('statut', filters.statut);
  if (filters?.ville) query = query.eq('ville', filters.ville);
  if (filters?.search) query = query.or(`destinataire_nom.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as (Commande & { commande_produits: (CommandeProduit & { produit: Produit })[] })[];
}

export async function getCommandeById(id: string) {
  const { data, error } = await supabase
    .from('commandes')
    .select('*, user:users!commandes_user_id_fkey(*), agent:users!commandes_agent_id_fkey(*), livreur:users!commandes_livreur_id_fkey(*), commande_produits(*, produit:produits(*)), appels(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Commande & { user?: User; agent?: User; livreur?: User; commande_produits: (CommandeProduit & { produit: Produit })[]; appels: Appel[] };
}

export async function getCommandesByTelephone(telephone: string) {
  const { data, error } = await supabase
    .from('commandes')
    .select('*')
    .eq('telephone', telephone)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Commande[];
}

export async function getCommandesByStatut(statut: StatutCommande) {
  const { data, error } = await supabase
    .from('commandes')
    .select('*, commande_produits(*, produit:produits(*))')
    .eq('statut', statut)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as (Commande & { commande_produits: (CommandeProduit & { produit: Produit })[] })[];
}

export async function getCommandesNouveaux() {
  return getCommandesByStatut('nouveau');
}

export async function updateCommandeStatut(id: string, statut: StatutCommande, agentId?: string, livreurId?: string) {
  const updateData: Record<string, unknown> = { statut, updated_at: new Date().toISOString() };
  if (agentId) updateData.agent_id = agentId;
  if (livreurId) updateData.livreur_id = livreurId;

  const { data, error } = await supabase
    .from('commandes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Commande;
}

export async function createCommande(commande: Partial<Commande>) {
  const { data, error } = await supabase
    .from('commandes')
    .insert(commande)
    .select()
    .single();
  if (error) throw error;
  return data as Commande;
}

export async function createCommandeProduits(items: Partial<CommandeProduit>[]) {
  const { data, error } = await supabase
    .from('commande_produits')
    .insert(items)
    .select();
  if (error) throw error;
  return data as CommandeProduit[];
}

// ============================================
// COMMANDES KPIs
// ============================================
export async function getCommandesKpis(userId?: string) {
  let query = supabase.from('commandes').select('statut');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;

  const counts = {
    nouveau: 0, confirme: 0, en_preparation: 0, expedie: 0,
    livre: 0, echoue: 0, reporte: 0, en_retour: 0, retourne: 0,
  };
  (data ?? []).forEach((c: { statut: string }) => {
    if (c.statut in counts) (counts as Record<string, number>)[c.statut]++;
  });

  return {
    total: data?.length ?? 0,
    ...counts,
  };
}

// ============================================
// BLACKLIST
// ============================================
export async function getBlacklist() {
  const { data, error } = await supabase
    .from('blacklist')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Blacklist[];
}

export async function addToBlacklist(entry: Partial<Blacklist>) {
  const { data, error } = await supabase
    .from('blacklist')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as Blacklist;
}

export async function removeFromBlacklist(id: string) {
  const { error } = await supabase
    .from('blacklist')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function checkBlacklist(telephone: string) {
  const { data, error } = await supabase
    .from('blacklist')
    .select('*')
    .eq('telephone', telephone);
  if (error) throw error;
  return (data ?? []).length > 0;
}

// ============================================
// DEPENSES
// ============================================
export async function getDepenses(userId?: string) {
  let query = supabase
    .from('depenses')
    .select('*, produit:produits(*)')
    .order('date_depense', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Depense & { produit: Produit })[];
}

export async function createDepense(depense: Partial<Depense>) {
  const { data, error } = await supabase
    .from('depenses')
    .insert(depense)
    .select()
    .single();
  if (error) throw error;
  return data as Depense;
}

// ============================================
// COMMISSIONS
// ============================================
export async function getCommissions(userId?: string) {
  let query = supabase
    .from('commissions')
    .select('*, commande:commandes(*), user:users!commissions_user_id_fkey(*)')
    .order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Commission & { commande: Commande; user: User })[];
}

export async function createCommission(commission: Partial<Commission>) {
  const { data, error } = await supabase
    .from('commissions')
    .insert(commission)
    .select()
    .single();
  if (error) throw error;
  return data as Commission;
}

// ============================================
// APPELS
// ============================================
export async function getAppels(agentId?: string) {
  let query = supabase
    .from('appels')
    .select('*, commande:commandes(*)')
    .order('date_appel', { ascending: false });
  if (agentId) query = query.eq('agent_id', agentId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Appel & { commande: Commande })[];
}

export async function createAppel(appel: Partial<Appel>) {
  const { data, error } = await supabase
    .from('appels')
    .insert(appel)
    .select()
    .single();
  if (error) throw error;
  return data as Appel;
}

// ============================================
// RAPPELS
// ============================================
export async function getRappels(agentId?: string) {
  let query = supabase
    .from('rappels')
    .select('*, commande:commandes(*)')
    .order('date_rappel', { ascending: true });
  if (agentId) query = query.eq('agent_id', agentId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Rappel & { commande: Commande })[];
}

export async function createRappel(rappel: Partial<Rappel>) {
  const { data, error } = await supabase
    .from('rappels')
    .insert(rappel)
    .select()
    .single();
  if (error) throw error;
  return data as Rappel;
}

export async function updateRappelStatut(id: string, statut: string) {
  const { error } = await supabase
    .from('rappels')
    .update({ statut })
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// TOURNEES
// ============================================
export async function getTournees(livreurId?: string) {
  let query = supabase
    .from('tournees')
    .select('*')
    .order('date', { ascending: false });
  if (livreurId) query = query.eq('livreur_id', livreurId);

  const { data, error } = await query;
  if (error) throw error;
  return data as Tournee[];
}

export async function getTourneeEnCours(livreurId: string) {
  const { data, error } = await supabase
    .from('tournees')
    .select('*')
    .eq('livreur_id', livreurId)
    .eq('statut', 'en_cours')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Tournee | null;
}

export async function getTourneeCommandes(tourneeId: string) {
  const { data, error } = await supabase
    .from('tournee_commandes')
    .select('*, commande:commandes(*)')
    .eq('tournee_id', tourneeId)
    .order('ordre', { ascending: true });
  if (error) throw error;
  return data as (TourneeCommande & { commande: Commande })[];
}

export async function getAllTourneeCommandes(livreurId?: string) {
  let query = supabase
    .from('tournee_commandes')
    .select('*, commande:commandes(*), tournee:tournees(*)')
    .order('ordre', { ascending: true });

  if (livreurId) {
    query = query.eq('tournee.livreur_id', livreurId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (TourneeCommande & { commande: Commande; tournee: Tournee })[];
}

export async function updateTourneeCommande(id: string, updates: Partial<TourneeCommande>) {
  const { error } = await supabase
    .from('tournee_commandes')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// RETOURS
// ============================================
export async function getRetours(livreurId?: string) {
  let query = supabase
    .from('retours')
    .select('*, commande:commandes(*)')
    .order('date_retour', { ascending: false });
  if (livreurId) query = query.eq('livreur_id', livreurId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (Retour & { commande: Commande })[];
}

export async function updateRetour(id: string, updates: Partial<Retour>) {
  const { error } = await supabase
    .from('retours')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function createRetour(retour: Partial<Retour>) {
  const { data, error } = await supabase
    .from('retours')
    .insert(retour)
    .select()
    .single();
  if (error) throw error;
  return data as Retour;
}

// ============================================
// REMISES CASH
// ============================================
export async function getRemisesCash(livreurId?: string) {
  let query = supabase
    .from('remises_cash')
    .select('*, tournee:tournees(*)')
    .order('date_remise', { ascending: false });
  if (livreurId) query = query.eq('livreur_id', livreurId);

  const { data, error } = await query;
  if (error) throw error;
  return data as (RemiseCash & { tournee: Tournee })[];
}

export async function createRemiseCash(remise: Partial<RemiseCash>) {
  const { data, error } = await supabase
    .from('remises_cash')
    .insert(remise)
    .select()
    .single();
  if (error) throw error;
  return data as RemiseCash;
}

// ============================================
// COMMISSIONS — MUTATIONS ADMIN
// ============================================
export async function updateCommissionStatut(id: string, statut: StatutCommission) {
  const updateData: Record<string, unknown> = { statut };
  if (statut === 'approuvee') updateData.date_approbation = new Date().toISOString();
  if (statut === 'payee') updateData.date_paiement = new Date().toISOString();

  const { error } = await supabase
    .from('commissions')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// USERS — MUTATION ADMIN
// ============================================
export async function updateUser(id: string, updates: Partial<User>) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function createUser(userData: { nom: string; email: string; role: string; commission_pct?: number }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      nom: userData.nom,
      email: userData.email,
      role: userData.role,
      commission_pct: userData.commission_pct ?? 0,
      password_hash: 'managed_by_supabase_auth',
      actif: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

// ============================================
// TOURNEES — MUTATIONS
// ============================================
export async function createTournee(tournee: { livreur_id: string; date: string; statut?: string }) {
  const { data, error } = await supabase
    .from('tournees')
    .insert({ ...tournee, statut: tournee.statut ?? 'en_preparation' })
    .select()
    .single();
  if (error) throw error;
  return data as Tournee;
}

export async function createTourneeCommande(tc: { tournee_id: string; commande_id: string; ordre: number }) {
  const { data, error } = await supabase
    .from('tournee_commandes')
    .insert(tc)
    .select()
    .single();
  if (error) throw error;
  return data as TourneeCommande;
}

export async function closeTournee(tourneeId: string) {
  const { error } = await supabase
    .from('tournees')
    .update({ statut: 'cloturee', date_cloture: new Date().toISOString() })
    .eq('id', tourneeId);
  if (error) throw error;
}

// ============================================
// PAIEMENTS (RETRAITS)
// ============================================
export async function getPaiements(userId?: string) {
  let query = supabase
    .from('paiements')
    .select('*')
    .order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return data as import('../types').Paiement[];
}

export async function createPaiement(paiement: Partial<import('../types').Paiement>) {
  const { data, error } = await supabase
    .from('paiements')
    .insert(paiement)
    .select()
    .single();
  if (error) throw error;
  return data as import('../types').Paiement;
}

// ============================================
// COMMANDES — UPDATE GENERIQUE
// ============================================
export async function updateCommande(id: string, updates: Partial<Commande>) {
  const { error } = await supabase
    .from('commandes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
