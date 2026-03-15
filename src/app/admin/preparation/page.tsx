'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getCommandes, updateCommandeStatut } from '@/lib/supabase/queries';
import { formatCurrency, STATUT_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Package, Truck, CheckCircle } from 'lucide-react';
import type { StatutCommande } from '@/lib/types';

const COLUMNS: { statut: StatutCommande; label: string; icon: typeof Package; nextStatut?: StatutCommande; nextLabel?: string }[] = [
  { statut: 'confirme', label: 'Confirmées', icon: Package, nextStatut: 'en_preparation', nextLabel: 'Mettre en préparation' },
  { statut: 'en_preparation', label: 'En Préparation', icon: Truck, nextStatut: 'expedie', nextLabel: 'Marquer expédié' },
  { statut: 'expedie', label: 'Expédiées', icon: CheckCircle },
];

export default function PreparationPage() {
  const { data: commandesData, loading, refetch } = useSupabase(() => getCommandes(), []);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatutCommande>('confirme');

  if (loading) return <LoadingPage />;
  const allCommandes = commandesData ?? [];

  const handleMoveToNext = async (commandeId: string, nextStatut: StatutCommande) => {
    setActionLoading(commandeId);
    try {
      await updateCommandeStatut(commandeId, nextStatut);
      toast.success(`Commande passée à "${STATUT_CONFIG[nextStatut].label}".`);
      refetch();
    } catch (err) {
      toast.error('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Préparation & Expédition</h1>
        <p className="text-sm text-muted-foreground">Gérer le flux des commandes confirmées</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const count = allCommandes.filter((c) => c.statut === col.statut).length;
          const config = STATUT_CONFIG[col.statut];
          return (
            <Card
              key={col.statut}
              className={`cursor-pointer border-2 transition-colors ${activeTab === col.statut ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => setActiveTab(col.statut)}
            >
              <CardContent className="p-4 text-center">
                <col.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{count}</p>
                <Badge variant="outline" className={`${config.bg} ${config.color} border-0 mt-1`}>
                  {col.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active column */}
      {COLUMNS.map((col) => {
        if (col.statut !== activeTab) return null;
        const commandes = allCommandes.filter((c) => c.statut === col.statut);
        return (
          <Card key={col.statut}>
            <CardHeader>
              <CardTitle className="text-base">{col.label} ({commandes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {commandes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune commande.</p>
              ) : (
                <div className="space-y-2">
                  {commandes.map((cmd) => (
                    <div key={cmd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{cmd.destinataire_nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {cmd.ville} — {cmd.telephone}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{formatCurrency(cmd.montant_total)}</span>
                        {col.nextStatut && (
                          <Button
                            size="sm"
                            onClick={() => handleMoveToNext(cmd.id, col.nextStatut!)}
                            disabled={actionLoading === cmd.id}
                            className="gap-1"
                          >
                            {actionLoading === cmd.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            {col.nextLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
