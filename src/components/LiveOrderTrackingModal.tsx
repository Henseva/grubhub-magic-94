import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Navigation,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Store,
  MapPin,
  Sparkles,
  Zap,
  Bike
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

// Coordinates for store and customer in São Paulo
const STORE_COORDS: [number, number] = [-23.56168, -46.68535]; // Mercado Fresco - Pinheiros
const DESTINATION_COORDS: [number, number] = [-23.56780, -46.65750]; // Casa do Cliente - Jardins

// Waypoints route through realistic streets (Pinheiros -> Brasil -> Jardins)
const ROUTE_WAYPOINTS: [number, number][] = [
  [-23.56168, -46.68535], // 0. Loja Mercado Fresco
  [-23.56280, -46.68190], // 1. Fradique Coutinho
  [-23.56420, -46.67780], // 2. Rebouças
  [-23.56580, -46.67220], // 3. Av. Brasil
  [-23.56710, -46.66640], // 4. Estados Unidos x Bela Cintra
  [-23.56840, -46.66120], // 5. Alameda Lorena
  [-23.56780, -46.65750], // 6. Chegada: Casa do Cliente
];

// Helper to interpolate position along route waypoints based on progress percentage (0 - 100)
function interpolateRoute(progressPercent: number): { lat: number; lng: number; bearing: number } {
  const p = Math.max(0, Math.min(100, progressPercent)) / 100;
  const numSegments = ROUTE_WAYPOINTS.length - 1;
  const targetIndex = p * numSegments;
  const segmentIndex = Math.min(Math.floor(targetIndex), numSegments - 1);
  const segmentFraction = targetIndex - segmentIndex;

  const start = ROUTE_WAYPOINTS[segmentIndex];
  const end = ROUTE_WAYPOINTS[segmentIndex + 1];

  const lat = start[0] + (end[0] - start[0]) * segmentFraction;
  const lng = start[1] + (end[1] - start[1]) * segmentFraction;

  // Simple bearing
  const y = Math.sin((end[1] - start[1]) * (Math.PI / 180)) * Math.cos(end[0] * (Math.PI / 180));
  const x =
    Math.cos(start[0] * (Math.PI / 180)) * Math.sin(end[0] * (Math.PI / 180)) -
    Math.sin(start[0] * (Math.PI / 180)) * Math.cos(end[0] * (Math.PI / 180)) * Math.cos((end[1] - start[1]) * (Math.PI / 180));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return { lat, lng, bearing };
}

interface LiveOrderTrackingModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
}

