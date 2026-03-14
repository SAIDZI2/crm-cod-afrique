import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect('/login');
  }

  const { data: crmUser } = await supabase
    .from('users')
    .select('role')
    .eq('email', authUser.email)
    .single();

  if (!crmUser) {
    redirect('/login');
  }

  const rolePathMap: Record<string, string> = {
    media_buyer: '/media-buyer/dashboard',
    call_center: '/call-centre/dashboard',
    livreur: '/livreur/dashboard',
    admin: '/admin',
    superviseur_cc: '/call-centre/dashboard',
    responsable_logistique: '/livreur/dashboard',
  };

  redirect(rolePathMap[crmUser.role] ?? '/login');
}
