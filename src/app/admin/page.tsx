import { mockCommandes, mockUsers, mockCommissions } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function countByRole(role: string) {
  return mockUsers.filter((u) => u.role === role).length;
}

const kpis = [
  { label: 'Commandes totales', value: mockCommandes.length },
  { label: 'Commissions en attente', value: mockCommissions.filter((c) => c.statut === 'en_attente').length },
  { label: 'Agents call center', value: countByRole('call_center') },
  { label: 'Livreurs', value: countByRole('livreur') },
];

export default function AdminDashboardPage() {
  const commandesParStatut = mockCommandes.reduce<Record<string, number>>((acc, c) => {
    acc[c.statut] = (acc[c.statut] || 0) + 1;
    return acc;
  }, {});

  const topAgents = mockUsers
    .filter((u) => u.role === 'call_center')
    .map((agent) => {
      const confirmes = mockCommandes.filter((c) => c.agent_id === agent.id && c.statut === 'confirme').length;
      const livres = mockCommandes.filter((c) => c.agent_id === agent.id && c.statut === 'livre').length;
      return { agent, confirmes, livres };
    })
    .sort((a, b) => b.livres - a.livres)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">Vue globale CRM (démo mock-data)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
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
            {Object.entries(commandesParStatut).map(([statut, total]) => (
              <div key={statut} className="flex items-center justify-between border-b last:border-b-0 py-2">
                <span className="capitalize">{statut.replace('_', ' ')}</span>
                <Badge variant="secondary">{total}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top agents (livraisons)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAgents.map(({ agent, confirmes, livres }) => (
              <div key={agent.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{agent.nom}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Conf.: {confirmes}</p>
                  <p className="text-sm">Livré: {livres}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
