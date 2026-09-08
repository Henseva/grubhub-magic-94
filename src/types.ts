export type ProductTag = 'novo' | 'promo';

export interface Product {
  id: string;
  name: string;
  weight: string;
  desc: string;
  price: number;
  originalPrice?: number;
  icon: string;
  image?: string;
  isOrganic?: boolean;
  inStock?: boolean;
  grad?: string;
  tags?: ProductTag[];
  category: string;
  nutritionalTip?: string;
  storageTip?: string;
  origin?: string;
}

export interface Section {
  id: string;
  chip: string;
  title: string;
  banner?: string;
  bannerImage?: string;
  bannerCaption?: string;
  items: Product[];
}

export interface CartItem {
  id: string;
  product: Product;
  qty: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  avatar?: string;
}

export type PaymentMethod = 'pix' | 'card' | 'cash';

export interface OrderItemSummary {
  id: string;
  name: string;
  price: number;
  qty: number;
  icon: string;
  image?: string;
  notes?: string;
}

export type OrderStatus = 'Confirmado' | 'Em separação' | 'A caminho' | 'Entregue' | 'Cancelado';

export interface CourierInfo {
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  rating: number;
  photo: string;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  date: string;
  createdAtTimestamp?: number;
  statusUpdatedAt?: number;
  estimatedMinutes?: number;
  courier?: CourierInfo;
  liveProgress?: number; // 0 to 100
  liveLatitude?: number;
  liveLongitude?: number;
  deliveryCode?: string; // 4-digit verification code like iFood
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryPeriod: 'Hoje (Expressa 60-90 min)' | 'Manhã (08h-12h)' | 'Tarde (13h-17h)' | 'Noite (17h-20h)';
  notes?: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  description: string;
  minOrder?: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  recommendedProduct?: string;
  verified?: boolean;
}

export type ActiveTab = 'inicio' | 'cardapio' | 'favoritos' | 'pedidos' | 'conta';
