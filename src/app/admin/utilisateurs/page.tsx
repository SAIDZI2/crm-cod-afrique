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
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getUsers, createUser, updateUser } from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { Loader2, UserPlus, Pencil } from 'lucide-react';

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
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; nom: string; role: string; commission_pct: number } | null>(null);
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

  const openEditDialog = (u: { id: string; nom: string; role: string; commission_pct: number }) => {
    setEditingUser(u);
    setEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setFormLoading(true);
    try {
      await updateUser(editingUser.id, {
        nom: editingUser.nom,
        role: editingUser.role,
        commission_pct: editingUser.commission_pct,
      } as Record<string, unknown>);
      toast.success('Utilisateur modifie.');
      setEditDialog(false);
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActif = async (userId: string, currentActif: boolean) => {
    try {
      await updateUser(userId, { actif: !currentActif } as Record<string, unknown>);
      toast.success(!currentActif ? 'Utilisateur active.' : 'Utilisateur desactive.');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    }
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

  const users = usersData ?? [];
  const { page, setPage, totalPages, paginatedItems } = usePagination(users, 15);

  if (loading) return <LoadingPage />;
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((user) => (
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
                    <button
                      onClick={() => handleToggleActif(user.id, user.actif)}
                      className="cursor-pointer"
                    >
                      <Badge variant={user.actif ? 'default' : 'destructive'}>
                        {user.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog({
                        id: user.id,
                        nom: user.nom,
                        role: user.role,
                        commission_pct: user.commission_pct,
                      })}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={users.length} />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-medium">Nom</Label>
                <Input
                  value={editingUser.nom}
                  onChange={(e) => setEditingUser({ ...editingUser, nom: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(val) => val && setEditingUser({ ...editingUser, role: val })}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Commission (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editingUser.commission_pct}
                  onChange={(e) => setEditingUser({ ...editingUser, commission_pct: Number(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={handleEditUser} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
