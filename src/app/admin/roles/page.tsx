import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const roles = [
  {
    key: 'admin',
    label: 'Admin',
    color: 'default' as const,
    permissions: [
      'Gérer tous les utilisateurs',
      'Valider/Payer les commissions',
      'Accès complet aux dashboards',
    ],
  },
  {
    key: 'call_center',
    label: 'Call Center',
    color: 'secondary' as const,
    permissions: [
      'Voir et traiter la file d’appels',
      'Créer/mettre à jour commandes assignées',
      'Consulter ses statistiques',
    ],
  },
  {
    key: 'media_buyer',
    label: 'Media Buyer',
    color: 'secondary' as const,
    permissions: [
      'Créer des commandes',
      'Suivre ses commissions',
      'Gérer ses dépenses pub',
    ],
  },
  {
    key: 'livreur',
    label: 'Livreur',
    color: 'secondary' as const,
    permissions: [
      'Voir tournées assignées',
      'Remonter statuts de livraison',
      'Saisir remises cash',
    ],
  },
];

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rôles & Permissions</h1>
        <p className="text-sm text-muted-foreground">Référence des rôles actuellement supportés (démo)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.key}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{role.label}</CardTitle>
              <Badge variant={role.color}>{role.key}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {role.permissions.map((p) => (
                <div key={p} className="text-sm text-muted-foreground">• {p}</div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
