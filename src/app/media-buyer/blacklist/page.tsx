'use client';

import { useState, useMemo } from 'react';
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
import type { Blacklist } from '@/lib/types';

const initialBlacklist: Blacklist[] = [
  { id: 'bl1', telephone: '+243 801 123456', motif: 'Numero frauduleux', user_id: 'u1', created_at: '2026-03-01T10:00:00Z' },
  { id: 'bl2', telephone: '+243 802 234567', motif: 'Commandes multiples non payees', user_id: 'u1', created_at: '2026-03-03T14:30:00Z' },
  { id: 'bl3', telephone: '+243 803 345678', motif: 'Faux numero', user_id: 'u2', created_at: '2026-03-05T09:15:00Z' },
  { id: 'bl4', telephone: '+243 804 456789', motif: 'Refus systematique a la livraison', user_id: 'u1', created_at: '2026-03-07T16:45:00Z' },
  { id: 'bl5', telephone: '+243 805 567890', motif: 'Spam', user_id: 'u3', created_at: '2026-03-09T11:20:00Z' },
];

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<Blacklist[]>(initialBlacklist);
  const [search, setSearch] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newMotif, setNewMotif] = useState('');

  const filtered = useMemo(() => {
    return blacklist.filter(
      (b) =>
        b.telephone.includes(search) ||
        (b.motif && b.motif.toLowerCase().includes(search.toLowerCase()))
    );
  }, [blacklist, search]);

  function handleAdd() {
    if (!newTelephone.trim()) {
      alert('Veuillez entrer un numero de telephone.');
      return;
    }
    const entry: Blacklist = {
      id: `bl${Date.now()}`,
      telephone: newTelephone.trim(),
      motif: newMotif.trim() || undefined,
      user_id: 'u1',
      created_at: new Date().toISOString(),
    };
    setBlacklist((prev) => [entry, ...prev]);
    setNewTelephone('');
    setNewMotif('');
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
