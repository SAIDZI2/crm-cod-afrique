'use client';



import Link from 'next/link';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getCommandes, getRappels, getAppels } from '@/lib/supabase/queries';
import { formatCurrency, formatDateTime } from '@/lib/constants';
import { Phone } from 'lucide-react';

export default function CallCentreDashboard() {
  const { user } = useAuth();
  const { data: commandesData, loading: loadingCommandes } = useSupabase(() => getCommandes(), []);
  const { data: rappelsData, loading: loadingRappels } = useSupabase(
    () => user ? getRappels(user.id) : Promise.resolve([]), [user?.id]
  );
  const { data: appelsData, loading: loadingAppels } = useSupabase(
    () => user ? getAppels(user.id) : Promise.resolve([]), [user?.id]
  );

  if (loadingCommandes || loadingRappels || loadingAppels) return <LoadingPage />;

  const commandes = commandesData ?? [];
  const rappels = rappelsData ?? [];
  const appels = appelsData ?? [];

  const stats = (() => {
    const nouveau = commandes.filter((c) => c.statut === 'nouveau').length;
    const rappelsAujourdhui = rappels.filter((r) => r.statut === 'en_attente').length;
    // Filter by current agent for personal stats
    const myCommandes = user ? commandes.filter((c) => (c as unknown as { agent_id?: string }).agent_id === user.id) : commandes;
    const confirme = myCommandes.filter((c) => c.statut === 'confirme').length;
    const echoue = myCommandes.filter((c) => c.statut === 'echoue').length;
    const reporte = myCommandes.filter((c) => c.statut === 'reporte').length;
    const traites = confirme + echoue + reporte;
    const tauxConfirmation = traites > 0 ? Math.round((confirme / traites) * 100) : 0;

    return { nouveau, rappelsAujourdhui, confirme, echoue, reporte, traites, tauxConfirmation };
  })();

  const performanceStats = (() => {
    const appelsPassés = appels.length;
    const totalDuree = appels.reduce((acc, a) => acc + a.duree_secondes, 0);
    const dureeMoyenne = appelsPassés > 0 ? Math.round(totalDuree / appelsPassés) : 0;
    const minutes = Math.floor(dureeMoyenne / 60);
    const seconds = dureeMoyenne % 60;

    // Group calls by hour to find best hour
    const hourCounts: Record<number, number> = {};
    appels.forEach((a) => {
      const hour = new Date(a.date_appel).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const bestHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      appelsPassés,
      dureeMoyenne: `${minutes}m ${String(seconds).padStart(2, '0')}s`,
      meilleureHeure: bestHour ? `${bestHour[0]}h00` : '-',
    };
  })();

  const leadsUrgents = commandes
    .filter((c) => c.statut === 'nouveau')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Agent</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Nouveaux leads"
          value={stats.nouveau}
          color="border-l-blue-500"
          subtitle="En attente de traitement"
        />
        <KpiCard
          label="Rappels aujourd'hui"
          value={stats.rappelsAujourdhui}
          color="border-l-orange-500"
          subtitle="À effectuer"
        />
        <KpiCard
          label="Confirmés aujourd'hui"
          value={stats.confirme}
          color="border-l-green-500"
          subtitle="Commandes validées"
        />
        <KpiCard
          label="Échoués aujourd'hui"
          value={stats.echoue}
          color="border-l-red-500"
          subtitle="Non convertis"
        />
        <KpiCard
          label="Total traités"
          value={stats.traites}
          color="border-l-gray-500"
          subtitle="Confirmés + Échoués + Reportés"
        />
        <KpiCard
          label="Taux de confirmation"
          value={`${stats.tauxConfirmation}%`}
          color="border-l-emerald-500"
          subtitle="Confirmés / Traités"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance block */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Appels passés</span>
              <span className="font-semibold">{performanceStats.appelsPassés}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Durée moyenne</span>
              <span className="font-semibold">{performanceStats.dureeMoyenne}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meilleure heure</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                {performanceStats.meilleureHeure}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* File d'attente prioritaire */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">File d&apos;attente prioritaire</CardTitle>
            <Link href="/call-centre/file-appels">
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsUrgents.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.destinataire_nom}</TableCell>
                    <TableCell>{lead.ville}</TableCell>
                    <TableCell>{formatCurrency(lead.montant_total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(lead.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/call-centre/commande/${lead.id}`}>
                        <Button size="sm" className="gap-1">
                          <Phone className="w-3 h-3" />
                          Appeler
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {leadsUrgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun lead en attente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
