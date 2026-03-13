'use client';

import { useState, useMemo } from 'react';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { mockTournees, mockTourneeCommandes } from '@/lib/mock-data';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/constants';
import { Calendar, ChevronDown, ChevronUp, Package, TrendingUp } from 'lucide-react';

const STATUT_TOURNEE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  en_preparation: { label: 'En Preparation', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  en_cours: { label: 'En Cours', bg: 'bg-blue-100', text: 'text-blue-800' },
  cloturee: { label: 'Cloturee', bg: 'bg-green-100', text: 'text-green-800' },
};

export default function LivreurHistoriquePage() {
  const [expandedTournee, setExpandedTournee] = useState<string | null>(null);

  const tournees = mockTournees;

  const globalStats = useMemo(() => {
    const totalColis = mockTourneeCommandes.length;
    const totalLivres = mockTourneeCommandes.filter(tc => tc.statut_livraison === 'livre').length;
    const totalRetournes = mockTourneeCommandes.filter(tc => tc.statut_livraison === 'retourne').length;
    const totalCash = mockTourneeCommandes
      .filter(tc => tc.montant_collecte != null)
      .reduce((sum, tc) => sum + (tc.montant_collecte ?? 0), 0);
    const tauxLivraison = totalColis > 0 ? Math.round((totalLivres / totalColis) * 100) : 0;

    return { totalColis, totalLivres, totalRetournes, totalCash, tauxLivraison, totalTournees: tournees.length };
  }, [tournees]);

  const getTourneeStats = (tourneeId: string) => {
    const commandes = mockTourneeCommandes.filter(tc => tc.tournee_id === tourneeId);
    const total = commandes.length;
    const livres = commandes.filter(tc => tc.statut_livraison === 'livre').length;
    const retournes = commandes.filter(tc => tc.statut_livraison === 'retourne').length;
    const cash = commandes
      .filter(tc => tc.montant_collecte != null)
      .reduce((sum, tc) => sum + (tc.montant_collecte ?? 0), 0);
    return { total, livres, retournes, cash };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Historique des Tournees</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resume de vos tournees precedentes
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Tournees"
          value={globalStats.totalTournees}
          color="border-l-blue-500"
        />
        <KpiCard
          label="Total Colis"
          value={globalStats.totalColis}
          color="border-l-indigo-500"
        />
        <KpiCard
          label="Total Livres"
          value={globalStats.totalLivres}
          color="border-l-green-500"
        />
        <KpiCard
          label="Taux Livraison"
          value={`${globalStats.tauxLivraison}%`}
          color={globalStats.tauxLivraison >= 70 ? 'border-l-green-500' : 'border-l-red-500'}
        />
        <KpiCard
          label="Cash Total"
          value={formatCurrency(globalStats.totalCash)}
          color="border-l-emerald-500"
        />
      </div>

      {/* Tournee Cards */}
      <div className="space-y-3">
        {tournees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucune tournee enregistree.
            </CardContent>
          </Card>
        ) : (
          tournees.map(tournee => {
            const stats = getTourneeStats(tournee.id);
            const statutConfig = STATUT_TOURNEE_CONFIG[tournee.statut] ?? STATUT_TOURNEE_CONFIG.en_preparation;
            const isExpanded = expandedTournee === tournee.id;
            const tauxLivraison = stats.total > 0 ? Math.round((stats.livres / stats.total) * 100) : 0;

            return (
              <Card key={tournee.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Tournee Header */}
                  <button
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedTournee(isExpanded ? null : tournee.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold">{formatDate(tournee.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statutConfig.bg} ${statutConfig.text} border-0`}>
                          {statutConfig.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">{stats.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Livres</p>
                        <p className="font-bold text-green-600">{stats.livres}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Retournes</p>
                        <p className="font-bold text-red-600">{stats.retournes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cash</p>
                        <p className="font-bold text-emerald-600">{formatCurrency(stats.cash)}</p>
                      </div>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${tauxLivraison}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Taux de livraison: {tauxLivraison}%
                      </p>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      <div className="pt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Details de la tournee</h4>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">ID Tournee:</span>
                            <span className="ml-2 font-mono">{tournee.id}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Creation:</span>
                            <span className="ml-2">{formatDateTime(tournee.date_creation)}</span>
                          </div>
                          {tournee.date_cloture && (
                            <div>
                              <span className="text-muted-foreground">Cloture:</span>
                              <span className="ml-2">{formatDateTime(tournee.date_cloture)}</span>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <h4 className="text-sm font-semibold text-muted-foreground">Colis de la tournee</h4>

                        <div className="space-y-2">
                          {mockTourneeCommandes
                            .filter(tc => tc.tournee_id === tournee.id)
                            .map(tc => {
                              const cmd = tc.commande;
                              if (!cmd) return null;

                              const statutColors: Record<string, string> = {
                                livre: 'text-green-700 bg-green-50',
                                retourne: 'text-red-700 bg-red-50',
                                en_cours: 'text-blue-700 bg-blue-50',
                                en_attente: 'text-gray-700 bg-gray-50',
                                reporte: 'text-purple-700 bg-purple-50',
                              };

                              return (
                                <div
                                  key={tc.id}
                                  className={`flex items-center justify-between p-3 rounded-lg ${statutColors[tc.statut_livraison] ?? 'bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Package className="w-4 h-4 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium">{cmd.destinataire_nom}</p>
                                      <p className="text-xs opacity-75">{cmd.ville} — #{tc.ordre}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold">
                                      {tc.montant_collecte != null
                                        ? formatCurrency(tc.montant_collecte)
                                        : '-'}
                                    </p>
                                    <p className="text-xs capitalize">{tc.statut_livraison.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
