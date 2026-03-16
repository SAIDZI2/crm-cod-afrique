'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandeById } from '@/lib/supabase/queries';
import { formatCurrency, formatDate, formatDateTime, STATUT_CONFIG } from '@/lib/constants';
import type { StatutCommande } from '@/lib/types';

const statusFlow: StatutCommande[] = [
  'nouveau',
  'confirme',
  'en_preparation',
  'expedie',
  'livre',
];

export default function CommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: commande, loading } = useSupabase(() => getCommandeById(id), [id]);

  if (loading) return <LoadingPage />;

  if (!commande) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Commande introuvable</h1>
        <p className="text-muted-foreground">Aucune commande avec l&apos;ID: {id}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  const currentIndex = statusFlow.indexOf(commande.statut);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commande {commande.id}</h1>
          <p className="text-sm text-muted-foreground">Créée le {formatDateTime(commande.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge statut={commande.statut} />
          <Button variant="outline" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Destinataire</span>
              <span className="font-medium">{commande.destinataire_nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Téléphone</span>
              <span className="font-medium">{commande.telephone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Adresse</span>
              <span className="font-medium">{commande.adresse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ville</span>
              <span className="font-medium">{commande.ville}</span>
            </div>
            {commande.commentaire && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commentaire</span>
                <span className="font-medium">{commande.commentaire}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé Financier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Montant Total</span>
              <span className="font-bold text-lg">{formatCurrency(commande.montant_total)}</span>
            </div>
            {commande.remise > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remise</span>
                <span className="text-red-600">-{formatCurrency(commande.remise)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">Net à Payer</span>
              <span className="font-bold text-lg">
                {formatCurrency(commande.montant_total - commande.remise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <span className="font-medium">{commande.source ?? '-'}</span>
            </div>
            {commande.code_suivi && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Code de Suivi</span>
                <span className="font-mono text-sm">{commande.code_suivi}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statusFlow.map((statut, index) => {
              const config = STATUT_CONFIG[statut];
              const isCurrent = commande.statut === statut;
              const isPassed = currentIndex >= 0 && index <= currentIndex;
              const isAlt = !statusFlow.includes(commande.statut) && commande.statut === statut;

              return (
                <div key={statut} className="flex items-center gap-2">
                  <div
                    className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                        : isPassed
                          ? `${config.bg} ${config.color} opacity-60`
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {config.label}
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`w-6 h-0.5 ${isPassed ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}

            {/* If current status is not in the flow (echoue, reporte, etc.) */}
            {!statusFlow.includes(commande.statut) && (
              <>
                <div className="w-6 h-0.5 bg-gray-200" />
                <div
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${STATUT_CONFIG[commande.statut].bg} ${STATUT_CONFIG[commande.statut].color} ring-2 ring-offset-1 ring-current`}
                >
                  {STATUT_CONFIG[commande.statut].label}
                </div>
              </>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Dernière mise à jour : {formatDateTime(commande.updated_at)}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la Commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ID Commande</span>
              <p className="font-mono font-medium">{commande.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date de Création</span>
              <p className="font-medium">{formatDate(commande.created_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Créée par</span>
              <p className="font-medium">{(commande as unknown as { user?: { nom: string } }).user?.nom ?? commande.user_id}</p>
            </div>
            {commande.agent_id && (
              <div>
                <span className="text-muted-foreground">Agent</span>
                <p className="font-medium">{(commande as unknown as { agent?: { nom: string } }).agent?.nom ?? commande.agent_id}</p>
              </div>
            )}
            {commande.livreur_id && (
              <div>
                <span className="text-muted-foreground">Livreur</span>
                <p className="font-medium">{(commande as unknown as { livreur?: { nom: string } }).livreur?.nom ?? commande.livreur_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
