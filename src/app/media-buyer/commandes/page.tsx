'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { StatusBadge } from '@/components/status-badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getCommandes } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, STATUT_CONFIG } from '@/lib/constants';
import type { StatutCommande } from '@/lib/types';

export default function CommandesPage() {
  const { user } = useAuth();
  const { data: commandes, loading } = useSupabase(
    () => (user ? getCommandes({ userId: user.id }) : Promise.resolve([])),
    [user?.id]
  );
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  if (loading) return <LoadingPage />;

  const commandesList = commandes ?? [];

  const filtered = commandesList.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.destinataire_nom.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search) ||
      c.ville.toLowerCase().includes(search.toLowerCase());
    const matchStatut = statutFilter === 'tous' || c.statut === statutFilter;
    const matchDateDebut = !dateDebut || c.created_at >= dateDebut;
    const matchDateFin = !dateFin || c.created_at <= dateFin + 'T23:59:59Z';
    return matchSearch && matchStatut && matchDateDebut && matchDateFin;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <Link href="/media-buyer/commandes/nouveau">
          <Button>+ Nouvelle Commande</Button>
        </Link>
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
        <Input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="w-[160px]"
        />
        <Input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="w-[160px]"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((commande) => (
              <TableRow key={commande.id}>
                <TableCell className="font-mono text-xs">{commande.id}</TableCell>
                <TableCell>
                  <StatusBadge statut={commande.statut} />
                </TableCell>
                <TableCell className="text-sm">{formatDate(commande.created_at)}</TableCell>
                <TableCell className="text-sm">{commande.source ?? '-'}</TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(commande.montant_total)}
                </TableCell>
                <TableCell className="text-sm">{commande.ville}</TableCell>
                <TableCell className="text-sm">{commande.destinataire_nom}</TableCell>
                <TableCell>
                  <Link href={`/media-buyer/commandes/${commande.id}`}>
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucune commande ne correspond aux filtres.
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {filtered.length} commande{filtered.length > 1 ? 's' : ''} affichee{filtered.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
