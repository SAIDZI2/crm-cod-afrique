import { createClient } from './client';

/**
 * Handles the complete delivery flow via SECURITY DEFINER RPC:
 * 1. Updates commande status to 'livre' (server-side, bypasses RLS)
 * 2. Creates commission for the media buyer automatically
 *
 * Uses handle_delivery_complete RPC which runs as DB owner,
 * ensuring both the status update and commission creation succeed
 * regardless of client-side RLS restrictions.
 */
export async function handleDeliveryComplete(commandeId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('handle_delivery_complete', {
    p_commande_id: commandeId,
  });

  if (error) {
    console.error('handle_delivery_complete RPC error:', error.message);
    throw new Error(`Delivery RPC failed: ${error.message}`);
  }

  if (!data?.success) {
    console.warn('handle_delivery_complete returned:', data?.error || data?.reason);
    // Not a hard error — commission may just not be needed
    return;
  }

  console.log('Delivery complete:', data);
}

/**
 * Handles commande status updates via SECURITY DEFINER RPC.
 * Used for returns and other status transitions that bypass RLS.
 *
 * Livreurs can only set 'livre' or 'retourne' on their own commandes.
 * Admins can set any status.
 */
export async function updateCommandeStatutSecure(commandeId: string, statut: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('update_commande_statut_secure', {
    p_commande_id: commandeId,
    p_statut: statut,
  });

  if (error) {
    console.error('update_commande_statut_secure RPC error:', error.message);
    throw new Error(`Status update RPC failed: ${error.message}`);
  }

  if (!data?.success) {
    const reason = data?.error || 'Unknown error';
    console.error('update_commande_statut_secure failed:', reason);
    throw new Error(`Status update failed: ${reason}`);
  }

  console.log('Commande status updated:', data);
}
