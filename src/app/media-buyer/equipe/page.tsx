'use client';

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
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getSubAffiliates, getCommandes, updateUser } from '@/lib/supabase/queries';
import { formatDate } from '@/lib/constants';
import { toast } from 'sonner';

export default function EquipePage() {
  const { user } = useAuth();
  const { data: membersData, loading: l1, refetch } = useSupabase(
    () => (user ? getSubAffiliates(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const { data: commandesData, loading: l2 } = useSupabase(() => getCommandes(), []);

  const handleToggleActif = async (memberId: string, currentActif: boolean) => {
    try {
      await updateUser(memberId, { actif: !currentActif } as Record<string, unknown>);
      toast.success(!currentActif ? 'Membre activé.' : 'Membre désactivé.');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  if (l1 || l2) return <LoadingPage />;
  const members = membersData ?? [];
  const { page, setPage, totalPages, paginatedItems } = usePagination(members, 15);
  const commandes = commandesData ?? [];

  const memberStats: Record<string, number> = {};
  commandes.forEach((c) => {
    memberStats[c.user_id] = (memberStats[c.user_id] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon Équipe</h1>
        <Badge variant="outline" className="text-sm">
          {members.length} membre{members.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sous-affiliés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
              {paginatedItems.map((member) => (
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
                      onClick={() => handleToggleActif(member.id, member.actif)}
                      className="cursor-pointer"
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          member.actif ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            member.actif ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun membre dans votre équipe.
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={members.length} />
        </CardContent>
      </Card>
    </div>
  );
}
