'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockUsers, mockCommandes } from '@/lib/mock-data';
import { formatDate } from '@/lib/constants';

export default function EquipePage() {
  const currentUserId = 'u1';

  const teamMembers = useMemo(
    () => mockUsers.filter((u) => u.parent_id === currentUserId),
    []
  );

  const [members, setMembers] = useState(teamMembers);

  function toggleActif(userId: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, actif: !m.actif } : m))
    );
  }

  const memberStats = useMemo(() => {
    const stats: Record<string, number> = {};
    mockCommandes.forEach((c) => {
      stats[c.user_id] = (stats[c.user_id] || 0) + 1;
    });
    return stats;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon Equipe</h1>
        <Badge variant="outline" className="text-sm">
          {members.length} membre{members.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sous-affilies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Ajout</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="text-sm">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{member.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-sm">{member.commission_pct}%</TableCell>
                  <TableCell className="font-semibold">
                    {memberStats[member.id] || 0}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActif(member.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        member.actif ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          member.actif ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun membre dans votre equipe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
