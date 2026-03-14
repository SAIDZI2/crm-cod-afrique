'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandeById, checkBlacklist, updateCommandeStatut, createAppel, createRappel } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/constants';
import {
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Ban,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

const AGENT_ID = 'a1000000-0000-0000-0000-000000000004';

export default function CommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const commandeId = params.id as string;

  const [note, setNote] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [scriptOpen, setScriptOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: commande, loading: l1 } = useSupabase(
    () => getCommandeById(commandeId),
    [commandeId]
  );

  if (l1) return <LoadingPage />;

  if (!commande) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">Commande introuvable</h2>
        <p className="text-muted-foreground">L&apos;identifiant {commandeId} ne correspond a aucune commande.</p>
        <Button variant="outline" onClick={() => router.push('/call-centre/file-appels')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour a la file
        </Button>
      </div>
    );
  }

  const appels = commande.appels ?? [];
  const firstProduct = commande.commande_produits?.[0]?.produit;

  const resultatLabels: Record<string, string> = {
    confirme: 'Confirme',
    echoue: 'Echoue',
    reporte: 'Reporte',
    pas_de_reponse: 'Pas de reponse',
    occupe: 'Occupe',
    numero_invalide: 'Numero invalide',
  };

  const resultatColors: Record<string, string> = {
    confirme: 'bg-green-100 text-green-700',
    echoue: 'bg-red-100 text-red-700',
    reporte: 'bg-orange-100 text-orange-700',
    pas_de_reponse: 'bg-gray-100 text-gray-700',
    occupe: 'bg-yellow-100 text-yellow-700',
    numero_invalide: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche Commande</h1>
            <p className="text-sm text-muted-foreground">
              {commande.id} - {formatDateTime(commande.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge statut={commande.statut} />
      </div>

      {/* Split Layout: Client Info + Order Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nom</p>
                <p className="font-medium">{commande.destinataire_nom}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telephone</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium font-mono">{commande.telephone}</p>
                  <Button size="sm" variant="outline" className="h-7 gap-1">
                    <Phone className="w-3 h-3" />
                    Appeler
                  </Button>
                </div>
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
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-muted-foreground">
                Premiere commande de ce client (pas d&apos;historique disponible).
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Order Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail de la Commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ID Commande</p>
                <p className="font-mono text-sm font-medium">{commande.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date creation</p>
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
                      <p className="text-xs text-muted-foreground">Qty: {cp.quantite}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(cp.prix_unitaire * cp.quantite)}</p>
                  </div>
                ))}
                {(!commande.commande_produits || commande.commande_produits.length === 0) && (
                  <p className="text-sm text-muted-foreground">Aucun produit</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(commande.montant_total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <Badge variant="outline">{commande.source || 'Direct'}</Badge>
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

      {/* Action Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-green-600 hover:bg-green-700 gap-2">
              <CheckCircle className="w-4 h-4" />
              Confirmer
            </Button>

            <Button variant="destructive" className="gap-2">
              <XCircle className="w-4 h-4" />
              Echoue
            </Button>

            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                    <Clock className="w-4 h-4" />
                    Reporter
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Planifier un rappel</DialogTitle>
                  <DialogDescription>
                    Choisissez la date et l&apos;heure du rappel pour cette commande.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input
                      type="time"
                      value={reportTime}
                      onChange={(e) => setReportTime(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setReportDialogOpen(false)}
                  >
                    Confirmer le rappel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button className="bg-yellow-500 hover:bg-yellow-600 gap-2">
              <Edit className="w-4 h-4" />
              Modifier
            </Button>

            <Button variant="outline" className="bg-gray-900 text-white hover:bg-gray-800 gap-2">
              <Ban className="w-4 h-4" />
              Blacklister
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ajouter une note sur cet appel..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <Button size="sm" disabled={!note.trim()}>
              Enregistrer la note
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Historique des appels</p>
            {appels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appel enregistre pour cette commande.</p>
            ) : (
              <div className="space-y-2">
                {appels.map((appel) => (
                  <div
                    key={appel.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {formatDateTime(appel.date_appel)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duree: {Math.floor(appel.duree_secondes / 60)}m{' '}
                          {appel.duree_secondes % 60}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${resultatColors[appel.resultat] || 'bg-gray-100 text-gray-700'} border-0`}
                      >
                        {resultatLabels[appel.resultat] || appel.resultat}
                      </Badge>
                      {appel.note && (
                        <span className="text-xs text-muted-foreground italic">{appel.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Script d'appel (Collapsible) */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setScriptOpen(!scriptOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Script d&apos;appel</CardTitle>
            {scriptOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {scriptOpen && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">Etape 1</Badge>
                  <span className="font-medium text-sm">Accueil</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Bonjour, je suis [votre nom] de [entreprise]. Je vous appelle concernant
                  votre commande de {firstProduct?.nom || 'votre produit'}. Est-ce bien{' '}
                  {commande.destinataire_nom} ?&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-green-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600">Etape 2</Badge>
                  <span className="font-medium text-sm">Confirmation des informations</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Je voudrais confirmer votre commande. Votre adresse de livraison est bien le{' '}
                  {commande.adresse}, {commande.ville} ? Le montant total est de{' '}
                  {formatCurrency(commande.montant_total)}, payable a la livraison.&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-yellow-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-600">Etape 3</Badge>
                  <span className="font-medium text-sm">Upsell</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Nous avons egalement une offre speciale en ce moment. Souhaitez-vous ajouter
                  un produit complementaire a prix reduit ?&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-purple-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-600">Etape 4</Badge>
                  <span className="font-medium text-sm">Gestion des objections</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Si le client hesite : &quot;Je comprends votre hesitation. Ce produit est tres
                  populaire et nous avons un stock limite. La livraison est rapide et vous ne payez
                  qu&apos;a la reception.&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-600">Etape 5</Badge>
                  <span className="font-medium text-sm">Cloture</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Parfait, votre commande est confirmee. Vous recevrez votre colis sous 24 a
                  48h. Merci pour votre confiance et bonne journee !&quot;
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
