'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const DEMO_ACCOUNTS = [
  { email: 'said@crm.com', role: 'media_buyer', label: 'Media Buyer', path: '/media-buyer/dashboard', color: 'bg-orange-500' },
  { email: 'karim@crm.com', role: 'call_center', label: 'Call Centre', path: '/call-centre/dashboard', color: 'bg-blue-500' },
  { email: 'moise@crm.com', role: 'livreur', label: 'Livreur', path: '/livreur/dashboard', color: 'bg-green-500' },
  { email: 'admin@crm.com', role: 'admin', label: 'Admin', path: '/admin', color: 'bg-purple-500' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const account = DEMO_ACCOUNTS.find(a => a.email === email);
    if (account) {
      router.push(account.path);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">CRM COD</h1>
          <p className="text-muted-foreground mt-2">Afrique — RDC & Zones Francophones</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Acces rapide (Demo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map(account => (
              <Button
                key={account.email}
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => router.push(account.path)}
              >
                <span className={`w-3 h-3 rounded-full ${account.color}`} />
                {account.label}
                <span className="text-xs text-muted-foreground ml-auto">{account.email}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
