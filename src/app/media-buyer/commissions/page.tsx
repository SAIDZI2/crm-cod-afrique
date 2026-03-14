'use client';

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
import { KpiCard } from '@/components/kpi-card';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getSubAffiliates, getCommandes, getCommissions } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';

export default function CommissionsPage() {
  const { user } = useAuth();
  const { data: sousAffiliesData, loading: l1 } = useSupabase(
    () => (user ? getSubAffiliates(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const { data: commandesData, loading: l2 } = useSupabase(() => getCommandes(), []);
  const { data: commissionsData, loading: l3 } = useSupabase(() => getCommissions(), []);

  if (l1 || l2 || l3) return <LoadingPage />;
  const sousAffilies = sousAffiliesData ?? [];
  const commandes = commandesData ?? [];
  const commissions = commissionsData ?? [];

  const affilieStats = sousAffilies.map((affilie) => {
    const affilieCommandes = commandes.filter((c) => c.user_id === affilie.id);
    const livrees = affilieCommandes.filter((c) => c.statut === 'livre');
    const affilieCommissions = commissions.filter((c) => c.user_id === affilie.id);
    const totalCommission = affilieCommissions.reduce((s, c) => s + c.montant, 0);
    const aPayer = affilieCommissions
      .filter((c) => c.statut === 'approuvee')
      .reduce((s, c) => s + c.montant, 0);
    const enAttente = affilieCommissions
      .filter((c) => c.statut === 'en_attente')
      .reduce((s, c) => s + c.montant, 0);
    const paye = affilieCommissions
      .filter((c) => c.statut === 'payee')
      .reduce((s, c) => s + c.montant, 0);

    return {
      ...affilie,
      totalCommandes: affilieCommandes.length,
      livrees: livrees.length,
      totalCommission,
      aPayer,
      enAttente,
      paye,
    };
  });

  const totalAPayer = affilieStats.reduce((s, a) => s + a.aPayer, 0);
  const totalEnAttente = affilieStats.reduce((s, a) => s + a.enAttente, 0);
  const totalPaye = affilieStats.reduce((s, a) => s + a.paye, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commissions Sous-affilies</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Sous-affilies"
          value={sousAffilies.length}
          color="border-blue-500"
        />
        <KpiCard
          label="A Payer"
          value={formatCurrency(totalAPayer)}
          color="border-orange-500"
        />
        <KpiCard
          label="En Attente"
          value={formatCurrency(totalEnAttente)}
          color="border-yellow-500"
        />
        <KpiCard
          label="Paye"
          value={formatCurrency(totalPaye)}
          color="border-green-500"
        />
      </div>

      {/* Sub-affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sous-affilies et leurs Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Livrees</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Total Commission</TableHead>
                <TableHead>A Payer</TableHead>
                <TableHead>En Attente</TableHead>
                <TableHead>Paye</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affilieStats.map((affilie) => (
                <TableRow key={affilie.id}>
                  <TableCell className="font-medium">{affilie.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {affilie.email}
                  </TableCell>
                  <TableCell className="font-semibold">{affilie.totalCommandes}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    {affilie.livrees}
                  </TableCell>
                  <TableCell className="text-sm">{affilie.commission_pct}%</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(affilie.totalCommission)}
                  </TableCell>
                  <TableCell className="text-orange-600 font-medium">
                    {formatCurrency(affilie.aPayer)}
                  </TableCell>
                  <TableCell className="text-yellow-600 font-medium">
                    {formatCurrency(affilie.enAttente)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(affilie.paye)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        affilie.actif
                          ? 'bg-green-100 text-green-700 border-0'
                          : 'bg-red-100 text-red-700 border-0'
                      }
                    >
                      {affilie.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {affilieStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun sous-affilie dans votre equipe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
