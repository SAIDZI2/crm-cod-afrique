'use client';

import { useState } from 'react';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getAllTourneeCommandes, getRemisesCash } from '@/lib/supabase/queries';
import { formatCurrency, formatDateTime } from '@/lib/constants';
import { Banknote, ClipboardCheck, AlertTriangle } from 'lucide-react';

const LIVREUR_ID = 'a1000000-0000-0000-0000-000000000006';

export default function LivreurCashPage() {
  const { data: tcData, loading: l1 } = useSupabase(() => getAllTourneeCommandes(), []);
  const { data: remisesData, loading: l2 } = useSupabase(() => getRemisesCash(LIVREUR_ID), []);
  const [showCloture, setShowCloture] = useState(false);
  const [showRemise, setShowRemise] = useState(false);
  const [montantRemise, setMontantRemise] = useState('');

  if (l1 || l2) return <LoadingPage />;
  const allTc = tcData ?? [];
  const remisesCash = remisesData ?? [];

  const livres = allTc.filter(tc => tc.statut_livraison === 'livre');

  const cashTheorique = livres.reduce(
    (sum, tc) => sum + (tc.commande?.montant_total ?? 0),
    0
  );
  const cashCollecte = livres.reduce(
    (sum, tc) => sum + (tc.montant_collecte ?? 0),
    0
  );
  const ecart = cashTheorique - cashCollecte;
  const cashDejaRemis = remisesCash.reduce(
    (sum, r) => sum + r.montant_remis,
    0
  );
  const cashRestant = cashCollecte - cashDejaRemis;

  const stats = { cashTheorique, cashCollecte, ecart, cashDejaRemis, cashRestant };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion du Cash</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des encaissements et remises de la journee
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Cash Theorique Du" value={formatCurrency(stats.cashTheorique)} color="border-l-blue-500" subtitle="Montant attendu" />
        <KpiCard label="Cash Collecte" value={formatCurrency(stats.cashCollecte)} color="border-l-green-500" subtitle="Reellement encaisse" />
        <KpiCard label="Ecart" value={formatCurrency(stats.ecart)} color={stats.ecart === 0 ? 'border-l-green-500' : 'border-l-red-500'} subtitle={stats.ecart === 0 ? 'Aucun ecart' : 'A justifier'} />
        <KpiCard label="Cash Deja Remis" value={formatCurrency(stats.cashDejaRemis)} color="border-l-purple-500" subtitle={`${remisesCash.length} remise(s)`} />
        <KpiCard label="Cash Restant" value={formatCurrency(stats.cashRestant)} color={stats.cashRestant > 0 ? 'border-l-orange-500' : 'border-l-green-500'} subtitle="A remettre" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={showCloture} onOpenChange={setShowCloture}>
          <DialogTrigger
            render={
              <Button className="min-h-12 flex-1 bg-green-600 hover:bg-green-700 text-white text-base">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Cloture de tournee
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cloture de tournee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash theorique</span>
                  <span className="font-medium">{formatCurrency(stats.cashTheorique)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash collecte</span>
                  <span className="font-medium">{formatCurrency(stats.cashCollecte)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ecart</span>
                  <span className={`font-medium ${stats.ecart !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(stats.ecart)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deja remis</span>
                  <span className="font-medium">{formatCurrency(stats.cashDejaRemis)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-lg">
                  <span>Restant a remettre</span>
                  <span className="text-orange-600">{formatCurrency(stats.cashRestant)}</span>
                </div>
              </div>
              {stats.ecart !== 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  Un ecart de {formatCurrency(stats.ecart)} a ete detecte.
                </div>
              )}
              <Button className="w-full min-h-12 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowCloture(false)}>
                Confirmer la cloture
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRemise} onOpenChange={setShowRemise}>
          <DialogTrigger
            render={
              <Button variant="outline" className="min-h-12 flex-1 text-base">
                <Banknote className="w-5 h-5 mr-2" />
                Remise partielle
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remise partielle de cash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Cash restant a remettre: <span className="font-bold text-foreground">{formatCurrency(stats.cashRestant)}</span>
              </p>
              <div>
                <Label className="text-sm font-medium">Montant a remettre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={montantRemise}
                  onChange={e => setMontantRemise(e.target.value)}
                  className="mt-1 min-h-12 text-lg"
                  placeholder="0.00"
                />
              </div>
              <Button
                className="w-full min-h-12 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => { setShowRemise(false); setMontantRemise(''); }}
                disabled={!montantRemise || Number(montantRemise) <= 0}
              >
                Confirmer la remise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail des encaissements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Nom client</TableHead>
                  <TableHead className="text-right">Montant theorique</TableHead>
                  <TableHead className="text-right">Montant collecte</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Statut remise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun encaissement pour le moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  livres.map(tc => {
                    const cmd = tc.commande;
                    if (!cmd) return null;
                    const ecartItem = cmd.montant_total - (tc.montant_collecte ?? 0);
                    return (
                      <TableRow key={tc.id}>
                        <TableCell className="font-mono text-xs">{cmd.id}</TableCell>
                        <TableCell className="font-medium">{cmd.destinataire_nom}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cmd.montant_total)}</TableCell>
                        <TableCell className="text-right">
                          <span className={ecartItem !== 0 ? 'text-red-600 font-medium' : ''}>
                            {formatCurrency(tc.montant_collecte ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tc.heure_livraison ? formatDateTime(tc.heure_livraison) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              remisesCash.length > 0
                                ? 'bg-green-100 text-green-700 border-0'
                                : 'bg-orange-100 text-orange-700 border-0'
                            }
                          >
                            {remisesCash.length > 0 ? 'Remis' : 'En attente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {remisesCash.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique des remises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {remisesCash.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(r.montant_remis)} remis</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.date_remise)}</p>
                  {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                </div>
                <div className="text-right">
                  {r.ecart !== 0 && (
                    <p className="text-xs text-red-600">Ecart: {formatCurrency(r.ecart)}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
