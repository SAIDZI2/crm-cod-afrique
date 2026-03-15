'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import { getProduits, createCommande, createCommandeProduits, checkBlacklist } from '@/lib/supabase/queries';
import { formatCurrency, VILLES_RDC } from '@/lib/constants';
import { toast } from 'sonner';

export default function NouvelleCommandePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: produits, loading } = useSupabase(() => getProduits(), []);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    destinataire_nom: '',
    telephone: '',
    adresse: '',
    ville: '',
    produit_id: '',
    quantite: 1,
    commentaire: '',
    remise: 0,
  });

  if (loading) return <LoadingPage />;

  const produitsList = produits ?? [];

  const selectedProduit = produitsList.find((p) => p.id === form.produit_id);

  const sousTotal = selectedProduit ? selectedProduit.prix * form.quantite : 0;
  const total = Math.max(0, sousTotal - form.remise);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.destinataire_nom || !form.telephone || !form.ville || !form.produit_id) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    try {
      setSubmitting(true);
      // Check blacklist before creating
      const isBlacklisted = await checkBlacklist(form.telephone);
      if (isBlacklisted) {
        toast.error('Ce numero de telephone est dans la blacklist. Commande refusee.');
        setSubmitting(false);
        return;
      }
      const commande = await createCommande({
        user_id: user!.id,
        destinataire_nom: form.destinataire_nom,
        telephone: form.telephone,
        adresse: form.adresse,
        ville: form.ville,
        montant_total: total,
        remise: form.remise,
        commentaire: form.commentaire || undefined,
        statut: 'nouveau',
      });
      await createCommandeProduits([
        {
          commande_id: commande.id,
          produit_id: form.produit_id,
          quantite: form.quantite,
          prix_unitaire: selectedProduit!.prix,
        },
      ]);
      toast.success(`Commande creee! ${form.destinataire_nom} — ${selectedProduit?.nom} — ${formatCurrency(total)}`);
      router.push('/media-buyer/commandes');
    } catch (err) {
      toast.error('Erreur lors de la creation: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle Commande</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du destinataire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destinataire_nom">Nom du destinataire *</Label>
                <Input
                  id="destinataire_nom"
                  value={form.destinataire_nom}
                  onChange={(e) => handleChange('destinataire_nom', e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone *</Label>
                <Input
                  id="telephone"
                  value={form.telephone}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="+243 ..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={form.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                placeholder="Adresse de livraison"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <Select value={form.ville} onValueChange={(v) => handleChange('ville', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  {VILLES_RDC.map((ville) => (
                    <SelectItem key={ville} value={ville}>
                      {ville}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="produit">Produit *</Label>
              <Select value={form.produit_id} onValueChange={(v) => handleChange('produit_id', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produitsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} - {formatCurrency(p.prix)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantite">Quantite</Label>
                <Input
                  id="quantite"
                  type="number"
                  min={1}
                  value={form.quantite}
                  onChange={(e) => handleChange('quantite', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remise">Remise ($)</Label>
                <Input
                  id="remise"
                  type="number"
                  min={0}
                  value={form.remise}
                  onChange={(e) => handleChange('remise', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={form.commentaire}
                onChange={(e) => handleChange('commentaire', e.target.value)}
                placeholder="Notes supplementaires..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total</span>
                <span>{formatCurrency(sousTotal)}</span>
              </div>
              {form.remise > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Remise</span>
                  <span>-{formatCurrency(form.remise)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? 'Creation en cours...' : 'Creer la Commande'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
