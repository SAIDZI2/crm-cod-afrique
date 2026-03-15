'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { updateUser } from '@/lib/supabase/queries';
import { formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, User, Shield, Calendar } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  call_center: 'Call Center',
  media_buyer: 'Media Buyer',
  livreur: 'Livreur',
  superviseur_cc: 'Superviseur CC',
  responsable_logistique: 'Resp. Logistique',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nom, setNom] = useState(user?.nom ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!nom.trim()) {
      toast.error('Le nom ne peut pas être vide.');
      return;
    }
    setSaving(true);
    try {
      await updateUser(user.id, { nom: nom.trim() } as Record<string, unknown>);
      await refreshUser();
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Mon Profil</h1>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user.nom.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold">{user.nom}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Rôle</p>
                <Badge variant="secondary">{roleLabels[user.role] ?? user.role}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Membre depuis</p>
                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <Badge variant={user.actif ? 'default' : 'destructive'}>
                {user.actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="text-sm font-medium">{user.commission_pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Card */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier le profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profile-nom" className="text-sm font-medium">Nom complet</Label>
            <Input
              id="profile-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1"
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <Input
              value={user.email}
              disabled
              className="mt-1 bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">L&apos;email ne peut pas être modifié.</p>
          </div>
          <Button onClick={handleSave} disabled={saving || nom.trim() === user.nom}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
