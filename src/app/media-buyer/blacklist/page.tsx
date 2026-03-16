'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/constants';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getBlacklist, addToBlacklist, removeFromBlacklist } from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export default function BlacklistPage() {
  const { user } = useAuth();
  const { data: blacklistData, loading, refetch } = useSupabase(() => getBlacklist(), []);
  const [search, setSearch] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newMotif, setNewMotif] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const blacklist = blacklistData ?? [];

  const filtered = blacklist.filter(
    (b) =>
      b.telephone.includes(search) ||
      (b.motif && b.motif.toLowerCase().includes(search.toLowerCase()))
  );

  const { page, setPage, totalPages, paginatedItems } = usePagination(filtered, 15);

  if (loading) return <LoadingPage />;

  async function handleAdd() {
    if (!user) return;
    const phone = newTelephone.trim();
    if (!phone) {
      toast.error('Veuillez entrer un numéro de téléphone.');
      return;
    }
    if (phone.length < 8) {
      toast.error('Le numéro de téléphone doit contenir au moins 8 chiffres.');
      return;
    }
    // Check duplicate
    if (blacklist.some(b => b.telephone === phone)) {
      toast.error('Ce numéro est déjà dans la blacklist.');
      return;
    }
    setAddLoading(true);
    try {
      await addToBlacklist({
        telephone: phone,
        motif: newMotif.trim() || undefined,
        user_id: user.id,
      });
      toast.success('Numéro ajouté à la blacklist.');
      setNewTelephone('');
      setNewMotif('');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce numéro de la blacklist ?')) return;
    try {
      await removeFromBlacklist(id);
      toast.success('Numéro retiré de la blacklist.');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Blacklist</h1>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Numéro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                value={newTelephone}
                onChange={(e) => setNewTelephone(e.target.value)}
                placeholder="+243 ..."
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="motif">Motif</Label>
              <Input
                id="motif"
                value={newMotif}
                onChange={(e) => setNewMotif(e.target.value)}
                placeholder="Raison du blocage"
              />
            </div>
            <Button onClick={handleAdd} disabled={addLoading}>{addLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Ajouter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Rechercher un numéro ou motif..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Téléphone</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Date d&apos;ajout</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono">{entry.telephone}</TableCell>
                  <TableCell className="text-sm">{entry.motif ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(entry.id)}
                      aria-label="Supprimer de la blacklist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun numéro dans la blacklist.
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} />
        </CardContent>
      </Card>
    </div>
  );
}
