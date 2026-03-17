'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangeFilter, filterByDateRange } from '@/components/date-range-filter';
import { ErrorDisplay } from '@/components/error-display';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandes, getAppels, getRappels, getUsersByRole } from '@/lib/supabase/queries';
import { AlertTriangle, Users, Phone, Clock, TrendingUp } from 'lucide-react';

export default function SupervisionPage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: agentsCC, loading: l1, error } = useSupabase(() => getUsersByRole('call_center'), []);
  const { data: superviseurs, loading: l2 } = useSupabase(() => getUsersByRole('superviseur_cc'), []);
  const { data: commandesData, loading: l3 } = useSupabase(() => getCommandes(), []);
  const { data: appelsData, loading: l4 } = useSupabase(() => getAppels(), []);
  const { data: rappelsData, loading: l5 } = useSupabase(() => getRappels(), []);

  if (l1 || l2 || l3 || l4 || l5) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  const allAgents = [...(agentsCC ?? []), ...(superviseurs ?? [])];
  const allCommandes = commandesData ?? [];
  const allAppels = appelsData ?? [];
  const allRappels = rappelsData ?? [];

  const filteredCommandes = filterByDateRange(allCommandes, 'created_at', dateDebut, dateFin);
  const filteredAppels = filterByDateRange(allAppels, 'date_appel', dateDebut, dateFin);

  // Rappels en retard (date passée + statut en_attente)
  const now = new Date();
  const rappelsEnRetard = allRappels.filter(
    (r) => r.statut === 'en_attente' && new Date(r.date_rappel) < now
  );

  // KPIs globaux
  const totalLeadsNouveaux = allCommandes.filter((c) => c.statut === 'nouveau').length;
  const totalConfirmesAujourdhui = (() => {
    const today = new Date().toDateString();
    return allCommandes.filter(
      (c) => c.statut === 'confirme' && new Date(c.updated_at).toDateString() === today
    ).length;
  })();
  const totalAppelsAujourdhui = (() => {
    const today = new Date().toDateString();
    return allAppels.filter((a) => new Date(a.date_appel).toDateString() === today).length;
  })();
  const tauxGlobal = (() => {
    const traites = filteredCommandes.filter((c) =>
      ['confirme', 'echoue', 'reporte'].includes(c.statut)
    ).length;
    const confirmes = filteredCommandes.filter((c) => c.statut === 'confirme').length;
    return traites > 0 ? Math.round((confirmes / traites) * 100) : 0;
  })();

  // Stats par agent
  const agentStats = allAgents.map((agent) => {
    const agentAppels = filteredAppels.filter((a) => a.agent_id === agent.id);
    const agentCommandes = filteredCommandes.filter((c) => c.agent_id === agent.id);
    const agentRappelsEnRetard = rappelsEnRetard.filter((r) => r.agent_id === agent.id).length;

    const confirmes = agentCommandes.filter((c) => c.statut === 'confirme').length;
    const echoues = agentCommandes.filter((c) => c.statut === 'echoue').length;
    const reportes = agentCommandes.filter((c) => c.statut === 'reporte').length;
    const traites = confirmes + echoues + reportes;
    const taux = traites > 0 ? Math.round((confirmes / traites) * 100) : 0;

    const dernierAppel = agentAppels[0]?.date_appel;
    const minutesDepuisDernierAppel = dernierAppel
      ? Math.floor((now.getTime() - new Date(dernierAppel).getTime()) / 60000)
      : null;

    return {
      id: agent.id,
      nom: agent.nom,
      role: agent.role,
      totalAppels: agentAppels.length,
      confirmes,
      echoues,
      reportes,
      traites,
      taux,
      rappelsEnRetard: agentRappelsEnRetard,
      dernierAppel: minutesDepuisDernierAppel,
    };
  });

  const getStatutAgent = (minutesSinceLastCall: number | null) => {
    if (minutesSinceLastCall === null) return { label: 'Inactif', color: 'bg-gray-100 text-gray-600' };
    if (minutesSinceLastCall < 15) return { label: 'Actif', color: 'bg-green-100 text-green-700' };
    if (minutesSinceLastCall < 60) return { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Absent', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervision</h1>
        <p className="text-sm text-gray-500 mt-1">Vue temps réel de l&apos;équipe call centre</p>
      </div>

      <DateRangeFilter
        dateDebut={dateDebut}
        dateFin={dateFin}
        onDateDebutChange={setDateDebut}
        onDateFinChange={setDateFin}
      />

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allAgents.length}</p>
              <p className="text-xs text-muted-foreground">Agents total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLeadsNouveaux}</p>
              <p className="text-xs text-muted-foreground">Leads en attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tauxGlobal}%</p>
              <p className="text-xs text-muted-foreground">Taux global</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{rappelsEnRetard.length}</p>
              <p className="text-xs text-muted-foreground">Rappels en retard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes rappels en retard */}
      {rappelsEnRetard.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rappels en retard ({rappelsEnRetard.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rappelsEnRetard.slice(0, 10).map((r) => {
                const agent = allAgents.find((a) => a.id === r.agent_id);
                const minutesRetard = Math.floor(
                  (now.getTime() - new Date(r.date_rappel).getTime()) / 60000
                );
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border border-red-100"
                  >
                    <span className="font-medium">{agent?.nom ?? 'Agent inconnu'}</span>
                    <span className="text-gray-500">
                      Commande #{r.commande_id.slice(0, 8)}
                    </span>
                    <span className="text-red-600 font-medium">
                      {minutesRetard < 60
                        ? `${minutesRetard}min de retard`
                        : `${Math.floor(minutesRetard / 60)}h de retard`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Activité des agents</span>
            <span className="text-sm font-normal text-muted-foreground">
              {totalAppelsAujourdhui} appels aujourd&apos;hui · {totalConfirmesAujourdhui} confirmés
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Appels</TableHead>
                <TableHead className="text-center">Traités</TableHead>
                <TableHead className="text-center">Confirmés</TableHead>
                <TableHead className="text-center">Taux</TableHead>
                <TableHead className="text-center">Rappels retard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucun agent trouvé
                  </TableCell>
                </TableRow>
              ) : (
                agentStats.map((agent) => {
                  const statut = getStatutAgent(agent.dernierAppel);
                  return (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {agent.role === 'superviseur_cc' ? 'Superviseur' : 'Agent'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                          {statut.label}
                          {agent.dernierAppel !== null && (
                            <span className="ml-1 opacity-70">
                              ({agent.dernierAppel < 60
                                ? `${agent.dernierAppel}min`
                                : `${Math.floor(agent.dernierAppel / 60)}h`})
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{agent.totalAppels}</TableCell>
                      <TableCell className="text-center">{agent.traites}</TableCell>
                      <TableCell className="text-center text-green-700 font-medium">
                        {agent.confirmes}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                agent.taux >= 70
                                  ? 'bg-green-500'
                                  : agent.taux >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${agent.taux}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{agent.taux}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {agent.rappelsEnRetard > 0 ? (
                          <span className="text-red-600 font-bold">{agent.rappelsEnRetard}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
