import type { StatutCommande } from './types';

export const STATUT_CONFIG: Record<StatutCommande, { label: string; color: string; bg: string }> = {
  nouveau: { label: 'Nouveau', color: 'text-blue-700', bg: 'bg-blue-100' },
  confirme: { label: 'Confirme', color: 'text-green-700', bg: 'bg-green-100' },
  en_preparation: { label: 'En Preparation', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  expedie: { label: 'Expedie', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  livre: { label: 'Livre', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  echoue: { label: 'Echoue', color: 'text-red-700', bg: 'bg-red-100' },
  reporte: { label: 'Reporte', color: 'text-purple-700', bg: 'bg-purple-100' },
  en_retour: { label: 'En Retour', color: 'text-orange-700', bg: 'bg-orange-100' },
  retourne: { label: 'Retourne', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export const VILLES_RDC = [
  'Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi',
  'Bukavu', 'Kananga', 'Likasi', 'Kolwezi', 'Tshikapa',
];

export const CATEGORIES_PRODUITS = ['Beaute', 'Electronique', 'Sante', 'Mode', 'Maison', 'Autre'];

export const MOTIFS_RETOUR = [
  { value: 'absent', label: 'Client absent' },
  { value: 'refus', label: 'Refus a la livraison' },
  { value: 'adresse_introuvable', label: 'Adresse introuvable' },
  { value: 'injoignable', label: 'Client injoignable' },
  { value: 'ne_peut_pas_payer', label: 'Ne peut pas payer' },
  { value: 'colis_endommage', label: 'Colis endommage' },
  { value: 'mauvais_produit', label: 'Mauvais produit' },
  { value: 'autre', label: 'Autre' },
];

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
