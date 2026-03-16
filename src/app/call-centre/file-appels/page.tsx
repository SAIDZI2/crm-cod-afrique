'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { usePagination } from '@/hooks/use-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useRealtime } from '@/hooks/use-realtime';
import { getCommandes, getRappels, getProduits } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { VILLES_RDC } from '@/lib/constants';
import { Phone, FileText } from 'lucide-react';
import type { Commande, CommandeProduit, Produit, User } from '@/lib/types';

type CommandeWithJoins = Commande & { user?: User; commande_produits: (CommandeProduit & { produit: Produit })[] };

interface QueueItem {
  commande: CommandeWithJoins;
  priority: number;
  priorityLabel: string;
  priorityColor: string;
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return phone.slice(0, -4).replace(/\d(?=.{2,})/g, (m, offset) => (offset > 4 ? '*' : m)) + phone.slice(-4);
}

function getTimeDiffMinutes(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return (now.getTime() - then.getTime()) / (1000 * 60);
}

export default function FileAppelsPage() {
  const { data: commandesData, loading: l1, refetch: refetchCommandes } = useSupabase(() => getCommandes(), []);
  const { data: rappelsData, loading: l2 } = useSupabase(() => getRappels(), []);
  const { data: produitsData, loading: l3 } = useSupabase(() => getProduits(), []);

  // Auto-refresh when commandes table changes
  useRealtime('commandes', refetchCommandes);

  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [productFilter, setProductFilter] = useState<string>('tous');
  const [cityFilter, setCityFilter] = useState<string>('tous');

  const allCommandes = commandesData ?? [];
  const rappels = rappelsData ?? [];
  const produits = produitsData ?? [];

  // Build queue items
  const commandesFiltrees = allCommandes.filter(
    (c) => c.statut === 'nouveau' || c.statut === 'reporte'
  );

  const overdueRappelCommandeIds = new Set(
    rappels
      .filter((r) => r.statut === 'en_attente' && new Date(r.date_rappel) < new Date())
      .map((r) => r.commande_id)
  );

  const scheduledTodayCommandeIds = new Set(
    rappels
      .filter((r) => {
        const rappelDate = new Date(r.date_rappel);
        const now = new Date();
        return (
          r.statut === 'en_attente' &&
          rappelDate >= now &&
          rappelDate.toDateString() === now.toDateString()
        );
      })
      .map((r) => r.commande_id)
  );

  const queueItems: QueueItem[] = commandesFiltrees.map((commande) => {
    if (overdueRappelCommandeIds.has(commande.id)) {
      return { commande, priority: 1, priorityLabel: 'Urgent', priorityColor: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (scheduledTodayCommandeIds.has(commande.id)) {
      return { commande, priority: 5, priorityLabel: 'Rappel', priorityColor: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    if (commande.statut === 'nouveau') {
      const ageMinutes = getTimeDiffMinutes(commande.created_at);
      if (ageMinutes < 30) return { commande, priority: 2, priorityLabel: 'Haute', priorityColor: 'bg-orange-100 text-orange-700 border-orange-200' };
      if (ageMinutes < 120) return { commande, priority: 3, priorityLabel: 'Normale', priorityColor: 'bg-blue-100 text-blue-700 border-blue-200' };
      return { commande, priority: 4, priorityLabel: 'Basse', priorityColor: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    return { commande, priority: 4, priorityLabel: 'Basse', priorityColor: 'bg-gray-100 text-gray-700 border-gray-200' };
  }).sort((a, b) => a.priority - b.priority);

  const filteredItems = queueItems.filter((item) => {
    const c = item.commande;
    if (statusFilter !== 'tous' && c.statut !== statusFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      if (!c.destinataire_nom.toLowerCase().includes(s) && !c.telephone.includes(s) && !c.id.toLowerCase().includes(s)) return false;
    }
    if (productFilter !== 'tous') {
      const hasProduct = c.commande_produits?.some((cp) => cp.produit_id === productFilter);
      if (!hasProduct) return false;
    }
    if (cityFilter !== 'tous' && c.ville !== cityFilter) return false;
    return true;
  });

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredItems, 15);

  if (l1 || l2 || l3) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File d&apos;Appels</h1>
        <p className="text-sm text-gray-500 mt-1">
          File intelligente triée par priorité - {filteredItems.length} leads en attente
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="reporte">Reporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Recherche</label>
              <Input
                placeholder="Nom, téléphone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[220px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Produit</label>
              <Select value={productFilter} onValueChange={(v) => v && setProductFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les produits</SelectItem>
                  {produits.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ville</label>
              <Select value={cityFilter} onValueChange={(v) => v && setCityFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les villes</SelectItem>
                  {VILLES_RDC.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">File d&apos;attente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priorité</TableHead>
                <TableHead>Heure arrivée</TableHead>
                <TableHead>Nom client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const c = item.commande as typeof allCommandes[0];
                const firstProduct = c.commande_produits?.[0]?.produit;

                return (
                  <TableRow key={c.id} className={item.priority === 1 ? 'bg-red-50' : ''}>
                    <TableCell>
                      <Badge variant="outline" className={`${item.priorityColor} border font-medium`}>
                        {item.priorityLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{c.destinataire_nom}</TableCell>
                    <TableCell className="text-sm font-mono">{maskPhone(c.telephone)}</TableCell>
                    <TableCell className="text-sm">{firstProduct?.nom || '-'}</TableCell>
                    <TableCell>{c.ville}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(c.montant_total)}</TableCell>
                    <TableCell>
                      <StatusBadge statut={c.statut} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/call-centre/commande/${c.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <FileText className="w-3 h-3" />
                            Ouvrir fiche
                          </Button>
                        </Link>
                        <Link href={`/call-centre/commande/${c.id}`}>
                          <Button size="sm" className="gap-1">
                            <Phone className="w-3 h-3" />
                            Appeler
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Aucun lead dans la file d&apos;attente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredItems.length} />
        </CardContent>
      </Card>
    </div>
  );
}
