import { mockUsers } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  call_center: 'Call Center',
  media_buyer: 'Media Buyer',
  livreur: 'Livreur',
};

export default function AdminUsersPage() {
  const actifs = mockUsers.filter((u) => u.actif).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Gestion des rôles et activation (données démo)</p>
        </div>
        <Button variant="outline" disabled>
          Nouveau (TODO backend)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mockUsers.length} comptes · {actifs} actifs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {roleLabels[user.role] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.commission_pct}%</TableCell>
                  <TableCell>
                    <Badge variant={user.actif ? 'default' : 'destructive'}>
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
