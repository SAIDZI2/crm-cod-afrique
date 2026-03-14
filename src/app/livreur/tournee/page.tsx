'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { useSupabase, LoadingPage } from '@/hooks/use-supabase';
import { getAllTourneeCommandes } from '@/lib/supabase/queries';
import { formatCurrency, MOTIFS_RETOUR } from '@/lib/constants';
import type { StatutLivraison, MotifRetour } from '@/lib/types';
import { Phone, Package, CheckCircle, RotateCcw, MapPin } from 'lucide-react';

const LIVREUR_ID = 'a1000000-0000-0000-0000-000000000006';

type FilterTab = 'tous' | 'en_cours' | 'livre' | 'retourne';

export default function LivreurTourneePage() {
  const { data: tcData, loading } = useSupabase(() => getAllTourneeCommandes(), []);
  const [filter, setFilter] = useState<FilterTab>('tous');
  const [expandedLivre, setExpandedLivre] = useState<string | null>(null);
  const [expandedRetour, setExpandedRetour] = useState<string | null>(null);
  const [montantCollecte, setMontantCollecte] = useState<string>('');
  const [motifRetour, setMotifRetour] = useState<MotifRetour | ''>('');
  const [noteRetour, setNoteRetour] = useState('');

  if (loading) return <LoadingPage />;
  const commandes = tcData ?? [];

  const filtered = filter === 'tous' ? commandes : commandes.filter(c => c.statut_livraison === filter);

  const stats = {
    total: commandes.length,
    livre: commandes.filter(c => c.statut_livraison === 'livre').length,
    cashTotal: commandes
      .filter(c => c.montant_collecte != null)
      .reduce((sum, c) => sum + (c.montant_collecte ?? 0), 0),
  };

  const handleConfirmLivre = (id: string) => {
    setExpandedLivre(null);
    setMontantCollecte('');
  };

  const handleConfirmRetour = (id: string) => {
    setExpandedRetour(null);
    setMotifRetour('');
    setNoteRetour('');
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'tous', label: 'Tous', count: commandes.length },
    { key: 'en_cours', label: 'En cours', count: commandes.filter(c => c.statut_livraison === 'en_cours').length },
    { key: 'livre', label: 'Livres', count: commandes.filter(c => c.statut_livraison === 'livre').length },
    { key: 'retourne', label: 'Retournes', count: commandes.filter(c => c.statut_livraison === 'retourne').length },
  ];

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ma Tournee</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.livre} livres / {stats.total} total — Cash: {formatCurrency(stats.cashTotal)}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            className="min-h-10 px-4 whitespace-nowrap"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun colis dans cette categorie.
            </CardContent>
          </Card>
        )}

        {filtered.map(tc => {
          const cmd = tc.commande;
          if (!cmd) return null;

          const isLivreExpanded = expandedLivre === tc.id;
          const isRetourExpanded = expandedRetour === tc.id;

          return (
            <Card key={tc.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/livreur/colis/${cmd.id}`}
                    className="text-sm font-mono text-blue-600 hover:underline"
                  >
                    #{cmd.id}
                  </Link>
                  <StatusBadge statut={mapStatutToCommande(tc.statut_livraison)} />
                </div>

                <p className="text-lg font-bold">{cmd.destinataire_nom}</p>

                <a
                  href={`tel:${cmd.telephone}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  {cmd.telephone}
                </a>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{cmd.adresse}, {cmd.ville}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>Colis #{tc.ordre}</span>
                </div>

                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(cmd.montant_total)}
                </p>

                {tc.statut_livraison === 'en_cours' && !isLivreExpanded && !isRetourExpanded && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 min-h-12 bg-green-600 hover:bg-green-700 text-white text-base"
                      onClick={() => {
                        setExpandedLivre(tc.id);
                        setExpandedRetour(null);
                        setMontantCollecte(String(cmd.montant_total));
                      }}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Livre
                    </Button>
                    <Button
                      className="flex-1 min-h-12 bg-red-600 hover:bg-red-700 text-white text-base"
                      onClick={() => {
                        setExpandedRetour(tc.id);
                        setExpandedLivre(null);
                      }}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Retour
                    </Button>
                    <a href={`tel:${cmd.telephone}`}>
                      <Button className="min-h-12 min-w-12" variant="outline">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </Button>
                    </a>
                  </div>
                )}

                {isLivreExpanded && (
                  <div className="border-t pt-4 space-y-3 bg-green-50 -mx-4 px-4 pb-4">
                    <h3 className="font-semibold text-green-800">Confirmer la livraison</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Client:</span> {cmd.destinataire_nom}</p>
                      <p><span className="text-muted-foreground">Colis:</span> #{tc.ordre}</p>
                      <p><span className="text-muted-foreground">Montant attendu:</span> {formatCurrency(cmd.montant_total)}</p>
                    </div>
                    <div>
                      <Label htmlFor={`montant-${tc.id}`} className="text-sm font-medium">
                        Montant reellement collecte
                      </Label>
                      <Input
                        id={`montant-${tc.id}`}
                        type="number"
                        step="0.01"
                        value={montantCollecte}
                        onChange={e => setMontantCollecte(e.target.value)}
                        className="mt-1 min-h-12 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 min-h-12 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleConfirmLivre(tc.id)}
                      >
                        Confirmer livraison
                      </Button>
                      <Button variant="outline" className="min-h-12" onClick={() => setExpandedLivre(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {isRetourExpanded && (
                  <div className="border-t pt-4 space-y-3 bg-red-50 -mx-4 px-4 pb-4">
                    <h3 className="font-semibold text-red-800">Declarer un retour</h3>
                    <div>
                      <Label className="text-sm font-medium">Motif du retour</Label>
                      <Select
                        value={motifRetour}
                        onValueChange={(val) => val && setMotifRetour(val as MotifRetour)}
                      >
                        <SelectTrigger className="mt-1 min-h-12 w-full">
                          <SelectValue placeholder="Selectionner un motif" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTIFS_RETOUR.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Note (optionnel)</Label>
                      <Textarea
                        value={noteRetour}
                        onChange={e => setNoteRetour(e.target.value)}
                        className="mt-1 min-h-20"
                        placeholder="Details supplementaires..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 min-h-12 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleConfirmRetour(tc.id)}
                        disabled={!motifRetour}
                      >
                        Confirmer retour
                      </Button>
                      <Button variant="outline" className="min-h-12" onClick={() => setExpandedRetour(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
