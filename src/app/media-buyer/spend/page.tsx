'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KpiCard } from '@/components/kpi-card';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getDepenses, getCommandes, getProduits, createDepense } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function SpendPage() {
  const { user } = useAuth();
  const { data: depensesData, loading: l1, refetch } = useSupabase(() => getDepenses(), []);
  const { data: commandesData, loading: l2 } = useSupabase(() => getCommandes(), []);
  const { data: produitsData, loading: l3 } = useSupabase(() => getProduits(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDepense, setNewDepense] = useState({
    produit_id: '',
    montant: '',
    note: '',
    date_depense: '',
  });

  if (l1 || l2 || l3) return <LoadingPage />;
  const depenses = depensesData ?? [];
  const commandes = commandesData ?? [];
  const produits = produitsData ?? [];

  const totalDepense = depenses.reduce((sum, d) => sum + d.montant, 0);
  const totalLeads = commandes.length;
  const totalLivres = commandes.filter((c) => c.statut === 'livre').length;
  const cpl = totalLeads > 0 ? totalDepense / totalLeads : 0;
  const cpd = totalLivres > 0 ? totalDepense / totalLivres : 0;

  async function handleAddDepense() {
    if (!newDepense.montant || !newDepense.date_depense) {
      alert('Veuillez remplir le montant et la date.');
      return;
    }
    try {
      await createDepense({
        user_id: user!.id,
        produit_id: newDepense.produit_id || undefined,
        montant: parseFloat(newDepense.montant),
        date_depense: newDepense.date_depense,
        note: newDepense.note || undefined,
      });
      alert(`Depense ajoutee!`);
      setNewDepense({ produit_id: '', montant: '', note: '', date_depense: '' });
      setDialogOpen(false);
      refetch();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Depenses Publicitaires</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>+ Nouvelle Depense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une Depense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Produit</Label>
                <Select
                  value={newDepense.produit_id}
                  onValueChange={(v) =>
                    setNewDepense((prev) => ({ ...prev, produit_id: v ?? '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant ($) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={newDepense.montant}
                  onChange={(e) =>
                    setNewDepense((prev) => ({ ...prev, montant: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newDepense.date_depense}
                  onChange={(e) =>
                    setNewDepense((prev) => ({ ...prev, date_depense: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={newDepense.note}
                  onChange={(e) =>
                    setNewDepense((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Facebook Ads, TikTok Ads..."
                  rows={2}
                />
              </div>
              <Button onClick={handleAddDepense} className="w-full">
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Depense Totale" value={formatCurrency(totalDepense)} color="border-red-500" />
        <KpiCard label="Leads" value={totalLeads} color="border-blue-500" />
        <KpiCard label="Livres" value={totalLivres} color="border-green-500" />
        <KpiCard
          label="CPL (Cout/Lead)"
          value={formatCurrency(cpl)}
          color="border-orange-500"
          subtitle="Cout par Lead"
        />
        <KpiCard
          label="CPD (Cout/Delivery)"
          value={formatCurrency(cpd)}
          color="border-purple-500"
          subtitle="Cout par Livraison"
        />
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Depenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depenses.map((depense) => {
                const produit = produits.find((p) => p.id === depense.produit_id);
                return (
                  <TableRow key={depense.id}>
                    <TableCell className="text-sm">{formatDate(depense.date_depense)}</TableCell>
                    <TableCell className="text-sm">{produit?.nom ?? '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(depense.montant)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {depense.note ?? '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
