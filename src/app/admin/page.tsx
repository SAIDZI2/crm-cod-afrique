'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandesKpis, getUsers, getCommissions, getCommandes } from '@/lib/supabase/queries';
import { formatCurrency, STATUT_CONFIG } from '@/lib/constants';
import type { User, Commande, StatutCommande } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

type PeriodFilter = '7j' | '30j' | '90j' | 'tout';

function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByPeriod<T extends { created_at: string }>(items: T[], period: PeriodFilter): T[] {
  if (period === 'tout') return items;
  const daysMap: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90 };
  const cutoff = getDaysAgo(daysMap[period]);
  return items.filter((item) => new Date(item.created_at) >= cutoff);
}

const PIE_COLORS = [
  '#3b82f6', '#22c55e', '#eab308', '#6366f1', '#10b981',
  '#ef4444', '#a855f7', '#f97316', '#6b7280',
];

export default function AdminDashboardPage() {
  const { data: kpisData, loading: l1 } = useSupabase(() => getCommandesKpis(), []);
  const { data: usersData, loading: l2 } = useSupabase(() => getUsers(), []);
  const { data: commissionsData, loading: l3 } = useSupabase(() => getCommissions(), []);
  const { data: commandesData, loading: l4 } = useSupabase(() => getCommandes(), []);
  const [period, setPeriod] = useState<PeriodFilter>('30j');

  if (l1 || l2 || l3 || l4) return <LoadingPage />;

  const kpis = kpisData ?? { total: 0, nouveau: 0, confirme: 0, en_preparation: 0, expedie: 0, livre: 0, echoue: 0, reporte: 0, en_retour: 0, retourne: 0 };
  const users = usersData ?? [];
  const commissions = commissionsData ?? [];
  const allCommandes = commandesData ?? [];

  const commandes = filterByPeriod(allCommandes, period);
  const filteredCommissions = filterByPeriod(commissions, period);

  const commissionsEnAttente = filteredCommissions.filter((c) => c.statut === 'en_attente').length;
  const agentsCC = users.filter((u) => u.role === 'call_center' || u.role === 'superviseur_cc').length;
  const livreurs = users.filter((u) => u.role === 'livreur' || u.role === 'responsable_logistique').length;
  const revenuTotal = commandes.filter((c) => c.statut === 'livre').reduce((s, c) => s + c.montant_total - c.remise, 0);

  const kpiCards = [
    { label: 'Commandes', value: commandes.length },
    { label: 'Revenu (livre)', value: formatCurrency(revenuTotal) },
    { label: 'Commissions en attente', value: commissionsEnAttente },
    { label: 'Agents CC / Livreurs', value: `${agentsCC} / ${livreurs}` },
  ];

  // ---- Chart data: Commandes par jour ----
  const commandesParJour = useMemo(() => {
    const map: Record<string, number> = {};
    commandes.forEach((c) => {
      const day = c.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        commandes: count,
      }));
  }, [commandes]);

  // ---- Chart data: Revenu par jour ----
  const revenuParJour = useMemo(() => {
    const map: Record<string, number> = {};
    commandes
      .filter((c) => c.statut === 'livre')
      .forEach((c) => {
        const day = c.created_at.slice(0, 10);
        map[day] = (map[day] || 0) + (c.montant_total - c.remise);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, montant]) => ({
        date: date.slice(5),
        revenu: Math.round(montant * 100) / 100,
      }));
  }, [commandes]);

  // ---- Chart data: Donut statuts ----
  const statutData = useMemo(() => {
    const counts: Record<string, number> = {};
    commandes.forEach((c) => {
      counts[c.statut] = (counts[c.statut] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([statut, count]) => ({
        name: STATUT_CONFIG[statut as StatutCommande]?.label ?? statut,
        value: count,
      }));
  }, [commandes]);

  // ---- Top agents ----
  const ccAgents = users.filter((u) => u.role === 'call_center' || u.role === 'superviseur_cc');
  const topAgents = ccAgents
    .map((agent: User) => {
      const confirmes = commandes.filter((c: Commande) => c.agent_id === agent.id && c.statut === 'confirme').length;
      const livres = commandes.filter((c: Commande) => c.agent_id === agent.id && c.statut === 'livre').length;
      return { agent, confirmes, livres };
    })
    .sort((a, b) => b.livres - a.livres)
    .slice(0, 5);

  const periods: { label: string; value: PeriodFilter }[] = [
    { label: '7 jours', value: '7j' },
    { label: '30 jours', value: '30j' },
    { label: '90 jours', value: '90j' },
    { label: 'Tout', value: 'tout' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Vue globale CRM</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Charts Row 1: Bar + Line */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {commandesParJour.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnee.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={commandesParJour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="commandes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenu par jour (livre)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenuParJour.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnee.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenuParJour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenu" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Donut + Top Agents */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Repartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {statutData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnee.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`}
                  >
                    {statutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
                  <div className="flex gap-2">
                    <Badge variant="secondary">Conf. {confirmes}</Badge>
                    <Badge variant="default">Livre {livres}</Badge>
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
