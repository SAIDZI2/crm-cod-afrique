'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommissions, updateCommissionStatut } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { exportCsv } from '@/lib/export-csv';
import { toast } from 'sonner';
import { Loader2, Download } from 'lucide-react';

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
      setFeedback({ type: 'success', message: 'Commission approuvée.' });
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
      toast.success('Commission marquée comme payée.');
      refetch();
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(`reject-${id}`);
    setFeedback(null);
    try {
      await updateCommissionStatut(id, 'rejetee');
      toast.success('Commission rejetée.');
      refetch();
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const commissions = commissionsData ?? [];
  const { page, setPage, totalPages, paginatedItems } = usePagination(commissions, 15);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commissions</h1>
          <p className="text-sm text-muted-foreground">Validation et paiement</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportCsv(
              commissions as unknown as Record<string, unknown>[],
              [
                { key: 'id', header: 'ID' },
                { key: 'commande_id', header: 'Commande' },
                { key: '', header: 'Media Buyer', format: (r) => (r as unknown as { user?: { nom: string } }).user?.nom ?? '' },
                { key: 'montant', header: 'Montant', format: (r) => String(r.montant) },
                { key: 'statut', header: 'Statut' },
              ],
              'commissions.csv'
            )
          }
        >
          <Download className="w-4 h-4 mr-1" />
          CSV
        </Button>
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
                    Aucune commission enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((row) => (
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
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(row.id)}
                            disabled={actionLoading === `approve-${row.id}`}
                          >
                            {actionLoading === `approve-${row.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(row.id)}
                            disabled={actionLoading === `reject-${row.id}`}
                          >
                            {actionLoading === `reject-${row.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Rejeter
                          </Button>
                        </>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={commissions.length} />
        </CardContent>
      </Card>
    </div>
  );
}
