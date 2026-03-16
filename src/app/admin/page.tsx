'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandesKpis, getUsers, getCommissions, getCommandes } from '@/lib/supabase/queries';
import { formatCurrency, STATUT_CONFIG } from '@/lib/constants';
import type { User, Commande, StatutCommande } from '@/lib/types';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  ShoppingCart, DollarSign, Users as UsersIcon, Clock,
  Calendar,
} from 'lucide-react';

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

  const users = usersData ?? [];
  const commissions = commissionsData ?? [];
  const allCommandes = commandesData ?? [];

  const commandes = filterByPeriod(allCommandes, period);
  const filteredCommissions = filterByPeriod(commissions, period);

  // ---- Chart data: Commandes par jour (Area) ----
  const commandesParJour = useMemo(() => {
    const map: Record<string, number> = {};
    commandes.forEach((c) => {
      const day = c.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: date.slice(5),
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

  // ---- Taux de confirmation par jour ----
  const tauxParJour = useMemo(() => {
    const days: Record<string, { total: number; confirmes: number }> = {};
    commandes.forEach((c) => {
      if (['confirme', 'echoue', 'reporte'].includes(c.statut)) {
        const day = c.created_at.slice(0, 10);
        if (!days[day]) days[day] = { total: 0, confirmes: 0 };
        days[day].total++;
        if (c.statut === 'confirme') days[day].confirmes++;
      }
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date: date.slice(5),
        taux: d.total > 0 ? Math.round((d.confirmes / d.total) * 100) : 0,
      }));
  }, [commandes]);

  if (l1 || l2 || l3 || l4) return <LoadingPage />;

  const commissionsEnAttente = filteredCommissions.filter((c) => c.statut === 'en_attente').length;
  const agentsCC = users.filter((u) => u.role === 'call_center' || u.role === 'superviseur_cc').length;
  const livreurs = users.filter((u) => u.role === 'livreur' || u.role === 'responsable_logistique').length;
  const revenuTotal = commandes.filter((c) => c.statut === 'livre').reduce((s, c) => s + c.montant_total - c.remise, 0);

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
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-800">Tableau de bord</h1>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'ghost'}
              size="sm"
              className={period === p.value ? 'shadow-sm' : ''}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Commandes"
          value={commandes.length.toLocaleString('fr-FR')}
          icon={ShoppingCart}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
        />
        <KpiCard
          label="Revenu (livré)"
          value={formatCurrency(revenuTotal)}
          icon={DollarSign}
          iconBg="bg-pink-100"
          iconColor="text-pink-500"
        />
        <KpiCard
          label="Commissions en attente"
          value={commissionsEnAttente}
          icon={Clock}
          iconBg="bg-slate-200"
          iconColor="text-slate-600"
        />
        <KpiCard
          label="Agents CC / Livreurs"
          value={`${agentsCC} / ${livreurs}`}
          icon={UsersIcon}
          iconBg="bg-teal-100"
          iconColor="text-teal-500"
        />
      </div>

      {/* Charts Row 1: Area chart (large) + Donut */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Commandes par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {commandesParJour.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={commandesParJour}>
                  <defs>
                    <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="commandes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradientBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {statutData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={false}
                  >
                    {statutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Top agents + Revenue line */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Top agents (livraisons)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun agent.</p>
            ) : (
              topAgents.map(({ agent, confirmes, livres }, index) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{agent.nom}</p>
                    <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">Conf. {confirmes}</Badge>
                    <Badge variant="default" className="text-xs">Livré {livres}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Revenu par jour (livre)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenuParJour.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenuParJour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenu"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Taux de confirmation chart */}
      {tauxParJour.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Taux de confirmation (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tauxParJour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="taux" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
