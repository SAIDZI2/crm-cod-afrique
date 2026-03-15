import {
  updateCommandeStatut,
  getCommandeById,
  getUserById,
  createCommission,
} from './queries';

/**
 * Handles the complete delivery flow:
 * 1. Updates commande status to 'livre'
 * 2. Fetches commande + user details
 * 3. Calculates and creates commission
 */
export async function handleDeliveryComplete(commandeId: string) {
  // 1. Mark as delivered
  await updateCommandeStatut(commandeId, 'livre');

  // 2. Get commande details
  const commande = await getCommandeById(commandeId);
  if (!commande || !commande.user_id) return;

  // 3. Get media buyer's commission rate
  try {
    const mediaBuyer = await getUserById(commande.user_id);
    if (!mediaBuyer || !mediaBuyer.commission_pct) return;

    // 4. Calculate commission
    const montantCommission = commande.montant_total * mediaBuyer.commission_pct / 100;
    if (montantCommission <= 0) return;

    // 5. Create commission record
    await createCommission({
      user_id: mediaBuyer.id,
      commande_id: commandeId,
      montant: montantCommission,
      statut: 'en_attente',
    });
  } catch (err) {
    console.error('Failed to create commission:', err);
    // Don't throw — delivery was already marked, commission is secondary
  }
}
