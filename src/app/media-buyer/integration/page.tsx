'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Send, RefreshCw, Plug, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Commande } from '@/lib/types';

const APPS_SCRIPT_TEMPLATE = `function sendNewLeads() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var WEBHOOK_URL = 'VOTRE_URL_WEBHOOK'; // Collez votre URL webhook ici
  var SECRET = 'VOTRE_CLE_SECRETE'; // Collez votre clé secrète ici
  var STATUS_COL = 10; // Colonne J pour le statut d'envoi

  var lastRow = sheet.getLastRow();
  for (var row = 2; row <= lastRow; row++) {
    if (sheet.getRange(row, STATUS_COL).getValue() === '✓') continue;

    var data = sheet.getRange(row, 1, 1, 9).getValues()[0];
    var payload = {
      full_name: data[0],
      sku: String(data[1]),
      variant_price: Number(data[2]),
      total_quantity: Number(data[3]),
      region: data[4],
      city: data[5],
      phone: String(data[6]),
      commentaire: data[7] || '',
      order_date: data[8] ? new Date(data[8]).toISOString().split('T')[0] : ''
    };

    try {
      var response = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + SECRET },
        payload: JSON.stringify(payload)
      });
      var result = JSON.parse(response.getContentText());
      if (result.success) {
        sheet.getRange(row, STATUS_COL).setValue('✓');
      } else {
        sheet.getRange(row, STATUS_COL).setValue('✗ ' + (result.error || result.reason || 'Erreur'));
      }
    } catch(e) {
      sheet.getRange(row, STATUS_COL).setValue('✗ ' + e.message);
    }
  }
}`;

const COLUMN_MAPPING = [
  { sheet: 'Full name', crm: 'Nom destinataire', col: 'A' },
  { sheet: 'SKU', crm: 'Produit (lookup par SKU)', col: 'B' },
  { sheet: 'Variant price', crm: 'Prix unitaire', col: 'C' },
  { sheet: 'Total quantity', crm: 'Quantité', col: 'D' },
  { sheet: 'Region', crm: 'Adresse', col: 'E' },
  { sheet: 'City', crm: 'Ville', col: 'F' },
  { sheet: 'Phone', crm: 'Téléphone', col: 'G' },
  { sheet: 'Commentaire', crm: 'Commentaire', col: 'H' },
  { sheet: 'Order date', crm: 'Date de création', col: 'I' },
  { sheet: '(Statut envoi)', crm: '✓ ou ✗ (auto)', col: 'J' },
];

