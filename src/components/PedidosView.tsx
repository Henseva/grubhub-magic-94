import React, { useState, useMemo } from 'react';
import {
  Ban,
  Bike,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  FolderOpen,
  MapPin,
  MessageCircle,
  Package,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Sprout,
  Store,
  Trash2,
  Truck,
  User,
  Zap
} from 'lucide-react';
import { formatCurrency, STORE_PHONE } from '../data/products';
import { Order, OrderStatus } from '../types';
import { ProductIcon } from './ProductIcon';
import { copyTextToClipboard } from '../utils/clipboard';

interface PedidosViewProps {
  orders: Order[];
  onReorder: (order: Order) => void;
  onNavigateToCardapio: () => void;
  openWhatsApp: (text?: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenTracking?: (order: Order) => void;
  isDark: boolean;
}

type OrderFilter = 'all' | 'active' | 'completed';

export const PedidosView: React.FC<PedidosViewProps> = ({
  orders,
  onReorder,
  onNavigateToCardapio,
  openWhatsApp,
  onCancelOrder,
  onDeleteOrder,
  onOpenTracking,
}) => {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Grouping / filtering orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'Entregue' && o.status !== 'Cancelado');
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Entregue' || o.status === 'Cancelado');
  }, [orders]);

  const displayedOrders = useMemo(() => {
    if (filter === 'active') return activeOrders;
    if (filter === 'completed') return completedOrders;
    return orders;
  }, [orders, filter, activeOrders, completedOrders]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Stepper helper
  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Confirmado':
        return 1;
      case 'Em separação':
        return 2;
      case 'A caminho':
        return 3;
      case 'Entregue':
        return 4;
      default:
        return 0;
    }
  };

  // Copy receipt summary
  const handleCopyReceipt = async (order: Order) => {
    const summary = [
      `COMPROVANTE DE PEDIDO #${order.id}`,
      `Mercado Fresco - Hortifruti por Encomenda`,
      `Data: ${order.date}`,
      `Cliente: ${order.customerName} (${order.customerPhone})`,
      `Entrega: ${order.deliveryAddress}`,
      `Agendado para: ${order.deliveryDate} - ${order.deliveryPeriod}`,
      `----------------------------------------`,
      ...order.items.map((i) => `${i.qty}x ${i.name} - ${formatCurrency(i.price * i.qty)}`),
      `----------------------------------------`,
      `Subtotal: ${formatCurrency(order.subtotal)}`,
      ...(order.discount ? [`Desconto (${order.couponCode || 'Cupom'}): -${formatCurrency(order.discount)}`] : []),
      `Taxa de Entrega: ${order.deliveryFee === 0 ? 'Grátis' : formatCurrency(order.deliveryFee)}`,
      `TOTAL: ${formatCurrency(order.total)}`,
      `Pagamento: ${
        order.paymentMethod === 'pix'
          ? 'Pix'
          : order.paymentMethod === 'card'
          ? 'Cartão na Entrega'
          : 'Dinheiro'
      }`,
      `Status: ${order.status}`
    ].join('\n');

    const ok = await copyTextToClipboard(summary);
    if (ok) {
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-header-content">
          <h2 className="view-header-title">
            <Package size={22} className="inline-icon" strokeWidth={2} /> Meus Pedidos
          </h2>
          <div className="view-header-subtitle">
            Acompanhe o status em tempo real e consulte seus comprovantes
          </div>
        </div>
        <div className="view-header-meta">
          <span className="view-badge">{orders.length} pedidos</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px 100px' }}>
        {/* Filter Tabs */}
        <div className="order-filter-tabs">
          <button
            type="button"
            className={`order-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({orders.length})
          </button>
          <button
            type="button"
            className={`order-filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Em Andamento ({activeOrders.length})
          </button>
          <button
            type="button"
            className={`order-filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Concluídos ({completedOrders.length})
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="view-empty-state">
            <div className="view-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <ShoppingBag size={48} strokeWidth={1.5} />
            </div>
            <div className="view-empty-title">Nenhum pedido realizado ainda</div>
            <div className="view-empty-desc">
              Suas encomendas de hortifruti fresco aparecerão aqui com rastreamento completo da colheita até a sua mesa!
            </div>
            <button
              type="button"
              className="view-empty-btn"
              onClick={onNavigateToCardapio}
            >
              Fazer Minha Primeira Encomenda
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="view-empty-state" style={{ padding: '30px 16px' }}>
            <div className="view-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <FolderOpen size={44} strokeWidth={1.5} />
            </div>
            <div className="view-empty-title">Nenhum pedido nesta aba</div>
            <div className="view-empty-desc">
              Não encontramos pedidos com o filtro selecionado. Toque em "Todos" para ver seu histórico completo.
            </div>
            <button
              type="button"
              className="view-empty-btn"
              onClick={() => setFilter('all')}
            >
              Ver Todos os Pedidos
            </button>
          </div>
        ) : (
          displayedOrders.map((order) => {
            const stepIndex = getStepIndex(order.status);
            const isExpanded = expandedOrderId === order.id;
            const cleanDeliverySlot = order.deliveryPeriod.toLowerCase().includes(order.deliveryDate.toLowerCase())
              ? order.deliveryPeriod
              : `${order.deliveryDate} • ${order.deliveryPeriod}`;

            return (
              <div key={order.id} className="order-card-enhanced" id={`order-${order.id}`}>
                {/* Header: Order ID, Date & Status */}
                <div className="order-card-header">
                  <div className="order-card-header-top">
                    <span className="order-card-id">Pedido #{order.id}</span>
                    <span
                      className={`order-status-badge ${
                        order.status === 'Entregue'
                          ? 'status-delivered'
                          : order.status === 'A caminho'
                          ? 'status-transit'
                          : order.status === 'Em separação'
                          ? 'status-preparing'
                          : order.status === 'Cancelado'
                          ? 'status-cancelled'
                          : 'status-confirmed'
                      }`}
                    >
                      {order.status === 'Entregue' && <CheckCircle2 size={13} className="inline-icon" />}
                      {order.status === 'A caminho' && <Truck size={13} className="inline-icon" />}
                      {order.status === 'Em separação' && <PackageSearch size={13} className="inline-icon" />}
                      {order.status === 'Confirmado' && <Clock size={13} className="inline-icon" />}
                      {order.status === 'Cancelado' && <Ban size={13} className="inline-icon" />}
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-meta-row">
                    <span>{order.date}</span>
                    <span>•</span>
                    <span className="order-card-meta-slot">
                      <Calendar size={12} className="inline-icon" /> {cleanDeliverySlot}
                    </span>
                  </div>
                </div>

                {/* Live tracking trigger banner */}
                {onOpenTracking && order.status !== 'Cancelado' && (
                  <button
                    type="button"
                    onClick={() => onOpenTracking(order)}
                    className="order-tracking-banner"
                    aria-label="Acompanhar entrega no mapa"
                  >
                    <div className="order-tracking-banner-left">
                      <div className="order-tracking-banner-icon">
                        <Bike size={18} />
                      </div>
                      <div className="order-tracking-banner-text">
                        <div className="order-tracking-banner-title">
                          {order.status === 'Entregue'
                            ? 'Entrega Concluída'
                            : order.status === 'A caminho'
                            ? 'Motoboy a caminho'
                            : 'Rastreamento ao vivo'}
                        </div>
                        <div className="order-tracking-banner-desc">
                          {order.status === 'Entregue'
                            ? 'Toque para ver a rota'
                            : order.status === 'A caminho'
                            ? 'Carlos Eduardo • ~14 min'
                            : 'Acompanhe no mapa em tempo real'}
                        </div>
                      </div>
                    </div>
                    <span className="order-tracking-banner-pill">
                      Ver mapa →
                    </span>
                  </button>
                )}

                {/* 4-Step Progress Stepper or Cancelled Notice */}
                {order.status === 'Cancelado' ? (
                  <div
                    style={{
                      margin: '10px 0 14px',
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#dc2626',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}
                  >
                    <Ban size={15} /> Este pedido foi cancelado.
                  </div>
                ) : (
                  <div className="order-stepper-box">
                    <div className="order-stepper-track">
                      <div
                        className="order-stepper-fill"
                        style={{
                          width:
                            stepIndex === 1
                              ? '15%'
                              : stepIndex === 2
                              ? '48%'
                              : stepIndex === 3
                              ? '78%'
                              : '100%'
                        }}
                      ></div>
                    </div>

                    <div className="order-stepper-steps">
                      <div className={`stepper-step ${stepIndex >= 1 ? 'completed' : ''} ${stepIndex === 1 ? 'current' : ''}`}>
                        <div className="stepper-dot">1</div>
                        <span className="stepper-label">Recebido</span>
                      </div>
                      <div className={`stepper-step ${stepIndex >= 2 ? 'completed' : ''} ${stepIndex === 2 ? 'current' : ''}`}>
                        <div className="stepper-dot">2</div>
                        <span className="stepper-label">Separação</span>
                      </div>
                      <div className={`stepper-step ${stepIndex >= 3 ? 'completed' : ''} ${stepIndex === 3 ? 'current' : ''}`}>
                        <div className="stepper-dot">3</div>
                        <span className="stepper-label">A caminho</span>
                      </div>
                      <div className={`stepper-step ${stepIndex >= 4 ? 'completed' : ''} ${stepIndex === 4 ? 'current' : ''}`}>
                        <div className="stepper-dot">4</div>
                        <span className="stepper-label">Entregue</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items preview */}
                <div className="order-card-items-preview">
                  <div className="order-items-icons">
                    {order.items.slice(0, 4).map((it, idx) => {
                      const displayName = it.name.length > 22 ? `${it.name.slice(0, 20)}...` : it.name;
                      return (
                        <span key={idx} className="order-item-chip" title={it.name}>
                          <ProductIcon item={it} size={14} className="inline-icon" /> {it.qty}x {displayName}
                        </span>
                      );
                    })}
                    {order.items.length > 4 && (
                      <span className="order-item-more">+{order.items.length - 4} itens</span>
                    )}
                  </div>
                </div>

                {/* Expand / Collapse Details Toggle */}
                <button
                  type="button"
                  className="order-expand-toggle"
                  onClick={() => toggleExpand(order.id)}
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? 'Ocultar detalhes do pedido' : 'Ver itens e detalhes completos'}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="order-details-expanded">
                    <div className="order-items-table">
                      <div className="order-table-title">Itens da Encomenda:</div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-detail-item-row">
                          <div className="order-item-left">
                            <span className="order-detail-icon">
                              <ProductIcon item={item} size={28} />
                            </span>
                            <div>
                              <div className="order-detail-name">
                                <b>{item.qty}x</b> {item.name}
                              </div>
                              {item.notes && (
                                <div className="order-detail-note">Obs: {item.notes}</div>
                              )}
                            </div>
                          </div>
                          <span className="order-detail-price">
                            {formatCurrency(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Payment details box */}
                    <div className="order-detail-meta-box">
                      <div className="order-meta-line">
                        <span className="meta-line-icon">
                          <MapPin size={16} />
                        </span>
                        <div className="meta-line-content">
                          <span className="meta-line-label">Endereço de Entrega</span>
                          <span className="meta-line-val">{order.deliveryAddress}</span>
                        </div>
                      </div>

                      <div className="order-meta-line">
                        <span className="meta-line-icon">
                          <CreditCard size={16} />
                        </span>
                        <div className="meta-line-content">
                          <span className="meta-line-label">Forma de Pagamento</span>
                          <span className="meta-line-val">
                            {order.paymentMethod === 'pix'
                              ? 'Pix Instantâneo'
                              : order.paymentMethod === 'card'
                              ? 'Cartão na Entrega (Débito/Crédito)'
                              : `Dinheiro${order.changeFor ? ` (Troco para R$ ${order.changeFor})` : ''}`}
                          </span>
                        </div>
                      </div>

                      <div className="order-meta-line">
                        <span className="meta-line-icon">
                          <User size={16} />
                        </span>
                        <div className="meta-line-content">
                          <span className="meta-line-label">Cliente</span>
                          <span className="meta-line-val">{order.customerName} • {order.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer with total and actions */}
                <div className="order-card-footer">
                  <div className="order-card-total-row">
                    <div className="order-footer-total-box">
                      <span className="order-footer-label">Total do Pedido</span>
                      <div className="order-footer-total">{formatCurrency(order.total)}</div>
                    </div>

                    <div className="order-payment-badge">
                      {order.paymentMethod === 'pix' ? (
                        <>
                          <Zap size={13} style={{ color: 'var(--primary-green)' }} /> Pix
                        </>
                      ) : order.paymentMethod === 'card' ? (
                        <>
                          <CreditCard size={13} /> Cartão na Entrega
                        </>
                      ) : (
                        <>
                          <span>💵</span> Dinheiro
                        </>
                      )}
                    </div>
                  </div>

                  <div className="order-footer-actions-grid">
                    {order.status !== 'Cancelado' && order.status !== 'Entregue' ? (
                      <>
                        {onOpenTracking && (
                          <button
                            type="button"
                            className={`order-action-btn ${order.status === 'A caminho' ? 'primary' : 'secondary'} full-width`}
                            onClick={() => onOpenTracking(order)}
                            title="Acompanhar no mapa ao vivo"
                          >
                            <Bike size={16} /> Rastrear Pedido no Mapa
                          </button>
                        )}
                        <button
                          type="button"
                          className="order-action-btn secondary"
                          onClick={() => setReceiptOrder(order)}
                          title="Ver Comprovante Digital"
                        >
                          <ReceiptText size={15} /> Comprovante
                        </button>
                        {onCancelOrder ? (
                          <button
                            type="button"
                            className="order-action-btn danger-subtle"
                            onClick={() => setOrderToCancel(order)}
                            title="Cancelar este pedido"
                          >
                            <Ban size={14} /> Cancelar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="order-action-btn secondary"
                            onClick={() => onReorder(order)}
                            title="Repetir este pedido"
                          >
                            <RotateCcw size={14} /> Repetir
                          </button>
                        )}
                      </>
                    ) : order.status === 'Entregue' ? (
                      <>
                        <button
                          type="button"
                          className="order-action-btn primary"
                          onClick={() => onReorder(order)}
                          title="Fazer este pedido novamente"
                        >
                          <RotateCcw size={15} /> Repetir Pedido
                        </button>
                        <button
                          type="button"
                          className="order-action-btn secondary"
                          onClick={() => setReceiptOrder(order)}
                          title="Ver Comprovante Digital"
                        >
                          <ReceiptText size={15} /> Comprovante
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="order-action-btn secondary"
                          onClick={() => onReorder(order)}
                          title="Refazer pedido cancelado"
                        >
                          <RotateCcw size={15} /> Refazer Pedido
                        </button>
                        {onDeleteOrder && (
                          <button
                            type="button"
                            className="order-action-btn secondary"
                            onClick={() => setOrderToDelete(order)}
                            title="Remover do histórico"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* WhatsApp Help link for this order */}
                <div className="order-help-row">
                  <button
                    type="button"
                    className="order-help-btn"
                    onClick={() =>
                      openWhatsApp(
                        `Olá Mercado Fresco! Gostaria de falar sobre o meu Pedido #${order.id} realizado em ${order.date}.`
                      )
                    }
                  >
                    <MessageCircle size={15} className="inline-icon" /> Dúvidas sobre este pedido? Acompanhe no WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* How It Works Explainer Card */}
        <div className="order-how-it-works-card">
          <div className="how-header">
            <span className="how-icon">
              <Sprout size={18} />
            </span>
            <div className="how-title">Como Funciona a Sua Encomenda Fresca</div>
          </div>
          <div className="how-steps-grid">
            <div className="how-step-item">
              <span className="how-step-num">1</span>
              <div>
                <div className="how-step-name">Você Encomenda</div>
                <div className="how-step-text">Escolha suas frutas, kits e porções ideais.</div>
              </div>
            </div>
            <div className="how-step-item">
              <span className="how-step-num">2</span>
              <div>
                <div className="how-step-name">Colheita na Madrugada</div>
                <div className="how-step-text">Selecionamos direto do produtor sem desperdício.</div>
              </div>
            </div>
            <div className="how-step-item">
              <span className="how-step-num">3</span>
              <div>
                <div className="how-step-name">Higienização Cuidadosa</div>
                <div className="how-step-text">Lavadas, picadas e embaladas em potes selados.</div>
              </div>
            </div>
            <div className="how-step-item">
              <span className="how-step-num">4</span>
              <div>
                <div className="how-step-name">Entrega no Horário</div>
                <div className="how-step-text">Chega na sua porta no período agendado.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {receiptOrder && (
        <div className="receipt-modal-backdrop" onClick={() => setReceiptOrder(null)}>
          <div
            className="receipt-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Comprovante de Pedido"
          >
            <div className="receipt-header">
              <div className="receipt-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Store size={18} /> MERCADO FRESCO
              </div>
              <div className="receipt-sub">Hortifruti Fresco por Encomenda</div>
              <div className="receipt-divider">================================</div>
            </div>

            <div className="receipt-body">
              <div className="receipt-row">
                <span>Pedido:</span>
                <b>#{receiptOrder.id}</b>
              </div>
              <div className="receipt-row">
                <span>Data/Hora:</span>
                <span>{receiptOrder.date}</span>
              </div>
              <div className="receipt-row">
                <span>Cliente:</span>
                <span>{receiptOrder.customerName}</span>
              </div>
              <div className="receipt-row">
                <span>Telefone:</span>
                <span>{receiptOrder.customerPhone}</span>
              </div>
              <div className="receipt-row">
                <span>Endereço:</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>{receiptOrder.deliveryAddress}</span>
              </div>
              <div className="receipt-row">
                <span>Agendamento:</span>
                <span>{receiptOrder.deliveryDate} ({receiptOrder.deliveryPeriod})</span>
              </div>

              <div className="receipt-divider">--------------------------------</div>
              <div className="receipt-items-list">
                {receiptOrder.items.map((it, i) => (
                  <div key={i} className="receipt-item-line">
                    <span>
                      {it.qty}x {it.name}
                    </span>
                    <span>{formatCurrency(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-divider">--------------------------------</div>

              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptOrder.subtotal)}</span>
              </div>
              {Boolean(receiptOrder.discount) && (
                <div className="receipt-row" style={{ color: 'var(--primary-green-accent, var(--primary-green))', fontWeight: 700 }}>
                  <span>Desconto ({receiptOrder.couponCode || 'Cupom'}):</span>
                  <span>-{formatCurrency(receiptOrder.discount!)}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>Entrega:</span>
                <span>{receiptOrder.deliveryFee === 0 ? 'Grátis' : formatCurrency(receiptOrder.deliveryFee)}</span>
              </div>
              <div className="receipt-row receipt-total-line">
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptOrder.total)}</span>
              </div>
              <div className="receipt-row">
                <span>Pagamento:</span>
                <span>
                  {receiptOrder.paymentMethod === 'pix'
                    ? 'Pix Instantâneo'
                    : receiptOrder.paymentMethod === 'card'
                    ? 'Cartão na Entrega'
                    : `Dinheiro${receiptOrder.changeFor ? ` (Troco para R$ ${receiptOrder.changeFor})` : ''}`}
                </span>
              </div>
              <div className="receipt-row">
                <span>Status:</span>
                <span style={{ color: 'var(--primary-green-accent, var(--primary-green))', fontWeight: 700 }}>{receiptOrder.status}</span>
              </div>

              <div className="receipt-footer-note">
                Obrigado por escolher produtos frescos do Mercado Fresco!
              </div>
            </div>

            <div className="receipt-actions">
              <button
                type="button"
                className="receipt-copy-btn"
                onClick={() => handleCopyReceipt(receiptOrder)}
              >
                {copiedReceipt ? (
                  <>
                    <Check size={15} className="inline-icon" /> Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy size={15} className="inline-icon" /> Copiar Comprovante
                  </>
                )}
              </button>
              <button
                type="button"
                className="receipt-close-btn"
                onClick={() => setReceiptOrder(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="receipt-modal-backdrop" onClick={() => setOrderToDelete(null)}>
          <div
            className="receipt-modal-box"
            style={{ maxWidth: '380px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Confirmar exclusão de pedido"
          >
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '6px' }}>
                Apagar Pedido #{orderToDelete.id}?
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                Este pedido será apagado do seu histórico de encomendas neste dispositivo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder && orderToDelete) {
                    onDeleteOrder(orderToDelete.id);
                  }
                  setOrderToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sim, Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="receipt-modal-backdrop" onClick={() => setOrderToCancel(null)}>
          <div
            className="receipt-modal-box"
            style={{ maxWidth: '380px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Confirmar cancelamento de pedido"
          >
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <Ban size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '6px' }}>
                Cancelar Pedido #{orderToCancel.id}?
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                O status do pedido será alterado para Cancelado.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onCancelOrder && orderToCancel) {
                    onCancelOrder(orderToCancel.id);
                  }
                  setOrderToCancel(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
