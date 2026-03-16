'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '@/hooks/use-auth';
import {
  getCommandeById,
  getCommandesByTelephone,
  updateCommandeStatut,
  createAppel,
  createRappel,
  addToBlacklist,
} from '@/lib/supabase/queries';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/constants';
import {
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function CommandeDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const commandeId = params.id as string;

  const [note, setNote] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [scriptOpen, setScriptOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Call timer
  const [callActive, setCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getCallDuration = () => callSeconds;
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: commande, loading: l1, refetch } = useSupabase(
    () => getCommandeById(commandeId),
    [commandeId]
  );
  const { data: clientHistory, loading: l2 } = useSupabase(
    () => commande?.telephone ? getCommandesByTelephone(commande.telephone) : Promise.resolve([]),
    [commande?.telephone]
  );

  if (l1 || l2) return <LoadingPage />;

  if (!commande) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">Commande introuvable</h2>
        <p className="text-muted-foreground">L&apos;identifiant {commandeId} ne correspond à aucune commande.</p>
        <Button variant="outline" onClick={() => router.push('/call-centre/file-appels')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la file
        </Button>
      </div>
    );
  }

  const appels = commande.appels ?? [];
  const firstProduct = commande.commande_produits?.[0]?.produit;

  // Status-based action restrictions
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    nouveau: ['confirme', 'echoue', 'reporte'],
    reporte: ['confirme', 'echoue', 'reporte'],
  };
  const allowedActions = ALLOWED_TRANSITIONS[commande.statut] ?? [];
  const canConfirm = allowedActions.includes('confirme');
  const canEchoue = allowedActions.includes('echoue');
  const canReporter = allowedActions.includes('reporte');

  // Client history
  const otherOrders = (clientHistory ?? []).filter((c) => c.id !== commande.id);
  const totalHistoryAmount = otherOrders.reduce((sum, c) => sum + c.montant_total, 0);

  async function handleAction(action: string, handler: () => Promise<void>) {
    setActionLoading(action);
    setFeedback(null);
    try {
      await handler();
      setFeedback({ type: 'success', message: `Action "${action}" effectuée avec succès.` });
      setCallActive(false);
      setCallSeconds(0);
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmer() {
    if (!user || !commande) return;
    await handleAction('Confirmer', async () => {
      await updateCommandeStatut(commande.id, 'confirme', user.id);
      await createAppel({
        commande_id: commande.id,
        agent_id: user.id,
        resultat: 'confirme',
        duree_secondes: getCallDuration(),
        note: note.trim() || undefined,
      });
    });
  }

  async function handleEchoue() {
    if (!user || !commande) return;
    await handleAction('Echoue', async () => {
      await updateCommandeStatut(commande.id, 'echoue', user.id);
      await createAppel({
        commande_id: commande.id,
        agent_id: user.id,
        resultat: 'echoue',
        duree_secondes: getCallDuration(),
        note: note.trim() || undefined,
      });
    });
  }

  async function handleReporter() {
    if (!reportDate || !reportTime || !user || !commande) return;
    await handleAction('Reporter', async () => {
      const dateRappel = new Date(`${reportDate}T${reportTime}`).toISOString();
      await createRappel({
        commande_id: commande.id,
        agent_id: user.id,
        date_rappel: dateRappel,
        note: note.trim() || undefined,
      });
      await updateCommandeStatut(commande.id, 'reporte', user.id);
      setReportDialogOpen(false);
      setReportDate('');
      setReportTime('');
    });
  }

  async function handleBlacklister() {
    if (!commande) return;
    await handleAction('Blacklister', async () => {
      await addToBlacklist({
        telephone: commande.telephone,
        motif: `Blacklisté depuis commande ${commande.id}`,
        user_id: user?.id,
      });
    });
  }

  async function handleSaveNote() {
    if (!note.trim() || !user || !commande) return;
    await handleAction('Note', async () => {
      await createAppel({
        commande_id: commande.id,
        agent_id: user.id,
        resultat: 'pas_de_reponse',
        duree_secondes: getCallDuration(),
        note: note.trim(),
      });
      setNote('');
    });
  }

  const isLoading = (action: string) => actionLoading === action;

  const resultatLabels: Record<string, string> = {
    confirme: 'Confirmé',
    echoue: 'Échoué',
    reporte: 'Reporté',
    pas_de_reponse: 'Pas de réponse',
    occupe: 'Occupé',
    numero_invalide: 'Numéro invalide',
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

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

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
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium font-mono">{commande.telephone}</p>
                  <a href={`tel:${commande.telephone}`}>
                    <Button size="sm" variant="outline" className="h-7 gap-1">
                      <Phone className="w-3 h-3" />
                      Appeler
                    </Button>
                  </a>
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
              {otherOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-muted-foreground">
                  Première commande de ce client.
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{otherOrders.length} commande{otherOrders.length > 1 ? 's' : ''} précédente{otherOrders.length > 1 ? 's' : ''}</span>
                    <span className="font-medium">{formatCurrency(totalHistoryAmount)}</span>
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
                  {otherOrders.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ {otherOrders.length - 3} autres commandes</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Order Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail de la Commande</CardTitle>
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

      {/* Call Timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Chronomètre d&apos;appel</p>
                <p className={`text-2xl font-mono font-bold ${callActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {formatTimer(callSeconds)}
                </p>
              </div>
            </div>
            <Button
              variant={callActive ? 'destructive' : 'default'}
              onClick={() => setCallActive(!callActive)}
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              {callActive ? 'Arrêter' : 'Démarrer l\'appel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {!canConfirm && !canEchoue && !canReporter ? (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-muted-foreground">
              Cette commande est au statut &quot;{commande.statut}&quot; — aucune action disponible.
              <div className="mt-3">
                <Button variant="outline" className="gap-2" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700 gap-2"
                onClick={handleConfirmer}
                disabled={!!actionLoading || !canConfirm}
              >
                {isLoading('Confirmer') ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmer
              </Button>

              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleEchoue}
                disabled={!!actionLoading || !canEchoue}
              >
                {isLoading('Échoué') ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Échoué
              </Button>

              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="bg-orange-500 hover:bg-orange-600 gap-2" disabled={!!actionLoading || !canReporter}>
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
                      onClick={handleReporter}
                      disabled={!reportDate || !reportTime || !!actionLoading}
                    >
                      {isLoading('Reporter') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Confirmer le rappel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="bg-gray-900 text-white hover:bg-gray-800 gap-2"
                onClick={handleBlacklister}
                disabled={!!actionLoading}
              >
                {isLoading('Blacklister') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Blacklister
              </Button>

              <Button variant="outline" className="gap-2" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          )}
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
            <Button
              size="sm"
              disabled={!note.trim() || !!actionLoading}
              onClick={handleSaveNote}
            >
              {isLoading('Note') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer la note
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Historique des appels</p>
            {appels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appel enregistré pour cette commande.</p>
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
                          Durée: {Math.floor(appel.duree_secondes / 60)}m{' '}
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
                  <Badge className="bg-blue-600">Étape1</Badge>
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
                  <Badge className="bg-green-600">Étape2</Badge>
                  <span className="font-medium text-sm">Confirmation des informations</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Je voudrais confirmer votre commande. Votre adresse de livraison est bien le{' '}
                  {commande.adresse}, {commande.ville} ? Le montant total est de{' '}
                  {formatCurrency(commande.montant_total)}, payable à la livraison.&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-yellow-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-600">Étape3</Badge>
                  <span className="font-medium text-sm">Upsell</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Nous avons également une offre spéciale en ce moment. Souhaitez-vous ajouter
                  un produit complémentaire à prix réduit ?&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-purple-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-600">Étape4</Badge>
                  <span className="font-medium text-sm">Gestion des objections</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Si le client hésite : &quot;Je comprends votre hésitation. Ce produit est très
                  populaire et nous avons un stock limité. La livraison est rapide et vous ne payez
                  qu&apos;à la réception.&quot;
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-600">Étape5</Badge>
                  <span className="font-medium text-sm">Clôture</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &quot;Parfait, votre commande est confirmée. Vous recevrez votre colis sous 24 à
                  48h. Merci pour votre confiance et bonne journée !&quot;
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
