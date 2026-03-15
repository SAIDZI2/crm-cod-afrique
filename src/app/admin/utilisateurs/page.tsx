'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getUsers, createUser } from '@/lib/supabase/queries';
import { Loader2, UserPlus } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  call_center: 'Call Center',
  media_buyer: 'Media Buyer',
  livreur: 'Livreur',
  superviseur_cc: 'Superviseur CC',
  responsable_logistique: 'Resp. Logistique',
};

const roleOptions = [
  { value: 'media_buyer', label: 'Media Buyer' },
  { value: 'call_center', label: 'Call Center' },
  { value: 'superviseur_cc', label: 'Superviseur CC' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'responsable_logistique', label: 'Resp. Logistique' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminUsersPage() {
  const { data: usersData, loading, refetch } = useSupabase(() => getUsers(), []);
  const [showDialog, setShowDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [commissionPct, setCommissionPct] = useState('0');

  const resetForm = () => {
    setNom('');
    setEmail('');
    setRole('');
    setCommissionPct('0');
  };

  const handleCreateUser = async () => {
    if (!nom || !email || !role) return;
    setFormLoading(true);
    setFeedback(null);
    try {
      await createUser({
        nom,
        email,
        role,
        commission_pct: Number(commissionPct) || 0,
      });
      resetForm();
      setShowDialog(false);
      setFeedback({ type: 'success', message: `Utilisateur "${nom}" cree avec succes.` });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <LoadingPage />;
  const users = usersData ?? [];
  const actifs = users.filter((u) => u.actif).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Gestion des roles et activation</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger
            render={
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creer un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="user-nom" className="text-sm font-medium">Nom complet</Label>
                <Input
                  id="user-nom"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="mt-1"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="user-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="jean@crm.com"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={(val) => val && setRole(val)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Selectionner un role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user-commission" className="text-sm font-medium">Commission (%)</Label>
                <Input
                  id="user-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionPct}
                  onChange={e => setCommissionPct(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateUser}
                disabled={!nom || !email || !role || formLoading}
              >
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Creer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{users.length} comptes · {actifs} actifs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
