import { createClient } from './client';

const BUCKET = 'product-images';

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${productId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getProductImageUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
