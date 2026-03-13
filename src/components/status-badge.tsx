import { Badge } from '@/components/ui/badge';
import { STATUT_CONFIG } from '@/lib/constants';
import type { StatutCommande } from '@/lib/types';

export function StatusBadge({ statut }: { statut: StatutCommande }) {
  const config = STATUT_CONFIG[statut];
  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} border-0 font-medium`}>
      {config.label}
    </Badge>
  );
}
