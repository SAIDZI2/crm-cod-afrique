'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommissions } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';

const statutColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  en_attente: 'secondary',
  approuvee: 'default',
  payee: 'default',
  rejetee: 'destructive',
};

export default function AdminCommissionsPage() {
  const { data: commissionsData, loading } = useSupabase(() => getCommissions(), []);

  if (loading) return <LoadingPage />;
  const commissions = commissionsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-sm text-muted-foreground">Validation et paiement</p>
      </div>

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
                    Aucune commission enregistree.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((row) => (
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
                      <Button size="sm" variant="outline" disabled>
                        Valider
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        Payer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
