'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getRetours, updateRetour } from '@/lib/supabase/queries';
import { formatDate, MOTIFS_RETOUR } from '@/lib/constants';
import { toast } from 'sonner';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const MOTIF_COLORS: Record<string, { bg: string; text: string }> = {
  absent: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  refus: { bg: 'bg-red-100', text: 'text-red-800' },
  adresse_introuvable: { bg: 'bg-orange-100', text: 'text-orange-800' },
  injoignable: { bg: 'bg-purple-100', text: 'text-purple-800' },
  ne_peut_pas_payer: { bg: 'bg-pink-100', text: 'text-pink-800' },
  colis_endommage: { bg: 'bg-gray-100', text: 'text-gray-800' },
  mauvais_produit: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  autre: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

export default function LivreurRetoursPage() {
  const { user } = useAuth();
  const { data: retoursData, loading, refetch } = useSupabase(
    () => (user ? getRetours(user.id) : Promise.resolve([])),
    [user?.id]
  );

  const handleToggleRecuDepot = async (retourId: string, currentValue: boolean) => {
    try {
      await updateRetour(retourId, { recu_au_depot: !currentValue } as Record<string, unknown>);
      toast.success(!currentValue ? 'Marqué comme reçu au dépôt.' : 'Marqué comme non reçu.');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  if (loading) return <LoadingPage />;
  const retours = retoursData ?? [];
  const { page, setPage, totalPages, paginatedItems } = usePagination(retours, 15);

  const motifStats: Record<string, number> = {};
  retours.forEach(r => {
    const motif = r.motif ?? 'autre';
    motifStats[motif] = (motifStats[motif] || 0) + 1;
  });

  const getMotifLabel = (value: string) => {
    return MOTIFS_RETOUR.find(m => m.value === value)?.label ?? value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retours</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion des colis retournés
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total retours</p>
            <p className="text-2xl font-bold mt-1">{retours.length}</p>
          </CardContent>
        </Card>

        {Object.entries(motifStats).map(([motif, count]) => {
          const colors = MOTIF_COLORS[motif] ?? MOTIF_COLORS.autre;
          return (
            <Card key={motif} className="border-l-4 border-l-gray-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                    {getMotifLabel(motif)}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Liste des retours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Motif retour</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Reçu au dépôt</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun retour enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map(retour => {
                    const cmd = retour.commande;
                    if (!cmd) return null;
                    const motif = retour.motif ?? 'autre';
                    const motifColors = MOTIF_COLORS[motif] ?? MOTIF_COLORS.autre;

                    return (
                      <TableRow key={retour.id}>
                        <TableCell className="font-mono text-xs">{cmd.id}</TableCell>
                        <TableCell className="font-medium">{cmd.destinataire_nom}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${motifColors.bg} ${motifColors.text} border-0`}
                          >
                            {getMotifLabel(motif)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(retour.date_retour)}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleRecuDepot(retour.id, retour.recu_au_depot)}
                            className="cursor-pointer hover:scale-110 transition-transform"
                            title={retour.recu_au_depot ? 'Marquer comme non reçu' : 'Marquer comme reçu au dépôt'}
                          >
                            {retour.recu_au_depot ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                          {retour.note ?? '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={retours.length} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
