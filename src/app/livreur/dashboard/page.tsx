'use client';

import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/error-display';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import {
  getTourneeEnCours,
  getTourneeCommandes,
  getTournees,
  getUsersByRole,
} from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { AlertTriangle, CheckCircle, Users } from 'lucide-react';
import type { Tournee, TourneeCommande, Commande } from '@/lib/types';

// ─── Vue Livreur ────────────────────────────────────────────────────────────
function LivreurDashboard() {
  const { user } = useAuth();
  const { data: tourneeActuelle, loading: loadingTournee, error } = useSupabase(
    () => (user ? getTourneeEnCours(user.id) : Promise.resolve(null)),
    [user?.id]
  );
  const tourneeId = tourneeActuelle?.id;
  const { data: rawCommandes, loading: loadingCommandes } = useSupabase(
    () => (tourneeId ? getTourneeCommandes(tourneeId) : Promise.resolve([])),
    [tourneeId]
  );

  if (loadingTournee || loadingCommandes) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  const commandes = rawCommandes ?? [];
  const stats = (() => {
    const total = commandes.length;
    const livre = commandes.filter((c) => c.statut_livraison === 'livre').length;
    const enCours = commandes.filter((c) => c.statut_livraison === 'en_cours').length;
    const retourne = commandes.filter((c) => c.statut_livraison === 'retourne').length;
    const cashCollecte = commandes
      .filter((c) => c.montant_collecte != null)
      .reduce((sum, c) => sum + (c.montant_collecte ?? 0), 0);
    const tauxLivraison = total > 0 ? Math.round((livre / total) * 100) : 0;
    return { total, livre, enCours, retourne, cashCollecte, tauxLivraison };
  })();

  const alerts = (() => {
    const items: { type: 'warning' | 'info'; message: string }[] = [];
    const sansAdresse = commandes.filter(
      (c) => c.commande && (!c.commande.adresse || c.commande.adresse.trim() === '')
    );
    if (sansAdresse.length > 0)
      items.push({ type: 'warning', message: `${sansAdresse.length} colis avec adresse incomplète` });
    const enAttenteCount = commandes.filter((c) => c.statut_livraison === 'en_attente').length;
    if (enAttenteCount > 0)
      items.push({ type: 'warning', message: `${enAttenteCount} colis en attente de prise en charge` });
    if (stats.retourne > 0)
      items.push({ type: 'info', message: `${stats.retourne} colis retournés aujourd'hui` });
    if (stats.tauxLivraison >= 80)
      items.push({ type: 'info', message: `Excellent taux de livraison: ${stats.tauxLivraison}%` });
    return items;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Livreur</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tournée du {tourneeActuelle?.date ?? "Aujourd'hui"} — {commandes.length} colis
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Colis à livrer" value={stats.total} color="border-l-blue-500" subtitle="Total tournée" />
        <KpiCard label="Livrés" value={stats.livre} color="border-l-green-500" subtitle="Confirmés" />
        <KpiCard label="En cours" value={stats.enCours} color="border-l-orange-500" subtitle="À traiter" />
        <KpiCard label="Retournés" value={stats.retourne} color="border-l-red-500" subtitle="Échecs" />
        <KpiCard label="Cash collecté" value={formatCurrency(stats.cashCollecte)} color="border-l-emerald-500" subtitle="Total encaissé" />
        <KpiCard label="Taux de livraison" value={`${stats.tauxLivraison}%`} color={stats.tauxLivraison >= 70 ? 'border-l-green-500' : 'border-l-red-500'} subtitle={stats.tauxLivraison >= 70 ? 'Bon' : 'À améliorer'} />
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{stats.livre}/{stats.total} colis livrés</span>
            <span className="text-sm text-muted-foreground">{stats.tauxLivraison}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${stats.tauxLivraison}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Livrés ({stats.livre})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />En cours ({stats.enCours})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Retournés ({stats.retourne})</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alertes et rappels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Aucune alerte — tout est en ordre.
            </div>
          ) : (
            alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm p-3 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {alert.message}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Vue Responsable Logistique ──────────────────────────────────────────────
function ResponsableDashboard() {
  const { data: livreurs, loading: l1, error } = useSupabase(() => getUsersByRole('livreur'), []);
  const { data: allTournees, loading: l2 } = useSupabase(() => getTournees(), []);

  if (l1 || l2) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  const today = new Date().toISOString().split('T')[0];
  const tourneesAujourdhui = (allTournees ?? []).filter((t) => t.date === today);

  const livreursAvecTournee = (livreurs ?? []).map((livreur) => {
    const tournee = tourneesAujourdhui.find((t) => t.livreur_id === livreur.id);
    return { livreur, tournee: tournee ?? null };
  });

  const nbAvecTournee = livreursAvecTournee.filter((l) => l.tournee).length;
  const nbSansTournee = livreursAvecTournee.filter((l) => !l.tournee).length;
  const nbEnCours = tourneesAujourdhui.filter((t) => t.statut === 'en_cours').length;
  const nbCloturees = tourneesAujourdhui.filter((t) => t.statut === 'cloturee').length;

  const getStatutBadge = (tournee: Tournee | null) => {
    if (!tournee) return { label: 'Sans tournée', cls: 'bg-gray-100 text-gray-600' };
    if (tournee.statut === 'en_preparation') return { label: 'En préparation', cls: 'bg-yellow-100 text-yellow-700' };
    if (tournee.statut === 'en_cours') return { label: 'En cours', cls: 'bg-green-100 text-green-700' };
    return { label: 'Clôturée', cls: 'bg-blue-100 text-blue-700' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Logistique</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vue globale des livreurs — {today}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Livreurs total" value={livreurs?.length ?? 0} color="border-l-blue-500" subtitle="Actifs" />
        <KpiCard label="Avec tournée" value={nbAvecTournee} color="border-l-green-500" subtitle="Aujourd'hui" />
        <KpiCard label="En cours" value={nbEnCours} color="border-l-orange-500" subtitle="Tournées actives" />
        <KpiCard label="Clôturées" value={nbCloturees} color="border-l-purple-500" subtitle="Terminées" />
      </div>

      {/* Alerte livreurs sans tournée */}
      {nbSansTournee > 0 && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {nbSansTournee} livreur(s) sans tournée aujourd&apos;hui — pensez à créer leurs tournées.
        </div>
      )}

      {/* Tableau livreurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Statut des livreurs ({livreurs?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {livreursAvecTournee.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun livreur trouvé</p>
          ) : (
            <div className="space-y-2">
              {livreursAvecTournee.map(({ livreur, tournee }) => {
                const badge = getStatutBadge(tournee);
                return (
                  <div
                    key={livreur.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {livreur.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{livreur.nom}</p>
                        <p className="text-xs text-muted-foreground">{livreur.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Export principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return <LoadingPage />;

  if (user.role === 'responsable_logistique') {
    return <ResponsableDashboard />;
  }

  return <LivreurDashboard />;
}
