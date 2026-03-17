'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorDisplay } from '@/components/error-display';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import {
  getTournees,
  getUsersByRole,
  getCommandes,
  createTournee,
  createTourneeCommande,
  updateTournee,
} from '@/lib/supabase/queries';
import { Plus, ChevronDown, ChevronUp, PackagePlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Tournee, User, Commande } from '@/lib/types';

export default function GestionTourneesPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddColis, setShowAddColis] = useState<string | null>(null); // tourneeId
  const [newLivreurId, setNewLivreurId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCommandeId, setSelectedCommandeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const { data: allTournees, loading: l1, error } = useSupabase(
    () => getTournees(),
    [refresh]
  );
  const { data: livreurs, loading: l2 } = useSupabase(() => getUsersByRole('livreur'), []);
  const { data: commandesEnPrep, loading: l3 } = useSupabase(
    () => getCommandes({ statut: 'en_preparation' }),
    [refresh]
  );

  if (l1 || l2 || l3) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  const tournees = allTournees ?? [];
  const livreursMap = Object.fromEntries((livreurs ?? []).map((l: User) => [l.id, l]));

  const getStatutBadge = (statut: Tournee['statut']) => {
    if (statut === 'en_preparation') return 'bg-yellow-100 text-yellow-700';
    if (statut === 'en_cours') return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatutLabel = (statut: Tournee['statut']) => {
    if (statut === 'en_preparation') return 'En préparation';
    if (statut === 'en_cours') return 'En cours';
    return 'Clôturée';
  };

  async function handleCreateTournee() {
    if (!newLivreurId || !newDate) {
      toast.error('Sélectionnez un livreur et une date');
      return;
    }
    setSaving(true);
    try {
      await createTournee({ livreur_id: newLivreurId, date: newDate, statut: 'en_preparation' });
      toast.success('Tournée créée');
      setShowCreate(false);
      setNewLivreurId('');
      setRefresh((r) => r + 1);
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddColis(tourneeId: string) {
    if (!selectedCommandeId) {
      toast.error('Sélectionnez une commande');
      return;
    }
    const existingCount = tournees.find((t) => t.id === tourneeId)?.commandes?.length ?? 0;
    setSaving(true);
    try {
      await createTourneeCommande({
        tournee_id: tourneeId,
        commande_id: selectedCommandeId,
        ordre: existingCount + 1,
        statut_livraison: 'en_attente',
      });
      toast.success('Colis ajouté à la tournée');
      setShowAddColis(null);
      setSelectedCommandeId('');
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  }

  async function handleDemarrer(tourneeId: string) {
    try {
      await updateTournee(tourneeId, { statut: 'en_cours' });
      toast.success('Tournée démarrée');
      setRefresh((r) => r + 1);
    } catch {
      toast.error('Erreur');
    }
  }

  async function handleCloturer(tourneeId: string) {
    try {
      await updateTournee(tourneeId, {
        statut: 'cloturee',
        date_cloture: new Date().toISOString(),
      });
      toast.success('Tournée clôturée');
      setRefresh((r) => r + 1);
    } catch {
      toast.error('Erreur');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Tournées</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et gérez les tournées de tous les livreurs</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle tournée
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {(['en_preparation', 'en_cours', 'cloturee'] as const).map((s) => (
          <Card key={s}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{tournees.filter((t) => t.statut === s).length}</p>
              <p className="text-xs text-muted-foreground mt-1">{getStatutLabel(s)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des tournées */}
      <div className="space-y-3">
        {tournees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune tournée — créez la première.
            </CardContent>
          </Card>
        ) : (
          tournees.map((tournee) => {
            const livreur = livreursMap[tournee.livreur_id];
            const isOpen = expanded === tournee.id;
            return (
              <Card key={tournee.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : tournee.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {(livreur?.nom ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{livreur?.nom ?? 'Livreur inconnu'}</p>
                      <p className="text-xs text-muted-foreground">Tournée du {tournee.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutBadge(tournee.statut)}`}>
                      {getStatutLabel(tournee.statut)}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t p-4 bg-gray-50 space-y-3">
                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {tournee.statut === 'en_preparation' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => { setShowAddColis(tournee.id); setSelectedCommandeId(''); }}
                          >
                            <PackagePlus className="w-3 h-3" />
                            Ajouter colis
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleDemarrer(tournee.id)}
                          >
                            Démarrer
                          </Button>
                        </>
                      )}
                      {tournee.statut === 'en_cours' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => handleCloturer(tournee.id)}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Clôturer
                        </Button>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="text-xs text-muted-foreground">
                      Créée le {new Date(tournee.date_creation).toLocaleDateString('fr-FR')}
                      {tournee.date_cloture && (
                        <> · Clôturée le {new Date(tournee.date_cloture).toLocaleDateString('fr-FR')}</>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog créer tournée */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tournée</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Livreur</label>
              <Select value={newLivreurId} onValueChange={(v) => setNewLivreurId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un livreur" />
                </SelectTrigger>
                <SelectContent>
                  {(livreurs ?? []).map((l: User) => (
                    <SelectItem key={l.id} value={l.id}>{l.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreateTournee} disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ajouter colis */}
      <Dialog open={!!showAddColis} onOpenChange={() => setShowAddColis(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un colis à la tournée</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(commandesEnPrep ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune commande en préparation disponible
              </p>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium">Commande (en préparation)</label>
                <Select value={selectedCommandeId} onValueChange={(v) => setSelectedCommandeId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une commande" />
                  </SelectTrigger>
                  <SelectContent>
                    {(commandesEnPrep ?? []).map((c: Commande) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} — {c.destinataire_nom} ({c.ville})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColis(null)}>Annuler</Button>
            <Button
              onClick={() => showAddColis && handleAddColis(showAddColis)}
              disabled={saving || !selectedCommandeId}
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
