import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface LeadPayload {
  full_name: string;
  sku: string;
  variant_price: number;
  total_quantity: number;
  region: string;
  city: string;
  phone: string;
  commentaire?: string;
  order_date?: string;
}

function generateCommandeId(ville: string): string {
  const prefix = ville.substring(0, 3).toUpperCase();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 10; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${suffix}`;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function POST(request: NextRequest) {
  // 1. Validate auth token
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || !authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Get user_id from query params
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'user_id manquant' }, { status: 400 });
  }

  // 3. Parse payload
  let payload: LeadPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 });
  }

  // 4. Validate required fields
  if (!payload.full_name || !payload.phone || !payload.city) {
    return NextResponse.json(
      { success: false, error: 'Champs requis manquants: full_name, phone, city' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 5. Verify user exists and is media_buyer
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
  }
  if (user.role !== 'media_buyer') {
    return NextResponse.json({ success: false, error: 'Utilisateur non media_buyer' }, { status: 403 });
  }

  // 6. Check blacklist
  const phone = sanitizePhone(payload.phone);
  const { data: blacklisted } = await supabase
    .from('blacklist')
    .select('id')
    .eq('telephone', phone)
    .limit(1);

  if (blacklisted && blacklisted.length > 0) {
    return NextResponse.json(
      { success: false, reason: 'blacklisted', error: 'Numéro en liste noire' },
      { status: 200 }
    );
  }

  // 7. Lookup product by SKU
  let produitId: string | null = null;
  let produitPrix: number | null = null;
  let commentaire = payload.commentaire ?? '';

  if (payload.sku) {
    const { data: produit } = await supabase
      .from('produits')
      .select('id, prix')
      .eq('sku', payload.sku)
      .eq('actif', true)
      .single();

    if (produit) {
      produitId = produit.id;
      produitPrix = produit.prix;
    } else {
      commentaire = `[SKU introuvable: ${payload.sku}] ${commentaire}`.trim();
    }
  }

  // 8. Calculate totals
  const quantite = payload.total_quantity || 1;
  const prixUnitaire = payload.variant_price || produitPrix || 0;
  const montantTotal = prixUnitaire * quantite;

  // 9. Generate commande ID and insert
  const commandeId = generateCommandeId(payload.city);

  const { data: commande, error: commandeError } = await supabase
    .from('commandes')
    .insert({
      id: commandeId,
      user_id: userId,
      destinataire_nom: payload.full_name,
      telephone: phone,
      adresse: payload.region || payload.city,
      ville: payload.city,
      statut: 'nouveau',
      montant_total: montantTotal,
      commentaire: commentaire || null,
      source: 'Google Sheets',
      created_at: payload.order_date ? new Date(payload.order_date).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (commandeError) {
    return NextResponse.json(
      { success: false, error: `Erreur création commande: ${commandeError.message}` },
      { status: 500 }
    );
  }

  // 10. Insert commande_produits if product found
  if (produitId) {
    await supabase.from('commande_produits').insert({
      commande_id: commandeId,
      produit_id: produitId,
      quantite,
      prix_unitaire: prixUnitaire,
      type: 'principal',
    });
  }

  return NextResponse.json({
    success: true,
    commande_id: commande.id,
    montant_total: montantTotal,
  });
}
