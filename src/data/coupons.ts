import { AppliedCoupon } from '../types';

export const AVAILABLE_COUPONS: Record<string, Omit<AppliedCoupon, 'code'>> = {
  BEMVINDO10: {
    type: 'percent',
    value: 10,
    description: '10% OFF em toda a encomenda'
  },
  FRESCO15: {
    type: 'fixed',
    value: 15,
    description: 'R$ 15 OFF em compras acima de R$ 60',
    minOrder: 60
  },
  FRETEGRATIS: {
    type: 'free_shipping',
    value: 0,
    description: 'Frete Grátis na sua encomenda'
  }
};

export function validateCoupon(
  rawCode: string,
  subtotal: number
): { valid: boolean; coupon?: AppliedCoupon; error?: string } {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Digite um código de cupom.' };
  }

  const found = AVAILABLE_COUPONS[code];
  if (!found) {
    return { valid: false, error: 'Cupom inválido ou expirado.' };
  }

  if (found.minOrder && subtotal < found.minOrder) {
    return {
      valid: false,
      error: `Este cupom é válido apenas para pedidos a partir de R$ ${found.minOrder.toFixed(2).replace('.', ',')}.`
    };
  }

  return {
    valid: true,
    coupon: {
      code,
      ...found
    }
  };
}

export function calculateDiscount(coupon: AppliedCoupon | null, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    return Math.round(((subtotal * coupon.value) / 100) * 100) / 100;
  }
  if (coupon.type === 'fixed') {
    return Math.min(subtotal, coupon.value);
  }
  return 0;
}
