'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { updateUser } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Loader2, User, Shield, Calendar, KeyRound,
  TrendingUp, Package, PhoneCall, Truck, CheckCircle,
} from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  call_center: 'Agent Call Center',
  media_buyer: 'Media Buyer',
  livreur: 'Livreur',
  superviseur_cc: 'Superviseur CC',
  responsable_logistique: 'Resp. Logistique',
};

const roleColors: Record<string, string> = {
  admin: 'from-purple-500 to-purple-600',
  call_center: 'from-blue-500 to-blue-600',
  media_buyer: 'from-orange-500 to-orange-600',
  livreur: 'from-green-500 to-green-600',
  superviseur_cc: 'from-cyan-500 to-cyan-600',
  responsable_logistique: 'from-teal-500 to-teal-600',
};

interface RoleStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const supabase = createClient();

  const [nom, setNom] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [stats, setStats] = useState<RoleStat[]>([]);

  useEffect(() => {
    if (user) {
      setNom(user.nom);
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadStats() {
    if (!user) return;
    try {
      if (user.role === 'media_buyer') {
        const [{ count: total }, { count: livrees }, { data: commissions }] = await Promise.all([
          supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('statut', 'livre'),
          supabase.from('commissions').select('montant').eq('user_id', user.id).in('statut', ['approuvee', 'payee']),
        ]);
        const totalCommissions = (commissions ?? []).reduce((s: number, c: { montant: number }) => s + Number(c.montant), 0);
        setStats([
          { label: 'Commandes totales', value: total ?? 0, icon: <Package className="w-5 h-5 text-orange-500" /> },
          { label: 'Livrées', value: livrees ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          { label: 'Commissions gagnées', value: `${totalCommissions.toFixed(0)} DH`, icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
        ]);
      } else if (user.role === 'call_center' || user.role === 'superviseur_cc') {
        const [{ count: traites }, { count: confirmes }] = await Promise.all([
          supabase.from('appels').select('*', { count: 'exact', head: true }).eq('agent_id', user.id),
          supabase.from('appels').select('*', { count: 'exact', head: true }).eq('agent_id', user.id).eq('resultat', 'confirme'),
        ]);
        const taux = traites ? Math.round(((confirmes ?? 0) / traites) * 100) : 0;
        setStats([
          { label: 'Appels traités', value: traites ?? 0, icon: <PhoneCall className="w-5 h-5 text-blue-500" /> },
          { label: 'Confirmés', value: confirmes ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          { label: 'Taux confirmation', value: `${taux}%`, icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
        ]);
      } else if (user.role === 'livreur' || user.role === 'responsable_logistique') {
        const [{ count: livrees }, { count: retours }, { data: commissions }] = await Promise.all([
          supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('livreur_id', user.id).eq('statut', 'livre'),
          supabase.from('retours').select('*', { count: 'exact', head: true }).eq('livreur_id', user.id),
          supabase.from('commissions').select('montant').eq('user_id', user.id).in('statut', ['approuvee', 'payee']),
        ]);
        const totalCommissions = (commissions ?? []).reduce((s: number, c: { montant: number }) => s + Number(c.montant), 0);
        setStats([
          { label: 'Livraisons réussies', value: livrees ?? 0, icon: <Truck className="w-5 h-5 text-green-500" /> },
          { label: 'Retours', value: retours ?? 0, icon: <Package className="w-5 h-5 text-red-500" /> },
          { label: 'Commissions livreur', value: `${totalCommissions.toFixed(0)} DH`, icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
        ]);
      }
    } catch {
      // stats non critiques
    }
  }

  const handleSaveName = async () => {
    if (!user || !nom.trim()) {
      toast.error('Le nom ne peut pas être vide.');
      return;
    }
    setSaving(true);
    try {
      await updateUser(user.id, { nom: nom.trim() });
      await refreshUser();
      toast.success('Nom mis à jour.');
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Remplissez tous les champs.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Mot de passe mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const avatarGradient = roleColors[user.role] ?? 'from-gray-500 to-gray-600';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Mon Profil</h1>

      {/* Hero Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-md shrink-0`}>
              <span className="text-3xl font-bold text-white">
                {user.nom.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold truncate">{user.nom}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {roleLabels[user.role] ?? user.role}
                </Badge>
                <Badge variant={user.actif ? 'default' : 'destructive'} className="text-xs">
                  {user.actif ? 'Actif' : 'Inactif'}
                </Badge>
                {user.commission_pct > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Commission {user.commission_pct}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Membre depuis le {formatDate(user.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats selon le rôle */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  {stat.icon}
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modifier le nom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Modifier le profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profile-nom">Nom complet</Label>
            <Input
              id="profile-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1"
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user.email} disabled className="mt-1 bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">L&apos;email ne peut pas être modifié.</p>
          </div>
          <Button
            onClick={handleSaveName}
            disabled={saving || nom.trim() === user.nom}
            size="sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer le nom
          </Button>
        </CardContent>
      </Card>

      {/* Changer le mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
              placeholder="Au moins 6 caractères"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              placeholder="Répétez le mot de passe"
            />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            variant="outline"
            size="sm"
          >
            {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