export const LiveOrderTrackingModal: React.FC<LiveOrderTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  isDark,
  onUpdateStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [followCourier, setFollowCourier] = useState(true);

  // Delivery code (default to last 4 digits of id or 7491)
  const deliveryCode = useMemo(() => {
    const cleanId = order.id.replace(/\D/g, '');
    return cleanId.length >= 4 ? cleanId.slice(-4) : '7491';
  }, [order.id]);

  // Current progress calculation
  const progress = order.liveProgress ?? (order.status === 'Entregue' ? 100 : order.status === 'A caminho' ? 45 : order.status === 'Em separação' ? 20 : 5);

  // Calculate live ETA and distance
  const remainingDistanceKm = useMemo(() => {
    if (order.status === 'Entregue') return 0;
    if (order.status === 'Confirmado') return 3.4;
    if (order.status === 'Em separação') return 3.2;
    const remainingRatio = 1 - progress / 100;
    return Math.max(0.1, Number((remainingRatio * 3.2).toFixed(1)));
  }, [order.status, progress]);

  const remainingMinutes = useMemo(() => {
    if (order.status === 'Entregue') return 0;
    if (order.status === 'Confirmado') return 25;
    if (order.status === 'Em separação') return 18;
    const mins = Math.max(1, Math.round((1 - progress / 100) * 14));
    return mins;
  }, [order.status, progress]);

  // Status step configuration
  const steps: Array<{
    status: OrderStatus;
    title: string;
    desc: string;
    time: string;
    completed: boolean;
    current: boolean;
  }> = useMemo(() => {
    const isCompleted = (target: OrderStatus) => {
      const orderRanks: Record<OrderStatus, number> = {
        Confirmado: 1,
        'Em separação': 2,
        'A caminho': 3,
        Entregue: 4,
        Cancelado: 0,
      };
      return orderRanks[order.status] >= orderRanks[target];
    };

    return [
      {
        status: 'Confirmado',
        title: 'Pedido Confirmado',
        desc: 'A feira recebeu e conferiu seus produtos.',
        time: 'Hoje, 14:30',
        completed: isCompleted('Confirmado'),
        current: order.status === 'Confirmado',
      },
      {
        status: 'Em separação',
        title: 'Separando & Pesando',
        desc: 'Selecionando frutas, verduras e legumes frescos no ponto ideal.',
        time: isCompleted('Em separação') ? 'Hoje, 14:35' : 'Previsto',
        completed: isCompleted('Em separação'),
        current: order.status === 'Em separação',
      },
      {
        status: 'A caminho',
        title: 'Saiu para Entrega',
        desc: 'O entregador Carlos Eduardo está a caminho do seu endereço.',
        time: isCompleted('A caminho') ? 'Em trânsito' : 'Aguardando',
        completed: isCompleted('A caminho'),
        current: order.status === 'A caminho',
      },
      {
        status: 'Entregue',
        title: 'Pedido Entregue',
        desc: 'Produtos fresquinhos entregues com carinho!',
        time: order.status === 'Entregue' ? 'Agora mesmo' : 'Previsto',
        completed: order.status === 'Entregue',
        current: order.status === 'Entregue',
      },
    ];
  }, [order.status]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: STORE_COORDS,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Add CartoDB tile layer based on dark or light mode
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Custom HTML Icons
    const storeIcon = L.divIcon({
      className: 'custom-map-marker store-marker',
      html: `
        <div style="
          background: #237637;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(35, 118, 55, 0.45);
          border: 2.5px solid #ffffff;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const destinationIcon = L.divIcon({
      className: 'custom-map-marker dest-marker',
      html: `
        <div style="
          background: #e8770a;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(232, 119, 10, 0.45);
          border: 2.5px solid #ffffff;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    // Add store and destination markers
    L.marker(STORE_COORDS, { icon: storeIcon })
      .addTo(map)
      .bindPopup('<b>Mercado Fresco</b><br>Loja Central - Hortifruti');

    L.marker(DESTINATION_COORDS, { icon: destinationIcon })
      .addTo(map)
      .bindPopup(`<b>Seu Endereço</b><br>${order.deliveryAddress}`);

    // Draw planned route polyline
    const polyline = L.polyline(ROUTE_WAYPOINTS, {
      color: isDark ? '#4ade80' : '#237637',
      weight: 5,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routeLineRef.current = polyline;

    // Fit bounds to route
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Initial courier marker
    const courierPos = interpolateRoute(progress);
    const courierIcon = L.divIcon({
      className: 'custom-map-marker courier-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div class="courier-radar-pulse"></div>
          <div style="
            background: #2563eb;
            color: white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
            border: 2.5px solid #ffffff;
            position: relative;
            z-index: 2;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const courierMarker = L.marker([courierPos.lat, courierPos.lng], {
      icon: courierIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    courierMarkerRef.current = courierMarker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen, isDark]);

  // Update courier position on the map when progress changes
  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;

    const currentCoords = interpolateRoute(progress);
    courierMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);

    if (followCourier) {
      mapInstanceRef.current.panTo([currentCoords.lat, currentCoords.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [progress, followCourier]);

  const handleCenterOnCourier = () => {
    if (!mapInstanceRef.current) return;
    setFollowCourier(true);
    const pos = interpolateRoute(progress);
    mapInstanceRef.current.setView([pos.lat, pos.lng], 15, { animate: true });
  };

  const handleShowFullRoute = () => {
    if (!mapInstanceRef.current || !routeLineRef.current) return;
    setFollowCourier(false);
    mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds(), {
      padding: [40, 40],
      animate: true,
    });
  };

  const handleOpenWhatsAppCourier = () => {
    const text = `Olá Carlos Eduardo! Sou o cliente do pedido #${order.id} no Mercado Fresco. Gostaria de combinar a entrega.`;
    const url = `https://wa.me/5511987654321?text=${encodeURIComponent(text)}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="receipt-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="live-tracking-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          background: 'var(--surface)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border)',
          color: 'var(--ink)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-radar-dot"></span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Rastreamento ao Vivo
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--green-pale)',
                    color: 'var(--primary-green)',
                  }}
                >
                  Pedido #{order.id}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Rastreamento da Entrega em Tempo Real
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="closebtn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
            aria-label="Fechar rastreamento"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Main Status ETA Card */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: order.status === 'Entregue' ? 'var(--green-pale)' : 'linear-gradient(135deg, rgba(35, 118, 55, 0.08) 0%, rgba(232, 119, 10, 0.08) 100%)',
              border: '1.5px solid var(--border)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: '3px' }}>
                {order.status === 'Entregue' ? 'Status Final' : 'Previsão de Entrega'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-head)' }}>
                {order.status === 'Entregue' ? (
                  <span style={{ color: 'var(--primary-green)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={20} /> Pedido Concluído
                  </span>
                ) : (
                  <span>Chega em ~{remainingMinutes} minutos</span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px' }}>
                {order.status === 'Entregue'
                  ? 'Entregue hoje às 14:52'
                  : `Distância: ${remainingDistanceKm} km • ${order.deliveryPeriod}`}
              </div>
            </div>

            {/* Delivery Verification Code Box */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1.5px dashed var(--orange)',
                borderRadius: '10px',
                padding: '8px 12px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                Código de Entrega
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--orange-dark)', letterSpacing: '2px' }}>
                {deliveryCode}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '1px' }}>
                Confirme com o motoboy
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '240px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
                background: isDark ? '#141f18' : '#e2ede4',
              }}
            />

            {/* Live Overlay Badge */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 400,
                background: 'rgba(24, 38, 29, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <span className="live-radar-dot" style={{ width: '8px', height: '8px' }}></span>
              {order.status === 'Entregue'
                ? 'Entrega finalizada'
                : order.status === 'A caminho'
                ? `Ao vivo: Motoboy a ${remainingDistanceKm} km`
                : 'Aguardando saída da loja'}
            </div>

            {/* Map Quick Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 400,
                display: 'flex',
                gap: '6px',
              }}
            >
              <button
                type="button"
                onClick={handleCenterOnCourier}
                title="Centralizar no Motoboy"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <Bike size={14} className="text-blue-500" /> Seguir Motoboy
              </button>
              <button
                type="button"
                onClick={handleShowFullRoute}
                title="Ver Rota Completa"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <Navigation size={14} /> Rota
              </button>
            </div>
          </div>

          {/* Entregador Card (Carlos Eduardo) */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}
              >
                CE
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                  Carlos Eduardo da Silva
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Honda Fan 160 • Vermelha</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>(BRA-4F29)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--orange-dark)', fontWeight: 700, marginTop: '2px' }}>
                  ★ 4.9 (1.420 entregas)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleOpenWhatsAppCourier}
                title="Mensagem WhatsApp com o Entregador"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                }}
              >
                <MessageCircle size={17} />
              </button>
              <a
                href="tel:11987654321"
                title="Ligar para o Entregador"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--surface-subtle)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <Phone size={16} />
              </a>
            </div>
          </div>

          {/* Stepper Timeline List */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', marginBottom: '12px' }}>
              Progresso do Pedido em Tempo Real
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {steps.map((step, idx) => (
                <div
                  key={step.status}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
                  {/* Step Connector Line */}
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '26px',
                        bottom: '-14px',
                        width: '2px',
                        background: step.completed ? 'var(--primary-green)' : 'var(--border)',
                      }}
                    />
                  )}

                  {/* Step Dot */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: step.completed
                        ? 'var(--primary-green)'
                        : step.current
                        ? 'var(--orange)'
                        : 'var(--border)',
                      color: step.completed || step.current ? '#ffffff' : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                      flex: 'none',
                      zIndex: 2,
                      boxShadow: step.current ? '0 0 0 4px rgba(232, 119, 10, 0.2)' : 'none',
                    }}
                  >
                    {step.completed ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>

                  {/* Step Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: step.current ? 800 : step.completed ? 700 : 500,
                          color: step.current ? 'var(--orange-dark)' : step.completed ? 'var(--ink)' : 'var(--muted)',
                        }}
                      >
                        {step.title}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{step.time}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Security & Customer Support Section */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--ink)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontWeight: 700 }}>Conexão GPS Ativa</span>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>• Atualizado em tempo real</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const text = `Olá! Gostaria de uma informação sobre a entrega do meu pedido #${order.id} no Mercado Fresco.`;
                  window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-green)',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MessageCircle size={13} /> Ajuda com o Pedido
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4, marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              Por segurança e controle de qualidade, confira o código <b>{deliveryCode}</b> com o entregador e verifique o lacre térmico da sua embalagem.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            Total:{' '}
            <b style={{ color: 'var(--ink)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
            </b>{' '}
            • {order.items.length} itens
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--primary-green)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
