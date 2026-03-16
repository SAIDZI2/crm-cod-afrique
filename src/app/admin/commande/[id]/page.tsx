'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
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
import { getCommandeById, getCommandesByTelephone } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/constants';
import { ArrowLeft, AlertTriangle, Phone, Package, MapPin, User } from 'lucide-react';

export default function AdminCommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const commandeId = params.id as string;

  const { data: commande, loading: l1, error } = useSupabase(
    () => getCommandeById(commandeId),
    [commandeId]
  );
  const { data: clientHistory, loading: l2 } = useSupabase(
    () => commande?.telephone ? getCommandesByTelephone(commande.telephone) : Promise.resolve([]),
    [commande?.telephone]
  );

  if (l1 || l2) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  if (!commande) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">Commande introuvable</h2>
        <p className="text-muted-foreground">L&apos;identifiant {commandeId} ne correspond à aucune commande.</p>
        <Button variant="outline" onClick={() => router.push('/admin/commandes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux commandes
        </Button>
      </div>
    );
  }

  const otherOrders = (clientHistory ?? []).filter((c) => c.id !== commande.id);

  const retours = commande.retours ?? [];
  const appels = commande.appels ?? [];
  const mediaBuyer = commande.user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/commandes')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détail Commande</h1>
            <p className="text-sm text-muted-foreground">
              {commande.id} — {formatDateTime(commande.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge statut={commande.statut} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nom</p>
                <p className="font-medium">{commande.destinataire_nom}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="font-medium font-mono">{commande.telephone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="text-sm">{commande.adresse}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ville</p>
                <p className="text-sm">{commande.ville}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-2">Historique client</p>
              {otherOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-muted-foreground">
                  Première commande de ce client.
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{otherOrders.length} commande{otherOrders.length > 1 ? 's' : ''} précédente{otherOrders.length > 1 ? 's' : ''}</span>
                    <span className="font-medium">{formatCurrency(otherOrders.reduce((s, c) => s + c.montant_total, 0))}</span>
                  </div>
                  {otherOrders.slice(0, 3).map((o) => (
                    <div key={o.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDate(o.created_at)}</span>
                      <div className="flex gap-2">
                        <StatusBadge statut={o.statut} />
                        <span>{formatCurrency(o.montant_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détail de la Commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ID Commande</p>
                <p className="font-mono text-sm font-medium">{commande.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date création</p>
                <p className="text-sm">{formatDate(commande.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Produits</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {commande.commande_produits?.map((cp) => (
                  <div key={cp.id || cp.produit_id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{cp.produit?.nom || 'Produit'}</p>
                      <p className="text-xs text-muted-foreground">Qté: {cp.quantite}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(cp.prix_unitaire * cp.quantite)}</p>
                  </div>
                ))}
                {(!commande.commande_produits || commande.commande_produits.length === 0) && (
                  <p className="text-sm text-muted-foreground">Aucun produit</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(commande.montant_total)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <Badge variant="outline">{commande.source || 'Direct'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Media Buyer</p>
                <p className="text-sm font-medium">{mediaBuyer?.nom ?? '-'}</p>
              </div>
            </div>

            {commande.commentaire && (
              <div>
                <p className="text-xs text-muted-foreground">Commentaires</p>
                <p className="text-sm mt-1">{commande.commentaire}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call History */}
      {appels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Historique des appels ({appels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appels.map((appel) => (
                  <TableRow key={appel.id}>
                    <TableCell className="text-sm">{formatDateTime(appel.date_appel)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {appel.resultat.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {Math.floor(appel.duree_secondes / 60)}m {appel.duree_secondes % 60}s
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{appel.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Retours */}
      {retours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Retours ({retours.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Reçu au dépôt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retours.map((retour) => (
                  <TableRow key={retour.id}>
                    <TableCell className="text-sm">{formatDateTime(retour.date_retour)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {retour.motif.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{retour.note || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={retour.recu_au_depot ? 'default' : 'secondary'}>
                        {retour.recu_au_depot ? 'Oui' : 'Non'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
