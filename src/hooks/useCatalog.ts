import { useEffect, useMemo, useState } from 'react';
import { fetchCatalog } from '../lib/cloud/catalog';
import { SECTIONS } from '../data/products';
import type { Product, Section } from '../types';

export function useCatalog(): { sections: Section[]; allProducts: Product[]; loading: boolean } {
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((remote) => {
        if (active && remote) setSections(remote);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const allProducts = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  return { sections, allProducts, loading };
}
