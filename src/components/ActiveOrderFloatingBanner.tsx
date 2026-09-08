import React from 'react';
import { Bike, Store, Sparkles, ChevronRight } from 'lucide-react';
import { Order } from '../types';

interface ActiveOrderFloatingBannerProps {
  order: Order | null;
  onOpenTracking: (order: Order) => void;
  isVisible: boolean;
}

export const ActiveOrderFloatingBanner: React.FC<ActiveOrderFloatingBannerProps> = ({
  order,
  onOpenTracking,
  isVisible,
}) => {
  if (!order || !isVisible || order.status === 'Entregue' || order.status === 'Cancelado') {
    return null;
  }

  const getStatusText = () => {
    switch (order.status) {
      case 'Confirmado':
        return 'Pedido confirmado pela feira';
      case 'Em separação':
        return 'Feira sendo selecionada e pesada';
      case 'A caminho':
        return 'Motoboy Carlos Eduardo a caminho!';
      default:
        return 'Acompanhando seu pedido';
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'Confirmado':
        return { label: 'Confirmado', bg: '#fef3c7', text: '#b45309', icon: <Store size={14} /> };
      case 'Em separação':
        return { label: 'Separando', bg: '#e0f2fe', text: '#0369a1', icon: <Sparkles size={14} /> };
      case 'A caminho':
        return { label: 'A caminho', bg: '#ffedd5', text: '#c2410c', icon: <Bike size={14} /> };
      default:
        return { label: order.status, bg: 'var(--green-pale)', text: 'var(--primary-green)', icon: <Store size={14} /> };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className="active-order-floating-banner"
      onClick={() => onOpenTracking(order)}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 28px)',
        maxWidth: '492px',
        zIndex: 85,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '14px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: badge.bg,
              color: badge.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              position: 'relative',
            }}
          >
            {badge.icon}
            <span
              className="live-radar-dot"
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: badge.text, textTransform: 'uppercase' }}>
                {badge.label}
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>• #{order.id}</span>
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {getStatusText()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 'none' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--primary-green)',
              background: 'var(--green-pale)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            Rastrear <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
};
