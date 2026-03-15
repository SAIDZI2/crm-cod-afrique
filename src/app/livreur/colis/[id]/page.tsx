'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { useAuth } from '@/hooks/use-auth';
import {
  getAllTourneeCommandes, updateTourneeCommande,
  createRetour, createAppel
} from '@/lib/supabase/queries';
import { handleDeliveryComplete, updateCommandeStatutSecure } from '@/lib/supabase/actions';
import { formatCurrency, formatDateTime, MOTIFS_RETOUR } from '@/lib/constants';
import type { StatutLivraison, MotifRetour } from '@/lib/types';
import {
  Phone, MapPin, Package, ArrowLeft, CheckCircle,
  RotateCcw, Clock, AlertTriangle, FileText, Hash, Loader2
} from 'lucide-react';

export default function LivreurColisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const commandeId = params.id as string;

  const [action, setAction] = useState<'none' | 'livre' | 'retour' | 'reporter' | 'probleme'>('none');
  const [montantCollecte, setMontantCollecte] = useState('');
  const [motifRetour, setMotifRetour] = useState<MotifRetour | ''>('');
  const [noteAction, setNoteAction] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: tcData, loading, refetch } = useSupabase(() => getAllTourneeCommandes(), []);

  if (loading) return <LoadingPage />;
  const allTc = tcData ?? [];

  const tc = allTc.find(t => t.commande_id === commandeId);
  const commande = tc?.commande;

  const mapStatutToCommande = (statut: StatutLivraison) => {
    const map: Record<StatutLivraison, string> = {
      en_attente: 'en_preparation',
      en_cours: 'expedie',
      livre: 'livre',
      retourne: 'retourne',
      reporte: 'reporte',
    };
    return map[statut] as import('@/lib/types').StatutCommande;
  };

  if (!tc || !commande) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="min-h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Colis introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setAction('none');
    setMontantCollecte('');
    setMotifRetour('');
    setNoteAction('');
  };

  const handleConfirmLivre = async () => {
    if (!tc) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await updateTourneeCommande(tc.id, {
        statut_livraison: 'livre',
        montant_collecte: Number(montantCollecte) || 0,
        heure_livraison: new Date().toISOString(),
      });
      await handleDeliveryComplete(commande!.id);
      resetForm();
      setFeedback({ type: 'success', message: 'Livraison confirmee avec succes.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRetour = async () => {
    if (!tc || !motifRetour || !user) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await updateTourneeCommande(tc.id, {
        statut_livraison: 'retourne',
        motif_retour: motifRetour as MotifRetour,
      });
      await createRetour({
        commande_id: commande!.id,
        livreur_id: user.id,
        motif: motifRetour as MotifRetour,
        note: noteAction || undefined,
        recu_au_depot: false,
        date_retour: new Date().toISOString(),
      });
      await updateCommandeStatutSecure(commande!.id, 'retourne');
      resetForm();
      setFeedback({ type: 'success', message: 'Retour declare avec succes.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReporter = async () => {
    if (!tc) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await updateTourneeCommande(tc.id, { statut_livraison: 'reporte', note: noteAction || undefined });
      await updateCommandeStatutSecure(commande!.id, 'reporte');
      resetForm();
      setFeedback({ type: 'success', message: 'Report enregistre avec succes.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmProbleme = async () => {
    if (!user || !noteAction) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await createAppel({
        commande_id: commande!.id,
        agent_id: user.id,
        date_appel: new Date().toISOString(),
        duree_secondes: 0,
        resultat: 'pas_de_reponse',
        note: noteAction,
      });
      resetForm();
      setFeedback({ type: 'success', message: 'Probleme signale avec succes.' });
      refetch();
    } catch (err) {
      setFeedback({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="min-h-12">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour a la tournee
      </Button>

      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <StatusBadge statut={mapStatutToCommande(tc.statut_livraison)} />
            <span className="text-xs text-muted-foreground font-mono">Ordre #{tc.ordre}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xl font-bold">{commande.destinataire_nom}</p>
          <a
            href={`tel:${commande.telephone}`}
            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-700 min-h-12"
          >
            <Phone className="w-5 h-5" />
            <span className="text-lg font-medium">{commande.telephone}</span>
          </a>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{commande.adresse}</p>
              <p className="text-muted-foreground">{commande.ville}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>Colis #{tc.ordre} — Commande #{commande.id}</span>
          </div>
          {commande.code_suivi && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span>Suivi: {commande.code_suivi}</span>
            </div>
          )}
          {commande.remise > 0 && (
            <p className="text-sm text-muted-foreground">
              Remise: -{formatCurrency(commande.remise)}
            </p>
          )}
          <Separator />
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Montant a collecter</p>
            <p className="text-4xl font-bold text-green-700">
              {formatCurrency(commande.montant_total)}
            </p>
          </div>
        </CardContent>
      </Card>

      {commande.commentaire && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes du Call Centre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              {commande.commentaire}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Commande creee</span>
            <span>{formatDateTime(commande.created_at)}</span>
          </div>
          {tc.heure_prise_en_charge && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prise en charge</span>
              <span>{formatDateTime(tc.heure_prise_en_charge)}</span>
            </div>
          )}
          {tc.heure_livraison && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatDateTime(tc.heure_livraison)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {tc.statut_livraison === 'en_cours' && action === 'none' && (
        <div className="space-y-2">
          <Button
            className="w-full min-h-14 bg-green-600 hover:bg-green-700 text-white text-lg"
            onClick={() => {
              setAction('livre');
              setMontantCollecte(String(commande.montant_total));
            }}
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            Livre
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {MOTIFS_RETOUR.slice(0, 4).map(motif => (
              <Button
                key={motif.value}
                variant="outline"
                className="min-h-12 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setAction('retour');
                  setMotifRetour(motif.value as MotifRetour);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {motif.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="min-h-12 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => setAction('reporter')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Reporter a demain
            </Button>
            <Button
              variant="outline"
              className="min-h-12 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
              onClick={() => setAction('probleme')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signaler probleme
            </Button>
          </div>
        </div>
      )}

      {action === 'livre' && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-green-800 text-lg">Confirmer la livraison</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Client:</span> {commande.destinataire_nom}</p>
              <p><span className="text-muted-foreground">Montant attendu:</span> {formatCurrency(commande.montant_total)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Montant reellement collecte</Label>
              <Input
                type="number"
                step="0.01"
                value={montantCollecte}
                onChange={e => setMontantCollecte(e.target.value)}
                className="mt-1 min-h-12 text-lg"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 min-h-12 bg-green-600 hover:bg-green-700 text-white text-base" onClick={handleConfirmLivre} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer
              </Button>
              <Button variant="outline" className="min-h-12" onClick={() => setAction('none')}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {action === 'retour' && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-red-800 text-lg">Declarer un retour</h3>
            <p className="text-sm">
              Motif: <span className="font-medium">{MOTIFS_RETOUR.find(m => m.value === motifRetour)?.label}</span>
            </p>
            <div>
              <Label className="text-sm font-medium">Note (optionnel)</Label>
              <Textarea value={noteAction} onChange={e => setNoteAction(e.target.value)} className="mt-1 min-h-20" placeholder="Details supplementaires..." />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 min-h-12 bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmRetour} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer retour
              </Button>
              <Button variant="outline" className="min-h-12" onClick={() => setAction('none')}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {action === 'reporter' && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-orange-800 text-lg">Reporter a demain</h3>
            <div>
              <Label className="text-sm font-medium">Raison (optionnel)</Label>
              <Textarea value={noteAction} onChange={e => setNoteAction(e.target.value)} className="mt-1 min-h-20" placeholder="Pourquoi reporter..." />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 min-h-12 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleConfirmReporter} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer report
              </Button>
              <Button variant="outline" className="min-h-12" onClick={() => setAction('none')}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {action === 'probleme' && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-yellow-800 text-lg">Signaler un probleme</h3>
            <div>
              <Label className="text-sm font-medium">Description du probleme</Label>
              <Textarea value={noteAction} onChange={e => setNoteAction(e.target.value)} className="mt-1 min-h-24" placeholder="Decrivez le probleme..." />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 min-h-12 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleConfirmProbleme} disabled={actionLoading || !noteAction}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Envoyer
              </Button>
              <Button variant="outline" className="min-h-12" onClick={() => setAction('none')}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
