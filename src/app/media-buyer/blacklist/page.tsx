'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { getBlacklist, addToBlacklist } from '@/lib/supabase/queries';

export default function BlacklistPage() {
  const { user } = useAuth();
  const { data: blacklistData, loading, refetch } = useSupabase(() => getBlacklist(), []);
  const [search, setSearch] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newMotif, setNewMotif] = useState('');

  if (loading) return <LoadingPage />;
  const blacklist = blacklistData ?? [];

  const filtered = blacklist.filter(
    (b) =>
      b.telephone.includes(search) ||
      (b.motif && b.motif.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd() {
    if (!newTelephone.trim()) {
      alert('Veuillez entrer un numero de telephone.');
      return;
    }
    try {
      await addToBlacklist({
        telephone: newTelephone.trim(),
        motif: newMotif.trim() || undefined,
        user_id: user!.id,
      });
      setNewTelephone('');
      setNewMotif('');
      refetch();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Blacklist</h1>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Numero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="telephone">Telephone *</Label>
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
            <Button onClick={handleAdd}>Ajouter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Rechercher un numero ou motif..."
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
                <TableHead>Telephone</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Date d&apos;ajout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono">{entry.telephone}</TableCell>
                  <TableCell className="text-sm">{entry.motif ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun numero dans la blacklist.
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {blacklist.length} numero{blacklist.length > 1 ? 's' : ''} dans la blacklist
      </p>
    </div>
  );
}
