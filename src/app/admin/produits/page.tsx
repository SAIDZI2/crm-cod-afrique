'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getProduits, createProduit, updateProduit, deleteProduit } from '@/lib/supabase/queries';
import { uploadProductImage } from '@/lib/supabase/storage';
import { formatCurrency, CATEGORIES_PRODUITS } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';

export default function AdminProduitsPage() {
  const { data: produitsData, loading, refetch } = useSupabase(() => getProduits(), []);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    sku: '',
    categorie: '',
    prix: '',
    commission_livraison: '',
    stock: '',
    description: '',
  });

  const [editForm, setEditForm] = useState<{
    id: string;
    nom: string;
    sku: string;
    categorie: string;
    prix: string;
    commission_livraison: string;
    stock: string;
    description: string;
  } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const resetForm = () => { setForm({ nom: '', sku: '', categorie: '', prix: '', commission_livraison: '', stock: '', description: '' }); setImageFile(null); };

  const handleCreate = async () => {
    if (!form.nom || !form.prix) { toast.error('Nom et prix requis.'); return; }
    setFormLoading(true);
    try {
      const newProduit = await createProduit({
        nom: form.nom,
        sku: form.sku || `SKU-${Date.now()}`,
        categorie: form.categorie || 'Autre',
        prix: parseFloat(form.prix),
        commission_livraison: parseFloat(form.commission_livraison) || 0,
        stock: parseInt(form.stock) || 0,
        statut_stock: 'en_stock',
        description: form.description || undefined,
        actif: true,
      });
      if (imageFile && newProduit?.id) {
        try {
          const imageUrl = await uploadProductImage(imageFile, newProduit.id);
          await updateProduit(newProduit.id, { image_url: imageUrl } as Record<string, unknown>);
        } catch {
          toast.warning('Produit créé mais l\'upload de l\'image a échoué. Vous pouvez réessayer via la modification.');
        }
      }
      toast.success('Produit créé !');
      resetForm();
      setShowCreate(false);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    setFormLoading(true);
    try {
      await updateProduit(editForm.id, {
        nom: editForm.nom,
        sku: editForm.sku,
        categorie: editForm.categorie,
        prix: parseFloat(editForm.prix),
        commission_livraison: parseFloat(editForm.commission_livraison) || 0,
        stock: parseInt(editForm.stock) || 0,
        description: editForm.description || undefined,
      } as Record<string, unknown>);
      toast.success('Produit modifié !');
      setShowEdit(false);
      setEditForm(null);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce produit ?')) return;
    try {
      await deleteProduit(id);
      toast.success('Produit désactivé.');
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    }
  };

  const openEdit = (p: { id: string; nom: string; sku: string; categorie: string; prix: number; commission_livraison: number; stock: number; description?: string }) => {
    setEditForm({
      id: p.id,
      nom: p.nom,
      sku: p.sku,
      categorie: p.categorie,
      prix: String(p.prix),
      commission_livraison: String(p.commission_livraison),
      stock: String(p.stock),
      description: p.description ?? '',
    });
    setShowEdit(true);
  };

  if (loading) return <LoadingPage />;
  const produits = produitsData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Produits</h1>
          <p className="text-sm text-muted-foreground">{produits.length} produits</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" />Nouveau produit</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nom *</Label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="mt-1" placeholder="Nom du produit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-1" placeholder="SKU-001" />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={form.categorie} onValueChange={(v) => v && setForm({ ...form, categorie: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES_PRODUITS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Prix ($) *</Label>
                  <Input type="number" min="0" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Commission livr.</Label>
                  <Input type="number" min="0" value={form.commission_livraison} onChange={(e) => setForm({ ...form, commission_livraison: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" placeholder="Description..." />
              </div>
              <div>
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="overflow-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produits.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nom} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <ImagePlus className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.nom}</TableCell>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell><Badge variant="secondary">{p.categorie}</Badge></TableCell>
                  <TableCell className="font-semibold">{formatCurrency(p.prix)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant={p.actif ? 'default' : 'destructive'}>{p.actif ? 'Actif' : 'Inactif'}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    {p.actif && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {produits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun produit.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nom</Label>
                <Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU</Label>
                  <Input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={editForm.categorie} onValueChange={(v) => v && setEditForm({ ...editForm, categorie: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES_PRODUITS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Prix ($)</Label>
                  <Input type="number" value={editForm.prix} onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Commission</Label>
                  <Input type="number" value={editForm.commission_livraison} onChange={(e) => setEditForm({ ...editForm, commission_livraison: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="mt-1" />
                </div>
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
