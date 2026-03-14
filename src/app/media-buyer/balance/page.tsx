'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/kpi-card';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommissions, getCommandes } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/constants';

const commissionStatusConfig: Record<string, { label: string; className: string }> = {
  approuvee: { label: 'Approuvee', className: 'bg-green-100 text-green-700 border-0' },
  en_attente: { label: 'En Attente', className: 'bg-yellow-100 text-yellow-700 border-0' },
  payee: { label: 'Payee', className: 'bg-blue-100 text-blue-700 border-0' },
  rejetee: { label: 'Rejetee', className: 'bg-red-100 text-red-700 border-0' },
};

export default function BalancePage() {
  const { data: commissionsData, loading: l1 } = useSupabase(() => getCommissions(), []);
  const { data: commandesData, loading: l2 } = useSupabase(() => getCommandes(), []);

  if (l1 || l2) return <LoadingPage />;
  const commissions = commissionsData ?? [];
  const commandes = commandesData ?? [];

  const approuve = commissions
    .filter((c) => c.statut === 'approuvee')
    .reduce((sum, c) => sum + c.montant, 0);
  const enAttente = commissions
    .filter((c) => c.statut === 'en_attente')
    .reduce((sum, c) => sum + c.montant, 0);
  const totalPaye = commissions
    .filter((c) => c.statut === 'payee')
    .reduce((sum, c) => sum + c.montant, 0);
  const disponible = approuve;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Espace Financier</h1>

      {/* Soldes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Approuve" value={formatCurrency(approuve)} color="border-green-500" />
        <KpiCard label="En Attente" value={formatCurrency(enAttente)} color="border-yellow-500" />
        <KpiCard label="Total Paye" value={formatCurrency(totalPaye)} color="border-blue-500" />
        <KpiCard
          label="Disponible"
          value={formatCurrency(disponible)}
          color="border-emerald-500"
          subtitle="Solde retirable"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resume" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        {/* Resume Tab */}
        <TabsContent value="resume">
          <Card>
            <CardHeader>
              <CardTitle>Resume Financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Total Commissions Gagnees</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(approuve + enAttente + totalPaye)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Total Retire</p>
                  <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalPaye)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes Livrees</p>
                  <p className="text-xl font-bold">
                    {commandes.filter((c) => c.statut === 'livre').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission Moy.</p>
                  <p className="text-xl font-bold">
                    {commissions.length > 0
                      ? formatCurrency(
                          commissions.reduce((s, c) => s + c.montant, 0) / commissions.length
                        )
                      : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nb Commissions</p>
                  <p className="text-xl font-bold">{commissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => {
                    const config = commissionStatusConfig[commission.statut];
                    return (
                      <TableRow key={commission.id}>
                        <TableCell className="text-sm">
                          {formatDate(commission.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {commission.commande_id ?? '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(commission.montant)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config?.className}>
                            {config?.label ?? commission.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
