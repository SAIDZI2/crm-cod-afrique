'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter, filterByDateRange } from '@/components/date-range-filter';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getAllPaiements, updatePaiement } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const statutColors: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En Attente', className: 'bg-yellow-100 text-yellow-700 border-0' },
  approuve: { label: 'Approuvé', className: 'bg-green-100 text-green-700 border-0' },
  paye: { label: 'Payé', className: 'bg-blue-100 text-blue-700 border-0' },
  rejete: { label: 'Rejeté', className: 'bg-red-100 text-red-700 border-0' },
};

export default function AdminPaiementsPage() {
  const { data: paiementsData, loading, refetch } = useSupabase(() => getAllPaiements(), []);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const allPaiements = paiementsData ?? [];
  const paiements = filterByDateRange(allPaiements, 'created_at', dateDebut, dateFin).filter((p) => {
    return statutFilter === 'tous' || p.statut === statutFilter;
  });
  const { page, setPage, totalPages, paginatedItems } = usePagination(paiements, 15);

  if (loading) return <LoadingPage />;

  const enAttente = allPaiements.filter(p => p.statut === 'en_attente');
  const totalEnAttente = enAttente.reduce((s, p) => s + p.montant, 0);

  const handleAction = async (id: string, statut: string) => {
    setActionLoading(`${statut}-${id}`);
    try {
      await updatePaiement(id, { statut } as Record<string, unknown>);
      toast.success(`Paiement ${statut === 'approuve' ? 'approuvé' : statut === 'paye' ? 'marqué comme payé' : 'rejeté'}.`);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paiements / Retraits</h1>
        <p className="text-sm text-muted-foreground">
          {enAttente.length} demandes en attente — {formatCurrency(totalEnAttente)} total
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <Select value={statutFilter} onValueChange={(v) => v && setStatutFilter(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En Attente</SelectItem>
            <SelectItem value="approuve">Approuvé</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
            <SelectItem value="rejete">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <DateRangeFilter
          dateDebut={dateDebut}
          dateFin={dateFin}
          onDateDebutChange={setDateDebut}
          onDateFinChange={setDateFin}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{paiements.length} paiements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun paiement enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((p) => {
                  const config = statutColors[p.statut];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.created_at)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{(p as unknown as { user?: { nom: string } }).user?.nom ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{(p as unknown as { user?: { email: string } }).user?.email ?? ''}</div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(p.montant)}</TableCell>
                      <TableCell className="text-sm capitalize">{p.methode?.replace('_', ' ') ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.reference ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config?.className}>
                          {config?.label ?? p.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        {p.statut === 'en_attente' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(p.id, 'approuve')}
                              disabled={actionLoading === `approuve-${p.id}`}
                            >
                              {actionLoading === `approuve-${p.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(p.id, 'rejete')}
                              disabled={actionLoading === `rejete-${p.id}`}
                            >
                              {actionLoading === `rejete-${p.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              Rejeter
                            </Button>
                          </>
                        )}
                        {p.statut === 'approuve' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(p.id, 'paye')}
                            disabled={actionLoading === `paye-${p.id}`}
                          >
                            {actionLoading === `paye-${p.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Marquer Payé
                          </Button>
                        )}
                        {(p.statut === 'paye' || p.statut === 'rejete') && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={paiements.length} />
        </CardContent>
      </Card>
    </div>
  );
}
