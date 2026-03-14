'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandesKpis, getUsers, getCommissions, getCommandes } from '@/lib/supabase/queries';
import type { User, Commande } from '@/lib/types';

export default function AdminDashboardPage() {
  const { data: kpisData, loading: l1 } = useSupabase(() => getCommandesKpis(), []);
  const { data: usersData, loading: l2 } = useSupabase(() => getUsers(), []);
  const { data: commissionsData, loading: l3 } = useSupabase(() => getCommissions(), []);
  const { data: commandesData, loading: l4 } = useSupabase(() => getCommandes(), []);

  if (l1 || l2 || l3 || l4) return <LoadingPage />;

  const kpis = kpisData ?? { total: 0, nouveau: 0, confirme: 0, en_preparation: 0, expedie: 0, livre: 0, echoue: 0, reporte: 0, en_retour: 0, retourne: 0 };
  const users = usersData ?? [];
  const commissions = commissionsData ?? [];
  const commandes = commandesData ?? [];

  const commissionsEnAttente = commissions.filter((c) => c.statut === 'en_attente').length;
  const agentsCC = users.filter((u) => u.role === 'call_center' || u.role === 'superviseur_cc').length;
  const livreurs = users.filter((u) => u.role === 'livreur' || u.role === 'responsable_logistique').length;

  const kpiCards = [
    { label: 'Commandes totales', value: kpis.total },
    { label: 'Commissions en attente', value: commissionsEnAttente },
    { label: 'Agents call center', value: agentsCC },
    { label: 'Livreurs', value: livreurs },
  ];

  // Commandes par statut
  const commandesParStatut: Record<string, number> = {};
  const statutKeys = ['nouveau', 'confirme', 'en_preparation', 'expedie', 'livre', 'echoue', 'reporte', 'en_retour', 'retourne'] as const;
  statutKeys.forEach((s) => {
    const count = kpis[s as keyof typeof kpis];
    if (typeof count === 'number' && count > 0) {
      commandesParStatut[s] = count;
    }
  });

  // Top agents (call_center) par livraisons
  const ccAgents = users.filter((u) => u.role === 'call_center' || u.role === 'superviseur_cc');
  const topAgents = ccAgents
    .map((agent: User) => {
      const confirmes = commandes.filter((c: Commande) => c.agent_id === agent.id && c.statut === 'confirme').length;
      const livres = commandes.filter((c: Commande) => c.agent_id === agent.id && c.statut === 'livre').length;
      return { agent, confirmes, livres };
    })
    .sort((a, b) => b.livres - a.livres)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">Vue globale CRM</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(commandesParStatut).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande.</p>
            ) : (
              Object.entries(commandesParStatut).map(([statut, total]) => (
                <div key={statut} className="flex items-center justify-between border-b last:border-b-0 py-2">
                  <span className="capitalize">{statut.replace('_', ' ')}</span>
                  <Badge variant="secondary">{total}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top agents (livraisons)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun agent.</p>
            ) : (
              topAgents.map(({ agent, confirmes, livres }) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{agent.nom}</p>
                    <p className="text-xs text-muted-foreground">{agent.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Conf.: {confirmes}</p>
                    <p className="text-sm">Livre: {livres}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
