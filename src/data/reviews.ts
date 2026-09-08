import { Review } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Camila Rodrigues',
    rating: 5,
    comment: 'Tudo extremamente fresco e bem embalado. A salada de frutas especial é um espetáculo de sabor e praticidade!',
    date: 'Há 2 dias',
    recommendedProduct: 'Salada de Frutas Especial',
    verified: true
  },
  {
    id: 'rev-2',
    name: 'Rodrigo Medeiros',
    rating: 5,
    comment: 'Os legumes e verduras picados salvam a minha rotina saudável. Chegam limpos, frescos e duram muito tempo na geladeira.',
    date: 'Há 4 dias',
    recommendedProduct: 'Brócolis Higienizado',
    verified: true
  },
  {
    id: 'rev-3',
    name: 'Beatriz Fonseca',
    rating: 5,
    comment: 'Entrega super pontual no período da manhã e frutas no ponto certo de maturação que pedi. Compro toda semana sem falta!',
    date: 'Há 1 semana',
    recommendedProduct: 'Kit Fruta Semanal',
    verified: true
  },
  {
    id: 'rev-4',
    name: 'Lucas P. Mendes',
    rating: 5,
    comment: 'O atendimento por WhatsApp e a facilidade de encomendar no app são nota dez. A melancia e manga vieram super doces!',
    date: 'Há 2 semanas',
    recommendedProduct: 'Manga Picada',
    verified: true
  }
];

export function getStoredReviews(): Review[] {
  try {
    const saved = localStorage.getItem('mf_customer_reviews');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_REVIEWS;
}

export function addCustomerReview(newRev: {
  name: string;
  rating: number;
  comment: string;
  recommendedProduct?: string;
}): Review[] {
  const current = getStoredReviews();
  const created: Review = {
    id: `rev-${Date.now()}`,
    name: newRev.name.trim(),
    rating: newRev.rating,
    comment: newRev.comment.trim(),
    date: 'Hoje',
    recommendedProduct: newRev.recommendedProduct?.trim() || undefined,
    verified: true
  };
  const updated = [created, ...current];
  try {
    localStorage.setItem('mf_customer_reviews', JSON.stringify(updated));
  } catch {}
  return updated;
}
