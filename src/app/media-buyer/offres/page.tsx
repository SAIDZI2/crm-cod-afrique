'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getProduits } from '@/lib/supabase/queries';
import { formatCurrency, CATEGORIES_PRODUITS } from '@/lib/constants';
import type { StatutStock } from '@/lib/types';

const stockBadgeConfig: Record<StatutStock, { label: string; className: string }> = {
  en_stock: { label: 'En Stock', className: 'bg-green-100 text-green-700 border-0' },
  faible: { label: 'Stock Faible', className: 'bg-yellow-100 text-yellow-700 border-0' },
  rupture: { label: 'Rupture', className: 'bg-red-100 text-red-700 border-0' },
};

export default function OffresPage() {
  const { data: produits, loading } = useSupabase(() => getProduits(), []);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('toutes');

  if (loading) return <LoadingPage />;

  const produitsList = produits ?? [];

  const filtered = produitsList.filter((p) => {
    const matchSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategorie = categorie === 'toutes' || p.categorie === categorie;
    return matchSearch && matchCategorie;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catalogue des Offres</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categorie} onValueChange={(v) => v && setCategorie(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les categories</SelectItem>
            {CATEGORIES_PRODUITS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((produit) => {
          const stockBadge = stockBadgeConfig[produit.statut_stock];
          return (
            <Card key={produit.id} className="overflow-hidden">
              {/* Product Image */}
              {produit.image_url ? (
                <div className="h-40 overflow-hidden">
                  <img src={produit.image_url} alt={produit.nom} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Pas d&apos;image</span>
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{produit.nom}</h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {produit.categorie}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">SKU: {produit.sku}</p>
                <Badge variant="outline" className={stockBadge.className}>
                  {stockBadge.label}
                </Badge>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(produit.prix)}</p>
                    <p className="text-xs text-muted-foreground">
                      Commission: {formatCurrency(produit.commission_livraison)} / livraison
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun produit ne correspond a votre recherche.
        </div>
      )}
    </div>
  );
}
