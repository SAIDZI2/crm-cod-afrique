'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandes, getAppels, getUsersByRole } from '@/lib/supabase/queries';

export default function StatistiquesPage() {
  const { data: commandesData, loading: l1 } = useSupabase(() => getCommandes(), []);
  const { data: appelsData, loading: l2 } = useSupabase(() => getAppels(), []);
  const { data: usersData, loading: l3 } = useSupabase(() => getUsersByRole('call_center'), []);

  if (l1 || l2 || l3) return <LoadingPage />;
  const allCommandes = commandesData ?? [];
  const allAppels = appelsData ?? [];
  const agents = usersData ?? [];

  // Agent stats
  const agentStats = agents.map((agent) => {
    const agentAppels = allAppels.filter((a) => a.agent_id === agent.id);
    const agentCommandes = allCommandes.filter((c) => c.agent_id === agent.id);

    const confirmes = agentCommandes.filter((c) => c.statut === 'confirme').length;
    const echoues = agentCommandes.filter((c) => c.statut === 'echoue').length;
    const reportes = agentCommandes.filter((c) => c.statut === 'reporte').length;
    const traites = confirmes + echoues + reportes;
    const tauxConfirmation = traites > 0 ? Math.round((confirmes / traites) * 100) : 0;

    const totalDuree = agentAppels.reduce((acc, a) => acc + a.duree_secondes, 0);
    const tempsMoyen = agentAppels.length > 0 ? Math.round(totalDuree / agentAppels.length) : 0;
    const tempsMoyenMin = Math.floor(tempsMoyen / 60);
    const tempsMoyenSec = tempsMoyen % 60;

    const appelsParHeure = agentAppels.length > 0 ? (agentAppels.length / 8).toFixed(1) : '0';

    const hourCounts: Record<number, number> = {};
    agentAppels.forEach((a) => {
      const hour = new Date(a.date_appel).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const bestHourEntry = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
    const meilleureHeure = bestHourEntry ? `${bestHourEntry[0]}h00` : '-';

    const upsells = Math.floor(confirmes * 0.2);

    return {
      id: agent.id,
      nom: agent.nom,
      totalTraites: traites,
      confirmes,
      tauxConfirmation,
      echoues,
      reportes,
      upsells,
      tempsMoyen: `${tempsMoyenMin}m ${String(tempsMoyenSec).padStart(2, '0')}s`,
      appelsParHeure,
      meilleureHeure,
      totalAppels: agentAppels.length,
    };
  });

  const personalStats = agentStats[0];

  // Chart data: confirmes vs echoues vs reportes par jour
  const barChartData = (() => {
    const days: Record<string, { jour: string; confirmes: number; echoues: number; reportes: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      days[key] = { jour: key, confirmes: 0, echoues: 0, reportes: 0 };
    }
    allCommandes.forEach((c) => {
      const dateKey = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (days[dateKey]) {
        if (c.statut === 'confirme') days[dateKey].confirmes++;
        else if (c.statut === 'echoue') days[dateKey].echoues++;
        else if (c.statut === 'reporte') days[dateKey].reportes++;
      }
    });
    return Object.values(days);
  })();

  // Line chart data
  const lineChartData = (() => {
    const days: Record<string, { jour: string; total: number; confirmes: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      days[key] = { jour: key, total: 0, confirmes: 0 };
    }
    allCommandes.forEach((c) => {
      const dateKey = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (days[dateKey]) {
        if (['confirme', 'echoue', 'reporte'].includes(c.statut)) {
          days[dateKey].total++;
          if (c.statut === 'confirme') days[dateKey].confirmes++;
        }
      }
    });
    return Object.values(days).map((d) => ({
      jour: d.jour,
      taux: d.total > 0 ? Math.round((d.confirmes / d.total) * 100) : 0,
    }));
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-1">Performances individuelles et equipe</p>
      </div>

      {/* Personal Stats */}
      {personalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes Statistiques - {personalStats.nom}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{personalStats.totalTraites}</p>
                <p className="text-xs text-muted-foreground">Total traites</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{personalStats.confirmes}</p>
                <p className="text-xs text-muted-foreground">Confirmes</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{personalStats.tauxConfirmation}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      personalStats.tauxConfirmation >= 70
                        ? 'bg-green-500'
                        : personalStats.tauxConfirmation >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${personalStats.tauxConfirmation}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Taux confirmation</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{personalStats.echoues}</p>
                <p className="text-xs text-muted-foreground">Echoues</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{personalStats.reportes}</p>
                <p className="text-xs text-muted-foreground">Reportes en cours</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{personalStats.upsells}</p>
                <p className="text-xs text-muted-foreground">Upsells</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{personalStats.tempsMoyen}</p>
                <p className="text-xs text-muted-foreground">Temps moyen/appel</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{personalStats.appelsParHeure}</p>
                <p className="text-xs text-muted-foreground">Appels/heure</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{personalStats.meilleureHeure}</p>
                <p className="text-xs text-muted-foreground">Meilleure heure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparaison Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-center">Total traites</TableHead>
                <TableHead className="text-center">Confirmes</TableHead>
                <TableHead className="text-center">Taux confirmation</TableHead>
                <TableHead className="text-center">Echoues</TableHead>
                <TableHead className="text-center">Reportes</TableHead>
                <TableHead className="text-center">Upsells</TableHead>
                <TableHead className="text-center">Temps moyen</TableHead>
                <TableHead className="text-center">Appels/h</TableHead>
                <TableHead className="text-center">Meilleure heure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentStats.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.nom}</TableCell>
                  <TableCell className="text-center">{agent.totalTraites}</TableCell>
                  <TableCell className="text-center text-green-700 font-medium">
                    {agent.confirmes}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            agent.tauxConfirmation >= 70
                              ? 'bg-green-500'
                              : agent.tauxConfirmation >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${agent.tauxConfirmation}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{agent.tauxConfirmation}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-red-700">{agent.echoues}</TableCell>
                  <TableCell className="text-center text-orange-700">{agent.reportes}</TableCell>
                  <TableCell className="text-center text-purple-700">{agent.upsells}</TableCell>
                  <TableCell className="text-center">{agent.tempsMoyen}</TableCell>
                  <TableCell className="text-center">{agent.appelsParHeure}</TableCell>
                  <TableCell className="text-center">{agent.meilleureHeure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmes vs Echoues vs Reportes par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={barChartData}
              xKey="jour"
              bars={[
                { key: 'confirmes', color: '#22c55e', label: 'Confirmes' },
                { key: 'echoues', color: '#ef4444', label: 'Echoues' },
                { key: 'reportes', color: '#f97316', label: 'Reportes' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taux de confirmation sur 7 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={lineChartData}
              xKey="jour"
              lines={[
                { key: 'taux', color: '#3b82f6', label: 'Taux de confirmation (%)' },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
