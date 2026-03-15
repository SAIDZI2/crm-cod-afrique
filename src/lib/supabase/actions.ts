import { createClient } from './client';
import {
  updateCommandeStatut,
  getCommandeById,
  getUserById,
  createCommission,
} from './queries';

/**
 * Handles the complete delivery flow:
 * 1. Updates commande status to 'livre'
 * 2. Creates commission for the media buyer via RPC (SECURITY DEFINER)
 * 3. Falls back to direct insert if RPC is not available
 */
export async function handleDeliveryComplete(commandeId: string) {
  // 1. Mark as delivered
  await updateCommandeStatut(commandeId, 'livre');

  // 2. Try RPC function first (SECURITY DEFINER — bypasses RLS)
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('create_delivery_commission', {
      p_commande_id: commandeId,
    });

    if (!error && data?.success) {
      console.log('Commission created via RPC:', data);
      return;
    }

    // RPC failed or returned unsuccessful — log and try fallback
    if (error) {
      console.warn('RPC create_delivery_commission not available, trying fallback:', error.message);
    } else if (data && !data.success) {
      console.warn('RPC returned:', data.error);
      return; // Not a technical error, just no commission needed
    }
  } catch (rpcErr) {
    console.warn('RPC call failed, trying fallback:', rpcErr);
  }

  // 3. Fallback: direct insert (works if RLS allows it or if user is admin)
  try {
    const commande = await getCommandeById(commandeId);
    if (!commande || !commande.user_id) return;

    const mediaBuyer = await getUserById(commande.user_id);
    if (!mediaBuyer || !mediaBuyer.commission_pct) return;

    const montantCommission = commande.montant_total * mediaBuyer.commission_pct / 100;
    if (montantCommission <= 0) return;

    await createCommission({
      user_id: mediaBuyer.id,
      commande_id: commandeId,
      montant: montantCommission,
      statut: 'en_attente',
    });
    console.log('Commission created via fallback:', montantCommission);
  } catch (err) {
    console.error('Failed to create commission (both RPC and fallback):', err);
    // Don't throw — delivery was already marked, commission is secondary
  }
}
