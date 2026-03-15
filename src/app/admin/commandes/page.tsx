'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { StatusBadge } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandes } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, STATUT_CONFIG } from '@/lib/constants';
import { exportCsv } from '@/lib/export-csv';
import type { StatutCommande } from '@/lib/types';
import { Download, Eye } from 'lucide-react';

export default function AdminCommandesPage() {
  const { data: commandesData, loading } = useSupabase(() => getCommandes(), []);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statutFilter, setStatutFilter] = useState('tous');

  const commandes = commandesData ?? [];

  const filtered = commandes.filter((c) => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s ||
      c.id.toLowerCase().includes(s) ||
      c.destinataire_nom.toLowerCase().includes(s) ||
      c.telephone.includes(s) ||
      c.ville.toLowerCase().includes(s);
    const matchStatut = statutFilter === 'tous' || c.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const { page, setPage, totalPages, paginatedItems } = usePagination(filtered, 15);

  if (loading) return <LoadingPage />;

  const stats = {
    total: commandes.length,
    nouveau: commandes.filter(c => c.statut === 'nouveau').length,
    confirme: commandes.filter(c => c.statut === 'confirme').length,
    livre: commandes.filter(c => c.statut === 'livre').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Toutes les Commandes</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} total — {stats.nouveau} nouveaux — {stats.confirme} confirmes — {stats.livre} livres
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportCsv(
              filtered as unknown as Record<string, unknown>[],
              [
                { key: 'id', header: 'ID' },
                { key: 'statut', header: 'Statut' },
                { key: 'created_at', header: 'Date', format: (r) => formatDate(r.created_at as string) },
                { key: 'destinataire_nom', header: 'Destinataire' },
                { key: 'telephone', header: 'Telephone' },
                { key: 'ville', header: 'Ville' },
                { key: 'montant_total', header: 'Montant', format: (r) => String(r.montant_total) },
                { key: '', header: 'Media Buyer', format: (r) => (r as unknown as { user?: { nom: string } }).user?.nom ?? '' },
              ],
              'admin-commandes.csv'
            )
          }
        >
          <Download className="w-4 h-4 mr-1" />
          CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher (ID, nom, tel, ville)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statutFilter} onValueChange={(v) => v && setStatutFilter(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {(Object.keys(STATUT_CONFIG) as StatutCommande[]).map((statut) => (
              <SelectItem key={statut} value={statut}>
                {STATUT_CONFIG[statut].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Media Buyer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((commande) => (
                <TableRow key={commande.id}>
                  <TableCell className="font-mono text-xs">{commande.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <StatusBadge statut={commande.statut} />
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(commande.created_at)}</TableCell>
                  <TableCell className="text-sm">{commande.destinataire_nom}</TableCell>
                  <TableCell className="text-sm">{commande.ville}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(commande.montant_total)}</TableCell>
                  <TableCell className="text-sm">
                    {(commande as unknown as { user?: { nom: string } }).user?.nom ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/call-centre/commande/${commande.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune commande ne correspond aux filtres.
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} />
        </CardContent>
      </Card>
    </div>
  );
}
