'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KpiCard } from '@/components/kpi-card';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getCommissions, getCommandes, getPaiements, createPaiement } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, Wallet } from 'lucide-react';

const commissionStatusConfig: Record<string, { label: string; className: string }> = {
  approuvee: { label: 'Approuvee', className: 'bg-green-100 text-green-700 border-0' },
  en_attente: { label: 'En Attente', className: 'bg-yellow-100 text-yellow-700 border-0' },
  payee: { label: 'Payee', className: 'bg-blue-100 text-blue-700 border-0' },
  rejetee: { label: 'Rejetee', className: 'bg-red-100 text-red-700 border-0' },
};

const paiementStatusConfig: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En Attente', className: 'bg-yellow-100 text-yellow-700 border-0' },
  approuve: { label: 'Approuve', className: 'bg-green-100 text-green-700 border-0' },
  paye: { label: 'Paye', className: 'bg-blue-100 text-blue-700 border-0' },
  rejete: { label: 'Rejete', className: 'bg-red-100 text-red-700 border-0' },
};

const methodeOptions = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement_bancaire', label: 'Virement Bancaire' },
  { value: 'cash', label: 'Cash' },
];

export default function BalancePage() {
  const { user } = useAuth();
  const { data: commissionsData, loading: l1 } = useSupabase(() => getCommissions(), []);
  const { data: commandesData, loading: l2 } = useSupabase(() => getCommandes(), []);
  const { data: paiementsData, loading: l3, refetch: refetchPaiements } = useSupabase(
    () => (user ? getPaiements(user.id) : Promise.resolve([])),
    [user?.id]
  );

  const [showDialog, setShowDialog] = useState(false);
  const [montantRetrait, setMontantRetrait] = useState('');
  const [methode, setMethode] = useState('');
  const [reference, setReference] = useState('');
  const [retraitLoading, setRetraitLoading] = useState(false);

  if (l1 || l2 || l3) return <LoadingPage />;
  const commissions = commissionsData ?? [];
  const commandes = commandesData ?? [];
  const paiements = paiementsData ?? [];

  const approuve = commissions
    .filter((c) => c.statut === 'approuvee')
    .reduce((sum, c) => sum + c.montant, 0);
  const enAttente = commissions
    .filter((c) => c.statut === 'en_attente')
    .reduce((sum, c) => sum + c.montant, 0);
  const totalPaye = commissions
    .filter((c) => c.statut === 'payee')
    .reduce((sum, c) => sum + c.montant, 0);
  const totalRetraitsEnCours = paiements
    .filter((p) => p.statut === 'en_attente' || p.statut === 'approuve')
    .reduce((sum, p) => sum + p.montant, 0);
  const disponible = Math.max(0, approuve - totalRetraitsEnCours);

  const handleRetrait = async () => {
    const montant = Number(montantRetrait);
    if (!montant || montant <= 0) {
      toast.error('Veuillez entrer un montant valide.');
      return;
    }
    if (montant > disponible) {
      toast.error(`Solde insuffisant. Disponible: ${formatCurrency(disponible)}`);
      return;
    }
    if (!methode) {
      toast.error('Veuillez selectionner une methode de paiement.');
      return;
    }
    setRetraitLoading(true);
    try {
      await createPaiement({
        user_id: user!.id,
        montant,
        methode,
        reference: reference.trim() || undefined,
        statut: 'en_attente',
      });
      toast.success(`Demande de retrait de ${formatCurrency(montant)} envoyee.`);
      setShowDialog(false);
      setMontantRetrait('');
      setMethode('');
      setReference('');
      refetchPaiements();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setRetraitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Espace Financier</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger
            render={
              <Button disabled={disponible <= 0}>
                <Wallet className="w-4 h-4 mr-2" />
                Demander un retrait
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demande de Retrait</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-green-50 rounded-lg text-sm">
                <span className="text-green-700">Solde disponible: </span>
                <span className="font-bold text-green-800">{formatCurrency(disponible)}</span>
              </div>
              <div>
                <Label htmlFor="retrait-montant" className="text-sm font-medium">Montant ($)</Label>
                <Input
                  id="retrait-montant"
                  type="number"
                  min="0"
                  max={disponible}
                  step="0.01"
                  value={montantRetrait}
                  onChange={(e) => setMontantRetrait(e.target.value)}
                  className="mt-1"
                  placeholder="100.00"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Methode de paiement</Label>
                <Select value={methode} onValueChange={(val) => val && setMethode(val)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Selectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {methodeOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="retrait-ref" className="text-sm font-medium">Reference (optionnel)</Label>
                <Input
                  id="retrait-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1"
                  placeholder="Numero de compte, telephone..."
                />
              </div>
              <Button
                className="w-full"
                onClick={handleRetrait}
                disabled={!montantRetrait || !methode || retraitLoading}
              >
                {retraitLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                Envoyer la demande
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
          <TabsTrigger value="retraits">Retraits</TabsTrigger>
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
              {commissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commission.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retraits Tab */}
        <TabsContent value="retraits">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Retraits</CardTitle>
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
                  {paiements.map((p) => {
                    const config = paiementStatusConfig[p.statut];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">
                          {formatDate(p.created_at)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(p.montant)}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {p.methode?.replace('_', ' ') ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.reference ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config?.className}>
                            {config?.label ?? p.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {paiements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun retrait effectue.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
