'use client';

import { useMemo } from 'react';
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
import { mockCommissions, mockCommandes } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/constants';

const commissionStatusConfig: Record<string, { label: string; className: string }> = {
  approuvee: { label: 'Approuvee', className: 'bg-green-100 text-green-700 border-0' },
  en_attente: { label: 'En Attente', className: 'bg-yellow-100 text-yellow-700 border-0' },
  payee: { label: 'Payee', className: 'bg-blue-100 text-blue-700 border-0' },
  rejetee: { label: 'Rejetee', className: 'bg-red-100 text-red-700 border-0' },
};

export default function BalancePage() {
  const approuve = useMemo(
    () =>
      mockCommissions
        .filter((c) => c.statut === 'approuvee')
        .reduce((sum, c) => sum + c.montant, 0),
    []
  );
  const enAttente = useMemo(
    () =>
      mockCommissions
        .filter((c) => c.statut === 'en_attente')
        .reduce((sum, c) => sum + c.montant, 0),
    []
  );
  const totalPaye = useMemo(
    () =>
      mockCommissions
        .filter((c) => c.statut === 'payee')
        .reduce((sum, c) => sum + c.montant, 0),
    []
  );
  const disponible = approuve;

  const mockPaiements = [
    { id: 'pay1', date: '2026-03-10', montant: 25, methode: 'Mobile Money', reference: 'MM-001', statut: 'effectue' },
    { id: 'pay2', date: '2026-03-08', montant: 15, methode: 'Virement', reference: 'VIR-002', statut: 'effectue' },
    { id: 'pay3', date: '2026-03-05', montant: 10, methode: 'Mobile Money', reference: 'MM-003', statut: 'en_attente' },
  ];

  const mockHistorique = [
    { id: 'h1', date: '2026-03-13', type: 'Commission', description: 'Livraison #KIN-ABC1', montant: 5, solde: disponible },
    { id: 'h2', date: '2026-03-12', type: 'Paiement', description: 'Virement Mobile Money', montant: -25, solde: disponible - 5 },
    { id: 'h3', date: '2026-03-11', type: 'Commission', description: 'Livraison #LUB-DEF2', montant: 7, solde: disponible + 20 },
    { id: 'h4', date: '2026-03-10', type: 'Commission', description: 'Livraison #GOM-GHI3', montant: 5, solde: disponible + 13 },
  ];

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
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
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
                    {mockCommandes.filter((c) => c.statut === 'livre').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission Moy.</p>
                  <p className="text-xl font-bold">
                    {mockCommissions.length > 0
                      ? formatCurrency(
                          mockCommissions.reduce((s, c) => s + c.montant, 0) /
                            mockCommissions.length
                        )
                      : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nb Commissions</p>
                  <p className="text-xl font-bold">{mockCommissions.length}</p>
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
                  {mockCommissions.map((commission) => {
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

        {/* Paiements Tab */}
        <TabsContent value="paiements">
          <Card>
            <CardHeader>
              <CardTitle>Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Methode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaiements.map((paiement) => (
                    <TableRow key={paiement.id}>
                      <TableCell className="text-sm">{paiement.date}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(paiement.montant)}
                      </TableCell>
                      <TableCell className="text-sm">{paiement.methode}</TableCell>
                      <TableCell className="font-mono text-xs">{paiement.reference}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            paiement.statut === 'effectue'
                              ? 'bg-green-100 text-green-700 border-0'
                              : 'bg-yellow-100 text-yellow-700 border-0'
                          }
                        >
                          {paiement.statut === 'effectue' ? 'Effectue' : 'En Attente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique Tab */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistorique.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{entry.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.type === 'Commission'
                              ? 'bg-green-100 text-green-700 border-0'
                              : 'bg-blue-100 text-blue-700 border-0'
                          }
                        >
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.description}</TableCell>
                      <TableCell
                        className={`font-semibold ${entry.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {entry.montant >= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(entry.montant))}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(entry.solde)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
