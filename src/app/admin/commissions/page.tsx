'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommissions, updateCommissionStatut } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

const statutColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  en_attente: 'secondary',
  approuvee: 'default',
  payee: 'default',
  rejetee: 'destructive',
};

export default function AdminCommissionsPage() {
  const { data: commissionsData, loading, refetch } = useSupabase(() => getCommissions(), []);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApprove = async (id: string) => {
    setActionLoading(`approve-${id}`);
    setFeedback(null);
    try {
      await updateCommissionStatut(id, 'approuvee');
      setFeedback({ type: 'success', message: 'Commission approuvee.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (id: string) => {
    setActionLoading(`pay-${id}`);
    setFeedback(null);
    try {
      await updateCommissionStatut(id, 'payee');
      setFeedback({ type: 'success', message: 'Commission marquee comme payee.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingPage />;
  const commissions = commissionsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-sm text-muted-foreground">Validation et paiement</p>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{commissions.length} lignes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Media Buyer</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune commission enregistree.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.commande?.id ?? row.commande_id ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.commande?.statut}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.user?.nom ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.user?.email ?? row.user_id}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(row.montant)}</TableCell>
                    <TableCell>
                      <Badge variant={statutColors[row.statut] ?? 'outline'} className="capitalize">
                        {row.statut.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {row.statut === 'en_attente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(row.id)}
                          disabled={actionLoading === `approve-${row.id}`}
                        >
                          {actionLoading === `approve-${row.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Valider
                        </Button>
                      )}
                      {row.statut === 'approuvee' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePay(row.id)}
                          disabled={actionLoading === `pay-${row.id}`}
                        >
                          {actionLoading === `pay-${row.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Payer
                        </Button>
                      )}
                      {(row.statut === 'payee' || row.statut === 'rejetee') && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
