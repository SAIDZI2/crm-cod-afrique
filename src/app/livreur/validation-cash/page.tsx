'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/hooks/use-auth';
import { getRemisesCash, getUsersByRole, updateRemiseCash } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/constants';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { RemiseCash, User } from '@/lib/types';

export default function ValidationCashPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [validating, setValidating] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'tous' | 'en_attente' | 'valide'>('tous');

  const { data: remises, loading: l1, error } = useSupabase(() => getRemisesCash(), [refresh]);
  const { data: livreurs, loading: l2 } = useSupabase(() => getUsersByRole('livreur'), []);

  if (l1 || l2) return <LoadingPage />;
  if (error) return <ErrorDisplay error={error} />;

  const livreursMap = Object.fromEntries((livreurs ?? []).map((l: User) => [l.id, l]));
  const allRemises = remises ?? [];

  const remisesFiltrees = allRemises.filter((r) => {
    if (filtre === 'en_attente') return !r.valide_par;
    if (filtre === 'valide') return !!r.valide_par;
    return true;
  });

  // KPIs
  const totalTheorique = allRemises.reduce((s, r) => s + r.montant_theorique, 0);
  const totalRemis = allRemises.reduce((s, r) => s + r.montant_remis, 0);
  const totalEcart = allRemises.reduce((s, r) => s + r.ecart, 0);
  const nbEnAttente = allRemises.filter((r) => !r.valide_par).length;

  async function handleValider(remise: RemiseCash) {
    if (!user) return;
    setValidating(remise.id);
    try {
      await updateRemiseCash(remise.id, { valide_par: user.id });
      toast.success(`Remise de ${formatCurrency(remise.montant_remis)} validée`);
      setRefresh((r) => r + 1);
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validation Cash</h1>
        <p className="text-sm text-gray-500 mt-1">Validez les remises cash des livreurs</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{allRemises.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total remises</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{nbEnAttente}</p>
            <p className="text-xs text-muted-foreground mt-1">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRemis)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total remis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={`p-4 text-center ${totalEcart < 0 ? 'bg-red-50' : ''}`}>
            <p className={`text-2xl font-bold ${totalEcart < 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatCurrency(Math.abs(totalEcart))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEcart < 0 ? 'Manquant total' : 'Écart total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte */}
      {nbEnAttente > 0 && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
          <Clock className="w-4 h-4 flex-shrink-0" />
          {nbEnAttente} remise(s) en attente de validation
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        {([['tous', 'Toutes'], ['en_attente', 'En attente'], ['valide', 'Validées']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltre(val)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtre === val
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Remises cash ({remisesFiltrees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {remisesFiltrees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune remise trouvée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Théorique</TableHead>
                  <TableHead className="text-right">Remis</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remisesFiltrees.map((remise) => {
                  const livreur = livreursMap[remise.livreur_id];
                  const ecart = remise.ecart;
                  return (
                    <TableRow key={remise.id}>
                      <TableCell className="font-medium">
                        {livreur?.nom ?? 'Inconnu'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(remise.date_remise).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(remise.montant_theorique)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(remise.montant_remis)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {ecart < 0 ? '-' : ecart > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(ecart))}
                        </span>
                        {ecart < 0 && (
                          <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                        {remise.note ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {remise.valide_par ? (
                          <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Validé
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-orange-600 text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            En attente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!remise.valide_par && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 border-green-300 text-green-700 hover:bg-green-50"
                            disabled={validating === remise.id}
                            onClick={() => handleValider(remise)}
                          >
                            {validating === remise.id ? '...' : 'Valider'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
