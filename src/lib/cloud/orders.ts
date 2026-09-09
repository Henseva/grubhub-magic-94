import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Order, OrderStatus } from '../../types';

type DbStatus = Database['public']['Enums']['order_status'];

const STATUS_TO_DB: Record<OrderStatus, DbStatus> = {
  Confirmado: 'criado',
  'Em separação': 'preparando',
  'A caminho': 'saiu_para_entrega',
  Entregue: 'entregue',
  Cancelado: 'cancelado',
};

export const STATUS_FROM_DB: Record<string, OrderStatus> = {
  criado: 'Confirmado',
  preparando: 'Em separação',
  saiu_para_entrega: 'A caminho',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/**
 * Salva o pedido no banco quando existe uma sessão ativa.
 * Sem sessão, o pedido continua funcionando localmente.
 */
export async function saveOrderToCloud(order: Order): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      
      status: STATUS_TO_DB[order.status] ?? 'criado',
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_address: order.deliveryAddress,
      delivery_date: order.deliveryDate,
      delivery_period: order.deliveryPeriod,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      discount: order.discount ?? 0,
      total: order.total,
      coupon_code: order.couponCode ?? null,
      payment_method: order.paymentMethod,
      change_for: order.changeFor ?? null,
      delivery_code: order.deliveryCode ?? null,
      notes: order.notes ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return null;

  await supabase.from('order_items').insert(
    order.items.map((item) => ({
      order_id: data.id,
      product_slug: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      icon: item.icon ?? null,
      image_url: item.image ?? null,
      notes: item.notes ?? null,
    }))
  );

  return data.id;
}
