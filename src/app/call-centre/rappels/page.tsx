'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getRappels, updateRappelStatut } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';
import { Phone, FileText, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { StatutRappel } from '@/lib/types';

const statutRappelConfig: Record<StatutRappel, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  effectue: { label: 'Effectue', color: 'bg-green-100 text-green-700' },
  manque: { label: 'Manque', color: 'bg-red-100 text-red-700' },
};

export default function RappelsPage() {
  const { data: rappelsData, loading, refetch } = useSupabase(() => getRappels(), []);
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatut = async (id: string, statut: 'effectue' | 'manque') => {
    setUpdatingId(id);
    try {
      await updateRappelStatut(id, statut);
      toast.success(`Rappel marque comme ${statut === 'effectue' ? 'effectue' : 'manque'}.`);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingPage />;
  const allRappels = rappelsData ?? [];

  const filteredRappels = (() => {
    let rappels = [...allRappels];
    if (statusFilter !== 'tous') {
      rappels = rappels.filter((r) => r.statut === statusFilter);
    }
    rappels.sort(
      (a, b) => new Date(a.date_rappel).getTime() - new Date(b.date_rappel).getTime()
    );
    return rappels;
  })();

  // Group rappels by hour
  const groupedByHour = (() => {
    const groups: Record<string, typeof filteredRappels> = {};
    filteredRappels.forEach((rappel) => {
      const date = new Date(rappel.date_rappel);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      if (!groups[hourKey]) groups[hourKey] = [];
      groups[hourKey].push(rappel);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  })();

  const overdueCount = allRappels.filter(
    (r) => r.statut === 'en_attente' && new Date(r.date_rappel) < new Date()
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rappels</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestion des rappels planifies - {filteredRappels.length} rappels
        </p>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              {overdueCount} rappel{overdueCount > 1 ? 's' : ''} en retard
            </p>
            <p className="text-sm text-red-600">
              Ces rappels auraient du etre effectues. Traitez-les en priorite.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="effectue">Effectue</SelectItem>
                  <SelectItem value="manque">Manque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar-like view grouped by hour */}
      <div className="space-y-4">
        {groupedByHour.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun rappel pour les filtres selectionnes.</p>
            </CardContent>
          </Card>
        )}

        {groupedByHour.map(([hour, rappels]) => {
          const now = new Date();
          const currentHour = now.getHours();
          const hourNum = parseInt(hour);
          const isPastHour = hourNum < currentHour;

          return (
            <Card key={hour} className={isPastHour ? 'border-red-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                      isPastHour
                        ? 'bg-red-100 text-red-700'
                        : hourNum === currentHour
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {hour.split(':')[0]}h
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {hour}
                      {isPastHour && (
                        <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-200">
                          En retard
                        </Badge>
                      )}
                      {hourNum === currentHour && (
                        <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                          Heure actuelle
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {rappels.length} rappel{rappels.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rappels.map((rappel) => {
                    const commande = rappel.commande;
                    const isOverdue =
                      rappel.statut === 'en_attente' && new Date(rappel.date_rappel) < now;

                    return (
                      <div
                        key={rappel.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-mono text-muted-foreground">
                            {new Date(rappel.date_rappel).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {commande?.destinataire_nom || 'Client inconnu'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commande?.telephone || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {commande && (
                            <span className="text-sm font-medium">
                              {formatCurrency(commande.montant_total)}
                            </span>
                          )}

                          <Badge
                            variant="outline"
                            className={`${statutRappelConfig[rappel.statut as StatutRappel]?.color || 'bg-gray-100 text-gray-700'} border-0`}
                          >
                            {statutRappelConfig[rappel.statut as StatutRappel]?.label || rappel.statut}
                          </Badge>

                          <div className="flex gap-1">
                            {rappel.statut === 'en_attente' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                                  onClick={() => handleUpdateStatut(rappel.id, 'effectue')}
                                  disabled={updatingId === rappel.id}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Effectue
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-red-700 border-red-300 hover:bg-red-50"
                                  onClick={() => handleUpdateStatut(rappel.id, 'manque')}
                                  disabled={updatingId === rappel.id}
                                >
                                  <XCircle className="w-3 h-3" />
                                  Manque
                                </Button>
                              </>
                            )}
                            {commande && (
                              <Link href={`/call-centre/commande/${commande.id}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <FileText className="w-3 h-3" />
                                  Fiche
                                </Button>
                              </Link>
                            )}
                            {rappel.statut === 'en_attente' && commande && (
                              <Link href={`/call-centre/commande/${commande.id}`}>
                                <Button size="sm" className="gap-1">
                                  <Phone className="w-3 h-3" />
                                  Appeler
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
