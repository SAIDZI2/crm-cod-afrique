'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import {
  getTournees,
  getUsersByRole,
  getCommandesByStatut,
  createTournee,
  createTourneeCommande,
  updateCommandeStatut,
} from '@/lib/supabase/queries';
import { formatDate, formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, Plus, Truck } from 'lucide-react';

const STATUT_TOURNEE_CONFIG: Record<string, { label: string; color: string }> = {
  en_preparation: { label: 'En Préparation', color: 'bg-yellow-100 text-yellow-700' },
  en_cours: { label: 'En Cours', color: 'bg-blue-100 text-blue-700' },
  cloturee: { label: 'Clôturée', color: 'bg-green-100 text-green-700' },
};

export default function AdminTourneesPage() {
  const { data: tourneesData, loading: l1, refetch } = useSupabase(() => getTournees(), []);
  const { data: livreursData, loading: l2 } = useSupabase(() => getUsersByRole('livreur'), []);
  const { data: commandesConfirmees, loading: l3, refetch: refetchCmd } = useSupabase(
    () => getCommandesByStatut('confirme'),
    []
  );
  const [showCreate, setShowCreate] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCommandes, setSelectedCommandes] = useState<string[]>([]);

  if (l1 || l2 || l3) return <LoadingPage />;
  const tournees = tourneesData ?? [];
  const livreurs = livreursData ?? [];
  const cmdConfirmees = commandesConfirmees ?? [];

  const toggleCommande = (id: string) => {
    setSelectedCommandes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!selectedLivreur || !selectedDate) {
      toast.error('Sélectionnez un livreur et une date.');
      return;
    }
    if (selectedCommandes.length === 0) {
      toast.error('Sélectionnez au moins une commande.');
      return;
    }
    setFormLoading(true);
    try {
      const tournee = await createTournee({
        livreur_id: selectedLivreur,
        date: selectedDate,
        statut: 'en_cours',
      });

      await Promise.all(
        selectedCommandes.map(async (cmdId, i) => {
          await createTourneeCommande({
            tournee_id: tournee.id,
            commande_id: cmdId,
            ordre: i + 1,
          });
          await updateCommandeStatut(cmdId, 'en_preparation', undefined, selectedLivreur);
        })
      );

      toast.success(`Tournée créée avec ${selectedCommandes.length} commande(s) !`);
      setShowCreate(false);
      setSelectedLivreur('');
      setSelectedDate('');
      setSelectedCommandes([]);
      refetch();
      refetchCmd();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Tournées</h1>
          <p className="text-sm text-muted-foreground">{tournees.length} tournées · {cmdConfirmees.length} commandes confirmées en attente</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" />Nouvelle tournée</Button>} />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une tournée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Livreur *</Label>
                  <Select value={selectedLivreur} onValueChange={(v) => v && setSelectedLivreur(v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {livreurs.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Commandes confirmées ({cmdConfirmees.length} disponibles)</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {cmdConfirmees.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">Aucune commande confirmée.</div>
                  ) : (
                    cmdConfirmees.map((cmd) => (
                      <div
                        key={cmd.id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedCommandes.includes(cmd.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleCommande(cmd.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCommandes.includes(cmd.id)}
                            onChange={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                          <div>
                            <p className="text-sm font-medium">{cmd.destinataire_nom}</p>
                            <p className="text-xs text-muted-foreground">{cmd.ville} — {cmd.telephone}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(cmd.montant_total)}</span>
                      </div>
                    ))
                  )}
                </div>
                {selectedCommandes.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">
                    {selectedCommandes.length} commande(s) sélectionnée(s)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                Créer la tournée
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournées existantes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Création</TableHead>
                <TableHead>Clôture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournees.map((t) => {
                const config = STATUT_TOURNEE_CONFIG[t.statut] ?? STATUT_TOURNEE_CONFIG.en_preparation;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{formatDate(t.date)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.color} border-0`}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.date_creation)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date_cloture ? formatDate(t.date_cloture) : '-'}</TableCell>
                  </TableRow>
                );
              })}
              {tournees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune tournée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
