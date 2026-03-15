'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/kpi-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getCommandesKpis, getCommandes, getCommissions, getDepenses } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';

export default function MediaBuyerDashboard() {
  const { user } = useAuth();
  const { data: kpis, loading: loadingKpis } = useSupabase(() => (user ? getCommandesKpis(user.id) : Promise.resolve(undefined)), [user?.id]);
  const { data: commandes, loading: loadingCommandes } = useSupabase(() => (user ? getCommandes({ userId: user.id }) : Promise.resolve([])), [user?.id]);
  const { data: commissions, loading: loadingCommissions } = useSupabase(() => (user ? getCommissions(user.id) : Promise.resolve([])), [user?.id]);
  const { data: depenses, loading: loadingDepenses } = useSupabase(() => (user ? getDepenses(user.id) : Promise.resolve([])), [user?.id]);

  if (loadingKpis || loadingCommandes || loadingCommissions || loadingDepenses) return <LoadingPage />;

  const k = kpis ?? { total: 0, nouveau: 0, confirme: 0, en_preparation: 0, expedie: 0, livre: 0, echoue: 0, reporte: 0, en_retour: 0, retourne: 0 };
  const commandesList = commandes ?? [];
  const commissionsList = commissions ?? [];
  const depensesList = depenses ?? [];

  const kpiCards = [
    { label: 'Leads Crees', value: k.total, color: 'border-orange-500' },
    { label: 'Traites', value: k.total - k.nouveau, color: 'border-green-500' },
    { label: 'Nouveaux', value: k.nouveau, color: 'border-blue-500' },
    { label: 'Confirmés', value: k.confirme, color: 'border-green-500' },
    { label: 'En Préparation', value: k.en_preparation, color: 'border-yellow-500' },
    { label: 'Expédiés', value: k.expedie, color: 'border-indigo-500' },
    { label: 'Echoues', value: k.echoue, color: 'border-red-500' },
    { label: 'Reportes', value: k.reporte, color: 'border-purple-500' },
    { label: 'En Retour', value: k.en_retour, color: 'border-orange-500' },
    { label: 'Retournes', value: k.retourne, color: 'border-gray-500' },
    { label: 'Livres', value: k.livre, color: 'border-emerald-500' },
  ];

  const enCours = k.confirme + k.en_preparation + k.expedie;
  const tauxLivraison = k.total > 0 ? ((k.livre / k.total) * 100).toFixed(1) : '0';

  const totalDu = commissionsList.reduce((sum, c) => sum + c.montant, 0);
  const totalPaye = commissionsList.filter((c) => c.statut === 'payee').reduce((sum, c) => sum + c.montant, 0);
  const resteAPayer = totalDu - totalPaye;

  const totalDepenses = depensesList.reduce((sum, d) => sum + d.montant, 0);

  const donutData = [
    { name: 'Nouveaux', value: k.nouveau, color: '#3b82f6' },
    { name: 'Confirmés', value: k.confirme, color: '#22c55e' },
    { name: 'En Préparation', value: k.en_preparation, color: '#eab308' },
    { name: 'Expédiés', value: k.expedie, color: '#6366f1' },
    { name: 'Livres', value: k.livre, color: '#10b981' },
    { name: 'Echoues', value: k.echoue, color: '#ef4444' },
    { name: 'Reportes', value: k.reporte, color: '#a855f7' },
    { name: 'En Retour', value: k.en_retour, color: '#f97316' },
    { name: 'Retournes', value: k.retourne, color: '#6b7280' },
  ].filter((d) => d.value > 0);

  const lineData = (() => {
    const grouped: Record<string, { leads: number; livres: number }> = {};
    commandesList.forEach((c) => {
      const day = c.created_at.substring(0, 10);
      if (!grouped[day]) grouped[day] = { leads: 0, livres: 0 };
      grouped[day].leads++;
      if (c.statut === 'livre') grouped[day].livres++;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, leads: data.leads, livres: data.livres }));
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Media Buyer</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} color={kpi.color} />
        ))}
      </div>

      {/* Performance + Ads Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Leads Total</span>
              <span className="font-semibold">{k.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">En Cours</span>
              <span className="font-semibold">{enCours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Livres / Total</span>
              <span className="font-semibold">
                {k.livre} / {k.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Taux de Livraison</span>
              <span className="font-semibold text-emerald-600">{tauxLivraison}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ads Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Depenses Ads</span>
              <span className="font-semibold">{formatCurrency(totalDepenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Du (Commissions)</span>
              <span className="font-semibold">{formatCurrency(totalDu)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Paye</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalPaye)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reste a Payer</span>
              <span className="font-semibold text-orange-600">{formatCurrency(resteAPayer)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Repartition des Statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance des Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={lineData}
              xKey="date"
              lines={[
                { key: 'leads', color: '#f97316', label: 'Leads' },
                { key: 'livres', color: '#10b981', label: 'Livres' },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
