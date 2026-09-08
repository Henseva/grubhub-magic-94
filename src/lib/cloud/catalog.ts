import { supabase } from '@/integrations/supabase/client';
import { SECTIONS } from '../../data/products';
import type { Product, ProductTag, Section } from '../../types';

/**
 * Busca o catálogo no banco (Lovable Cloud) e devolve na mesma estrutura
 * usada pela interface. Em caso de falha, o app continua com os dados locais.
 */
export async function fetchCatalog(): Promise<Section[] | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'slug,name,description,price,original_price,image_url,icon,category,section_id,weight,tags,nutritional_tip,storage_tip,is_available,sort_order'
    )
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) return null;

  const bySection = new Map<string, Product[]>();

  for (const row of data) {
    const product: Product = {
      id: row.slug,
      name: row.name,
      weight: row.weight ?? '',
      desc: row.description ?? '',
      price: Number(row.price),
      originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
      icon: row.icon ?? '🛒',
      image: row.image_url ?? undefined,
      tags: (row.tags ?? []).filter((t): t is ProductTag => t === 'novo' || t === 'promo'),
      category: row.category ?? '',
      nutritionalTip: row.nutritional_tip ?? undefined,
      storageTip: row.storage_tip ?? undefined,
    };
    const key = row.section_id ?? 'outros';
    const list = bySection.get(key);
    if (list) list.push(product);
    else bySection.set(key, [product]);
  }

  // Mantém a ordem, os títulos e os banners originais das seções
  const sections = SECTIONS.map((sec) => ({
    ...sec,
    items: bySection.get(sec.id) ?? sec.items,
  }));

  for (const [id, items] of bySection) {
    if (!sections.some((s) => s.id === id)) {
      sections.push({ id, chip: id, title: id, items });
    }
  }

  return sections;
}
