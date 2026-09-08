import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_FROM_DB } from '../lib/cloud/orders';
import type { OrderStatus } from '../types';

export interface CourierPosition {
  latitude: number;
  longitude: number;
  progress?: number;
}

/**
 * Acompanha em tempo real a posição do entregador e o status do pedido
 * (WebSockets do Lovable Cloud). Sem pedido no banco, fica inativo.
 */
export function useCourierTracking(orderId: string | null) {
  const [position, setPosition] = useState<CourierPosition | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!orderId) {
      setPosition(null);
      setStatus(null);
      return;
    }

    let active = true;

    supabase
      .from('courier_locations')
      .select('latitude,longitude,progress')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          setPosition({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            progress: data.progress ?? undefined,
          });
        }
      });

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'courier_locations', filter: `order_id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as { latitude: number; longitude: number; progress: number | null };
          setPosition({
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            progress: row.progress ?? undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as { status: string };
          const mapped = STATUS_FROM_DB[row.status];
          if (mapped) setStatus(mapped);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { position, status };
}
