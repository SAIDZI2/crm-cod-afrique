'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { getRoleBasePath } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';

const DEMO_ACCOUNTS = [
  { email: 'said@crm.com', role: 'media_buyer', label: 'Media Buyer', path: '/media-buyer/dashboard', color: 'bg-orange-500' },
  { email: 'karim@crm.com', role: 'call_center', label: 'Call Centre', path: '/call-centre/dashboard', color: 'bg-blue-500' },
  { email: 'moise@crm.com', role: 'livreur', label: 'Livreur', path: '/livreur/dashboard', color: 'bg-green-500' },
  { email: 'admin@crm.com', role: 'admin', label: 'Admin', path: '/admin', color: 'bg-purple-500' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email ou mot de passe incorrect.');
        setIsLoading(false);
        return;
      }

      const { data: crmUser } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();

      if (!crmUser) {
        setError('Aucun compte CRM associe a cet email.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Full page reload to ensure SSR middleware receives auth cookies
      window.location.href = getRoleBasePath(crmUser.role as UserRole);
    } catch {
      setError('Une erreur est survenue.');
      setIsLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string, path: string) {
    setError('');
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: 'demo123',
    });

    if (authError) {
      setError('Erreur de connexion demo. Verifiez que les comptes sont crees dans Supabase Auth.');
      setIsLoading(false);
      return;
    }

    // Full page reload to ensure SSR middleware receives auth cookies
    window.location.href = path;
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
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
                onClick={() => handleDemoLogin(account.email, account.path)}
                disabled={isLoading}
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