export default function IntegrationPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [recentImports, setRecentImports] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/leads?user_id=${user?.id ?? 'VOTRE_USER_ID'}`
    : '';

  useEffect(() => {
    if (user?.id) loadRecentImports();
  }, [user?.id]);

  async function loadRecentImports() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('commandes')
        .select('*')
        .eq('user_id', user!.id)
        .eq('source', 'Google Sheets')
        .order('created_at', { ascending: false })
        .limit(20);
      setRecentImports((data ?? []) as Commande[]);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copié dans le presse-papiers');
    setTimeout(() => setCopied(null), 2000);
  }

  async function sendTestLead() {
    if (!webhookUrl) return;
    setTestLoading(true);
    try {
      const res = await fetch(`/api/webhook/leads?user_id=${user?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer TEST_SECRET`,
        },
        body: JSON.stringify({
          full_name: 'Test Lead',
          sku: 'BVC-001',
          variant_price: 35,
          total_quantity: 1,
          region: 'Kinshasa',
          city: 'Kinshasa',
          phone: '+243800000000',
          commentaire: 'Lead test depuis la page intégration',
          order_date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Lead test créé : ${data.commande_id}`);
        loadRecentImports();
      } else {
        toast.error(data.error || 'Erreur lors du test');
      }
    } catch (err) {
      toast.error('Erreur réseau lors du test');
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Intégration Google Sheets</h1>
        <p className="text-muted-foreground mt-1">
          Connectez votre Google Sheet pour importer automatiquement les leads publicitaires dans le CRM.
        </p>
      </div>

      {/* Step 1: Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">1</div>
            URL Webhook
          </CardTitle>
          <CardDescription>
            Copiez cette URL et collez-la dans votre script Google Apps Script.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(webhookUrl, 'url')}
            >
              {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            La clé secrète (WEBHOOK_SECRET) doit être configurée dans les variables d&apos;environnement Vercel.
          </p>
        </CardContent>
      </Card>

      {/* Step 2: Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">2</div>
            Mapping des colonnes
          </CardTitle>
          <CardDescription>
            Votre Google Sheet doit suivre cette structure exacte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Colonne</th>
                  <th className="text-left py-2 px-3 font-medium">Google Sheet</th>
                  <th className="py-2 px-3"></th>
                  <th className="text-left py-2 px-3 font-medium">CRM</th>
                </tr>
              </thead>
              <tbody>
                {COLUMN_MAPPING.map((m) => (
                  <tr key={m.col} className="border-b last:border-0">
                    <td className="py-2 px-3 font-mono text-muted-foreground">{m.col}</td>
                    <td className="py-2 px-3">{m.sheet}</td>
                    <td className="py-2 px-3 text-center"><ArrowRight className="h-4 w-4 text-muted-foreground inline" /></td>
                    <td className="py-2 px-3">{m.crm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Google Apps Script */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">3</div>
            Script Google Apps Script
          </CardTitle>
          <CardDescription>
            Copiez ce script et collez-le dans Extensions &gt; Apps Script de votre Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[400px] overflow-y-auto">
              {APPS_SCRIPT_TEMPLATE}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(APPS_SCRIPT_TEMPLATE, 'script')}
            >
              {copied === 'script' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied === 'script' ? 'Copié' : 'Copier'}
            </Button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold text-orange-800">Instructions :</p>
            <ol className="list-decimal list-inside space-y-1 text-orange-700">
              <li>Ouvrez votre Google Sheet</li>
              <li>Allez dans <strong>Extensions &gt; Apps Script</strong></li>
              <li>Remplacez le contenu par le script ci-dessus</li>
              <li>Remplacez <code className="bg-orange-100 px-1 rounded">VOTRE_URL_WEBHOOK</code> par l&apos;URL de l&apos;étape 1</li>
              <li>Remplacez <code className="bg-orange-100 px-1 rounded">VOTRE_CLE_SECRETE</code> par votre clé secrète</li>
              <li>Cliquez sur <strong>Enregistrer</strong></li>
              <li>Pour un envoi automatique : <strong>Déclencheurs</strong> (icône horloge) &gt; <strong>Ajouter un déclencheur</strong></li>
              <li>Choisissez : <strong>sendNewLeads</strong>, <strong>Minuteur</strong>, <strong>Toutes les 1 à 5 minutes</strong></li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">4</div>
            Tester le webhook
          </CardTitle>
          <CardDescription>
            Envoyez un lead test pour vérifier que tout fonctionne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={sendTestLead} disabled={testLoading}>
            {testLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer un lead test
          </Button>
        </CardContent>
      </Card>

      {/* Step 5: Recent imports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Historique des imports
          </CardTitle>
          <CardDescription>
            Dernières commandes importées depuis Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : recentImports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun import pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">ID</th>
                    <th className="text-left py-2 px-3 font-medium">Destinataire</th>
                    <th className="text-left py-2 px-3 font-medium">Téléphone</th>
                    <th className="text-left py-2 px-3 font-medium">Ville</th>
                    <th className="text-left py-2 px-3 font-medium">Montant</th>
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentImports.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono text-xs">{c.id}</td>
                      <td className="py-2 px-3">{c.destinataire_nom}</td>
                      <td className="py-2 px-3">{c.telephone}</td>
                      <td className="py-2 px-3">{c.ville}</td>
                      <td className="py-2 px-3">{c.montant_total?.toLocaleString('fr-FR')} DH</td>
                      <td className="py-2 px-3">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {recentImports.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={loadRecentImports}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
