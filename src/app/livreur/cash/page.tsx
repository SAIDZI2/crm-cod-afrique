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
import { useAuth } from '@/hooks/use-auth';
import { getAllTourneeCommandes, getRemisesCash, getTourneeEnCours, closeTournee, createRemiseCash } from '@/lib/supabase/queries';
import { formatCurrency, formatDateTime } from '@/lib/constants';
import { Banknote, ClipboardCheck, AlertTriangle, Loader2 } from 'lucide-react';

export default function LivreurCashPage() {
  const { user } = useAuth();
  const { data: tcData, loading: l1, refetch: refetchTc } = useSupabase(
    () => (user ? getAllTourneeCommandes(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const { data: remisesData, loading: l2, refetch: refetchRemises } = useSupabase(
    () => (user ? getRemisesCash(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const { data: tourneeEnCours, loading: l3, refetch: refetchTournee } = useSupabase(
    () => (user ? getTourneeEnCours(user.id) : Promise.resolve(null)),
    [user?.id]
  );
  const [showCloture, setShowCloture] = useState(false);
  const [showRemise, setShowRemise] = useState(false);
  const [montantRemise, setMontantRemise] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (l1 || l2 || l3) return <LoadingPage />;

  const handleCloture = async () => {
    if (!tourneeEnCours) return;
    setActionLoading('cloture');
    setFeedback(null);
    try {
      await closeTournee(tourneeEnCours.id);
      setShowCloture(false);
      setFeedback({ type: 'success', message: 'Tournée clôturée avec succès.' });
      refetchTc();
      refetchTournee();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemise = async () => {
    if (!user || !montantRemise || Number(montantRemise) <= 0) return;
    setActionLoading('remise');
    setFeedback(null);
    try {
      await createRemiseCash({
        livreur_id: user.id,
        tournee_id: tourneeEnCours?.id,
        montant_remis: Number(montantRemise),
        montant_theorique: cashCollecte,
        ecart: cashCollecte - Number(montantRemise),
        date_remise: new Date().toISOString(),
      });
      setShowRemise(false);
      setMontantRemise('');
      setFeedback({ type: 'success', message: 'Remise enregistrée avec succès.' });
      refetchRemises();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(null);
    }
  };
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
          Suivi des encaissements et remises de la journée
        </p>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Cash Théorique Dû" value={formatCurrency(stats.cashTheorique)} color="border-l-blue-500" subtitle="Montant attendu" />
        <KpiCard label="Cash Collecté" value={formatCurrency(stats.cashCollecte)} color="border-l-green-500" subtitle="Réellement encaissé" />
        <KpiCard label="Écart" value={formatCurrency(stats.ecart)} color={stats.ecart === 0 ? 'border-l-green-500' : 'border-l-red-500'} subtitle={stats.ecart === 0 ? 'Aucun écart' : 'À justifier'} />
        <KpiCard label="Cash Déjà Remis" value={formatCurrency(stats.cashDejaRemis)} color="border-l-purple-500" subtitle={`${remisesCash.length} remise(s)`} />
        <KpiCard label="Cash Restant" value={formatCurrency(stats.cashRestant)} color={stats.cashRestant > 0 ? 'border-l-orange-500' : 'border-l-green-500'} subtitle="À remettre" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={showCloture} onOpenChange={setShowCloture}>
          <DialogTrigger
            render={
              <Button className="min-h-12 flex-1 bg-green-600 hover:bg-green-700 text-white text-base">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Clôture de tournée
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clôture de tournée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash théorique</span>
                  <span className="font-medium">{formatCurrency(stats.cashTheorique)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash collecté</span>
                  <span className="font-medium">{formatCurrency(stats.cashCollecte)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Écart</span>
                  <span className={`font-medium ${stats.ecart !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(stats.ecart)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Déjà remis</span>
                  <span className="font-medium">{formatCurrency(stats.cashDejaRemis)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-lg">
                  <span>Restant à remettre</span>
                  <span className="text-orange-600">{formatCurrency(stats.cashRestant)}</span>
                </div>
              </div>
              {stats.ecart !== 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  Un écart de {formatCurrency(stats.ecart)} a été détecté.
                </div>
              )}
              <Button
                className="w-full min-h-12 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCloture}
                disabled={actionLoading === 'cloture' || !tourneeEnCours}
              >
                {actionLoading === 'cloture' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer la clôture
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
                Cash restant à remettre : <span className="font-bold text-foreground">{formatCurrency(stats.cashRestant)}</span>
              </p>
              <div>
                <Label className="text-sm font-medium">Montant à remettre</Label>
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
                onClick={handleRemise}
                disabled={!montantRemise || Number(montantRemise) <= 0 || actionLoading === 'remise'}
              >
                {actionLoading === 'remise' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer la remise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Détail des encaissements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Nom client</TableHead>
                  <TableHead className="text-right">Montant théorique</TableHead>
                  <TableHead className="text-right">Montant collecté</TableHead>
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
                    <p className="text-xs text-red-600">Écart : {formatCurrency(r.ecart)}</p>
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
