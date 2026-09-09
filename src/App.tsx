import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Apple,
  Banknote,
  Bike,
  BookOpen,
  Camera,
  Carrot,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Flame,
  Heart,
  Home,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Pencil,
  Phone,
  QrCode,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  Truck,
  User,
  X
} from 'lucide-react';
import {
  SECTIONS,
  ALL_PRODUCTS,
  FREE_SHIPPING_THRESHOLD,
  MIN_ORDER_THRESHOLD,
  STORE_PHONE,
  formatCurrency
} from './data/products';
import { Product, CartItem, Order, UserProfile, PaymentMethod, AppliedCoupon, OrderStatus, Review } from './types';
import { validateCoupon, calculateDiscount } from './data/coupons';
import { formatCep, formatPhone, fetchAddressByCep } from './utils/address';
import { validateBrazilianPhone, formatBrazilianPhone, BRAZILIAN_DDDS } from './utils/phone';
import { generatePixPayload, getPixQrCodeImageUrl, DEFAULT_PIX_PHONE_KEY, DEFAULT_PIX_KEY } from './utils/pix';
import { copyTextToClipboard } from './utils/clipboard';
import { getStoredReviews, addCustomerReview } from './data/reviews';
import { CardapioView } from './components/CardapioView';
import { FavoritosView } from './components/FavoritosView';
import { PedidosView } from './components/PedidosView';
import { ProductIcon } from './components/ProductIcon';
import { ProductDetailModal } from './components/ProductDetailModal';
import { LiveOrderTrackingModal } from './components/LiveOrderTrackingModal';
import { ActiveOrderFloatingBanner } from './components/ActiveOrderFloatingBanner';
import { useCatalog } from './hooks/useCatalog';
import { saveOrderToCloud } from './lib/cloud/orders';

const STANDARD_DELIVERY_FEE = 7.90;

export const App: React.FC = () => {
  // Catálogo vindo do banco (com fallback para os dados locais)
  const { sections: catalogSections, allProducts: catalogProducts } = useCatalog();

  // --- Persistent States ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mf_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('mf_favorites');
      return saved ? JSON.parse(saved) : { kit: true, salada1: true };
    } catch {
      return { kit: true, salada1: true };
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('mf_orders');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Live order tracking modal
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('mf_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save persistent state changes
  useEffect(() => {
    try {
      localStorage.setItem('mf_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('mf_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('mf_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('mf_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('mf_user');
      }
    } catch {}
  }, [user]);

  // --- Theme Mode State (Auto by system preference, Light, Dark) ---
  const [themePreference, setThemePreference] = useState<'auto' | 'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('mf_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    } catch {}
    return 'auto';
  });

  // --- Palette Theme State (Horta Esmeralda, Pomar Cítrico, Colheita Silvestre) ---
  const [paletteTheme, setPaletteTheme] = useState<'esmeralda' | 'citrico' | 'silvestre'>(() => {
    try {
      const saved = localStorage.getItem('mf_palette_theme');
      if (saved === 'esmeralda' || saved === 'citrico' || saved === 'silvestre') return saved;
    } catch {}
    return 'esmeralda';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const isDark = themePreference === 'auto' ? systemIsDark : themePreference === 'dark';

  // Apply dark/light class and palette theme to document
  useEffect(() => {
    try {
      localStorage.setItem('mf_theme_mode', themePreference);
    } catch {}
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark, themePreference]);

  useEffect(() => {
    try {
      localStorage.setItem('mf_palette_theme', paletteTheme);
    } catch {}
    document.documentElement.setAttribute('data-palette', paletteTheme);
    document.body.setAttribute('data-palette', paletteTheme);
  }, [paletteTheme]);

  // --- UI States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [activeNav, setActiveNav] = useState<'inicio' | 'cardapio' | 'favoritos' | 'pedidos' | 'conta'>('inicio');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<
    'favoritos' | 'pedidos' | 'conta' | 'reviews' | 'checkout' | 'product_detail' | 'order_success' | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productNotes, setProductNotes] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [badgeBump, setBadgeBump] = useState(false);
  const [dockBump, setDockBump] = useState(false);
  const [dockRipple, setDockRipple] = useState(false);
  const [flyingParticles, setFlyingParticles] = useState<Array<{
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    icon: string;
    image?: string;
    name: string;
  }>>([]);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);

  // Form states for Checkout
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const [checkoutCep, setCheckoutCep] = useState('');
  const [checkoutStreet, setCheckoutStreet] = useState('');
  const [checkoutNumber, setCheckoutNumber] = useState('');
  const [checkoutNeighborhood, setCheckoutNeighborhood] = useState('');
  const [checkoutComplement, setCheckoutComplement] = useState('');
  const [checkoutSchedule, setCheckoutSchedule] = useState<'Hoje (Expressa 60-90 min)' | 'Manhã (08h-12h)' | 'Tarde (13h-17h)' | 'Noite (17h-20h)'>('Hoje (Expressa 60-90 min)');
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>('pix');
  const [checkoutCardType, setCheckoutCardType] = useState<'Crédito' | 'Débito' | 'Vale-Alimentação / Refeição'>('Crédito');
  const [checkoutCardBrand, setCheckoutCardBrand] = useState<string>('Mastercard / Visa');
  const [checkoutChange, setCheckoutChange] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Real-time phone validation memo
  const phoneValidation = useMemo(() => {
    return validateBrazilianPhone(checkoutPhone);
  }, [checkoutPhone]);

  // Form state for Login / Profile edit
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginCep, setLoginCep] = useState('');
  const [loginStreet, setLoginStreet] = useState('');
  const [loginNumber, setLoginNumber] = useState('');
  const [loginComplement, setLoginComplement] = useState('');
  const [loginNeighborhood, setLoginNeighborhood] = useState('');
  const [loginAvatar, setLoginAvatar] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // CEP loading states & feedback
  const [loadingCepCheckout, setLoadingCepCheckout] = useState(false);
  const [loadingCepProfile, setLoadingCepProfile] = useState(false);
  const [cepFeedbackCheckout, setCepFeedbackCheckout] = useState<string | null>(null);
  const [cepFeedbackProfile, setCepFeedbackProfile] = useState<string | null>(null);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('mf_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('mf_applied_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('mf_applied_coupon');
      }
    } catch {}
  }, [appliedCoupon]);

  // Pix feedback states
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);

  // Customer Reviews state
  const [customerReviews, setCustomerReviews] = useState<Review[]>(() => getStoredReviews());
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewProduct, setNewReviewProduct] = useState('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Pre-fill forms when user changes
  useEffect(() => {
    if (user) {
      setCheckoutName(user.name || '');
      setCheckoutPhone(user.phone || '');
      setCheckoutCep(user.cep || '');
      setCheckoutStreet(user.street || '');
      setCheckoutNumber(user.number || '');
      setCheckoutNeighborhood(user.neighborhood || '');
      setCheckoutComplement(user.complement || '');
      setLoginName(user.name || '');
      setLoginEmail(user.email || '');
      setLoginPhone(user.phone || '');
      setLoginCep(user.cep || '');
      setLoginStreet(user.street || '');
      setLoginNumber(user.number || '');
      setLoginComplement(user.complement || '');
      setLoginNeighborhood(user.neighborhood || '');
      setLoginAvatar(user.avatar || '');
      setNewReviewName(user.name || '');
    }
  }, [user]);

  // Nav indicator position measurement
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ transform: string; width: string }>({
    transform: 'translateX(0px)',
    width: '0px'
  });

  const updateNavIndicator = () => {
    const btn = navRefs.current[activeNav];
    if (btn && navContainerRef.current) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      setIndicatorStyle({
        transform: `translateX(${left}px)`,
        width: `${btnRect.width}px`
      });
    }
  };

  useEffect(() => {
    updateNavIndicator();
    window.addEventListener('resize', updateNavIndicator);
    return () => window.removeEventListener('resize', updateNavIndicator);
  }, [activeNav]);

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Coupons & Pricing breakdown
  const discountAmount = useMemo(() => {
    return calculateDiscount(appliedCoupon, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const hasFreeShippingByCoupon = appliedCoupon?.type === 'free_shipping';
  const isFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD || hasFreeShippingByCoupon;
  const deliveryFee = isFreeShipping ? 0 : STANDARD_DELIVERY_FEE;
  const finalCartTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);

  const freeShippingMissing = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const freeShippingPercent = Math.min(100, Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100));

  // Trigger badge bump when cart changes
  const prevCountRef = useRef(totalCartCount);
  useEffect(() => {
    if (totalCartCount !== prevCountRef.current) {
      prevCountRef.current = totalCartCount;
      setBadgeBump(true);
      const timer = setTimeout(() => setBadgeBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalCartCount]);

  // Cart operations
  const getItemQty = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.qty : 0;
  };

  const triggerFlyAnimation = (
    product: Product,
    eventOrCoords?: React.MouseEvent | { clientX: number; clientY: number }
  ) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (eventOrCoords) {
      if ('currentTarget' in eventOrCoords && eventOrCoords.currentTarget) {
        const rect = (eventOrCoords.currentTarget as HTMLElement).getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      } else if ('clientX' in eventOrCoords && typeof eventOrCoords.clientX === 'number') {
        startX = eventOrCoords.clientX;
        startY = eventOrCoords.clientY;
      }
    }

    // Find destination cart dock
    const cartDockEl = document.getElementById('cartDockBtn');
    let targetX = window.innerWidth - 32;
    let targetY = window.innerHeight - 56;
    if (cartDockEl) {
      const rect = cartDockEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const particleId = `fly_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setFlyingParticles((prev) => [
      ...prev,
      {
        id: particleId,
        startX,
        startY,
        targetX,
        targetY,
        icon: product.icon,
        image: product.image,
        name: product.name,
      },
    ]);
  };

  const handleParticleArrival = (id: string) => {
    setFlyingParticles((prev) => prev.filter((p) => p.id !== id));
    setDockBump(true);
    setDockRipple(true);
    setBadgeBump(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
    setTimeout(() => setDockBump(false), 380);
    setTimeout(() => setDockRipple(false), 500);
  };

  const addToCart = (
    product: Product,
    delta = 1,
    notes?: string,
    eventOrCoords?: React.MouseEvent | { clientX: number; clientY: number },
    isSetExactQty = false
  ) => {
    if (delta > 0) {
      triggerFlyAnimation(product, eventOrCoords);
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = isSetExactQty ? delta : existing.qty + delta;
        if (newQty <= 0) {
          return prev.filter((i) => i.product.id !== product.id);
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: newQty, notes: notes !== undefined ? notes : i.notes } : i
        );
      } else if (delta > 0) {
        return [...prev, { id: product.id, product, qty: delta, notes }];
      }
      return prev;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setShowClearCartConfirm(false);
  };

  // Coupon handlers
  const handleApplyCoupon = (code: string) => {
    setCouponError(null);
    setCouponSuccess(null);
    const result = validateCoupon(code, cartSubtotal);
    if (!result.valid || !result.coupon) {
      setCouponError(result.error || 'Cupom inválido ou expirado.');
      return;
    }
    setAppliedCoupon(result.coupon);
    setCouponSuccess(`Cupom ${result.coupon.code} aplicado com sucesso!`);
    setCouponInput('');
    setTimeout(() => setCouponSuccess(null), 3000);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponSuccess(null);
  };

  // Address & CEP handler
  const handleCepChange = async (val: string, target: 'checkout' | 'profile') => {
    const formatted = formatCep(val);
    if (target === 'checkout') {
      setCheckoutCep(formatted);
      setCepFeedbackCheckout(null);
      const clean = formatted.replace(/\D/g, '');
      if (clean.length === 8) {
        setLoadingCepCheckout(true);
        const res = await fetchAddressByCep(clean);
        setLoadingCepCheckout(false);
        if (res) {
          if (res.street) setCheckoutStreet(res.street);
          if (res.neighborhood) setCheckoutNeighborhood(res.neighborhood);
          setCepFeedbackCheckout(res.city || 'Endereço localizado');
        } else {
          setCepFeedbackCheckout('CEP não localizado');
        }
      }
    } else {
      setLoginCep(formatted);
      setCepFeedbackProfile(null);
      const clean = formatted.replace(/\D/g, '');
      if (clean.length === 8) {
        setLoadingCepProfile(true);
        const res = await fetchAddressByCep(clean);
        setLoadingCepProfile(false);
        if (res) {
          if (res.street) setLoginStreet(res.street);
          if (res.neighborhood) setLoginNeighborhood(res.neighborhood);
          setCepFeedbackProfile(res.city || 'Endereço localizado');
        } else {
          setCepFeedbackProfile('CEP não localizado');
        }
      }
    }
  };

  // Pix clipboard helpers
  const handleCopyPixKey = async () => {
    const ok = await copyTextToClipboard(DEFAULT_PIX_PHONE_KEY);
    if (ok) {
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    }
  };

  const handleCopyPixCode = async (amount: number, orderId?: string) => {
    const payload = generatePixPayload(amount, orderId || 'MERCADOFRESCO', DEFAULT_PIX_PHONE_KEY);
    const ok = await copyTextToClipboard(payload);
    if (ok) {
      setCopiedPixCode(true);
      setTimeout(() => setCopiedPixCode(false), 2500);
    }
  };

  // Reviews submission handler
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    const authorName = newReviewName.trim() || user?.name || 'Cliente';
    const updated = addCustomerReview({
      name: authorName,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      recommendedProduct: newReviewProduct.trim() || undefined
    });
    setCustomerReviews(updated);
    setNewReviewComment('');
    setNewReviewProduct('');
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewFormOpen(false);
    }, 2000);
  };

  // Orders management handlers
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const now = Date.now();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: nextStatus,
          statusUpdatedAt: now,
          liveProgress:
            nextStatus === 'Confirmado'
              ? 5
              : nextStatus === 'Em separação'
              ? 25
              : nextStatus === 'A caminho'
              ? 45
              : nextStatus === 'Entregue'
              ? 100
              : o.liveProgress,
          courier:
            nextStatus === 'A caminho' || nextStatus === 'Entregue'
              ? o.courier || {
                  name: 'Carlos Eduardo da Silva',
                  phone: '(11) 98765-4321',
                  vehicle: 'Honda CG 160 Fan - Vermelha',
                  plate: 'BRA-4F29',
                  rating: 4.9,
                  photo: ''
                }
              : o.courier
        };
      })
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelado' as OrderStatus } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Keep trackingOrder synchronized in real time with orders array
  useEffect(() => {
    if (!trackingOrder) return;
    const current = orders.find((o) => o.id === trackingOrder.id);
    if (current) {
      setTrackingOrder(current);
    }
  }, [orders, trackingOrder?.id]);

  // Find most recent active order for floating banner
  const mostRecentActiveOrder = useMemo(() => {
    return (
      orders.find(
        (o) => o.status === 'Confirmado' || o.status === 'Em separação' || o.status === 'A caminho'
      ) || null
    );
  }, [orders]);

  // Toggle favorite without any toast notification (as requested by user)
  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const isFav = !prev[productId];
      return { ...prev, [productId]: isFav };
    });
  };

  // Nav switcher
  const handleNavClick = (nav: 'inicio' | 'cardapio' | 'favoritos' | 'pedidos' | 'conta') => {
    setActiveNav(nav);
    setActiveSheet(null);
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToCategory = (chipId: string) => {
    setActiveNav('cardapio');
    setActiveChip(chipId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Por favor, escolha um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('A foto selecionada é muito grande. Escolha uma foto de até 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLoginAvatar(dataUrl);
      if (user) {
        setUser((prev) => (prev ? { ...prev, avatar: dataUrl } : prev));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarFile(file);
    }
    e.target.value = '';
  };

  const handleRemoveAvatar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLoginAvatar('');
    if (user) {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        delete updated.avatar;
        return updated;
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsEditingProfile(false);
    setLoginName('');
    setLoginPhone('');
    setLoginEmail('');
    setLoginCep('');
    setLoginStreet('');
    setLoginNumber('');
    setLoginComplement('');
    setLoginNeighborhood('');
    setLoginAvatar('');
    setCheckoutCep('');
  };

  // Close sheet
  const closeSheet = () => {
    setActiveSheet(null);
    setCheckoutError(null);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(false);
    if (!loginName.trim()) {
      setProfileErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!loginPhone.trim()) {
      setProfileErrorMsg('Por favor, informe seu WhatsApp / telefone.');
      return;
    }
    const updatedUser: UserProfile = {
      name: loginName.trim(),
      phone: loginPhone.trim(),
      email: loginEmail.trim(),
      cep: loginCep.trim() || undefined,
      street: loginStreet.trim(),
      number: loginNumber.trim(),
      neighborhood: loginNeighborhood.trim(),
      complement: loginComplement.trim(),
      avatar: loginAvatar.trim() || undefined
    };
    setUser(updatedUser);
    setIsEditingProfile(false);
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  // Chip scroll
  const handleChipClick = (chipId: string) => {
    setActiveChip(chipId);
    if (chipId === 'all') {
      const el = document.getElementById('section-kit');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById(`section-${chipId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Share action (no toast notification)
  const handleShare = async () => {
    const shareData = {
      title: 'Mercado Fresco - Hortifruti por Encomenda',
      text: 'Faça seu pedido de hortifruti fresco, kits semanais e frutas picadas por encomenda!',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    await copyTextToClipboard(window.location.href);
  };

  // WhatsApp open
  const openWhatsApp = (customText?: string) => {
    const text = customText || 'Olá Mercado Fresco! Gostaria de tirar uma dúvida sobre as encomendas.';
    const url = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(text)}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Product detail sheet open
  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setProductNotes('');
    setProductQty(getItemQty(product.id) || 1);
    setActiveSheet('product_detail');
  };

  // Checkout handling
  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      return;
    }
    if (cartSubtotal < MIN_ORDER_THRESHOLD) {
      return;
    }
    setIsCartOpen(false);
    setActiveSheet('checkout');
    setCheckoutError(null);
    setPhoneTouched(false);

    // Auto-fill from user profile
    if (user) {
      if (!checkoutName && user.name) setCheckoutName(user.name);
      if (!checkoutPhone && user.phone) setCheckoutPhone(formatBrazilianPhone(user.phone));
      if (!checkoutCep && user.cep) setCheckoutCep(user.cep);
      if (!checkoutStreet && user.street) setCheckoutStreet(user.street);
      if (!checkoutNumber && user.number) setCheckoutNumber(user.number);
      if (!checkoutNeighborhood && user.neighborhood) setCheckoutNeighborhood(user.neighborhood);
      if (!checkoutComplement && user.complement) setCheckoutComplement(user.complement);
    }
  };

  // Reorder handling (no toast notification)
  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      const fullProd = catalogSections.flatMap((s) => s.items).find((p) => p.id === item.id) || {
        id: item.id,
        name: item.name,
        price: item.price,
        weight: 'variado',
        desc: 'Produto selecionado do pedido anterior',
        icon: item.icon,
        category: 'Favoritos'
      };
      addToCart(fullProd, item.qty, item.notes);
    });
    setActiveSheet(null);
    setIsCartOpen(true);
  };

  // Confirm order execution (strict Brazilian phone validation & authentic order payload)
  const handleConfirmOrder = (sendWhatsApp: boolean) => {
    setCheckoutError(null);
    if (!checkoutName.trim()) {
      setCheckoutError('Por favor, informe seu nome completo.');
      return;
    }

    if (!checkoutPhone.trim()) {
      setPhoneTouched(true);
      setCheckoutError('Por favor, informe seu telefone / WhatsApp com DDD.');
      phoneInputRef.current?.focus();
      return;
    }

    const phoneVal = validateBrazilianPhone(checkoutPhone);
    if (!phoneVal.isValid) {
      setPhoneTouched(true);
      setCheckoutError(phoneVal.errorMessage || 'Número de telefone inválido. Verifique o DDD e os dígitos.');
      phoneInputRef.current?.focus();
      return;
    }

    if (!checkoutStreet.trim() || !checkoutNumber.trim()) {
      setCheckoutError('Por favor, informe a rua e o número da entrega.');
      return;
    }

    const orderId = 'MF-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    const timestampNow = Date.now();
    const newOrder: Order = {
      id: orderId,
      date: formattedDate,
      createdAtTimestamp: timestampNow,
      statusUpdatedAt: timestampNow,
      deliveryCode: orderId.slice(-4),
      liveProgress: 5,
      courier: {
        name: 'Carlos Eduardo da Silva',
        phone: '(11) 98765-4321',
        vehicle: 'Honda CG 160 Fan - Vermelha',
        plate: 'BRA-4F29',
        rating: 4.9,
        photo: ''
      },
      items: cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        qty: i.qty,
        icon: i.product.icon,
        image: i.product.image,
        notes: i.notes
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      discount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: appliedCoupon?.code,
      total: finalCartTotal,
      status: 'Confirmado',
      paymentMethod: checkoutPayment,
      changeFor: checkoutPayment === 'cash' ? checkoutChange : undefined,
      customerName: checkoutName,
      customerPhone: phoneVal.formatted,
      deliveryAddress: `${checkoutStreet}, ${checkoutNumber} - ${checkoutNeighborhood || 'Centro'}${
        checkoutComplement ? ` (${checkoutComplement})` : ''
      }${checkoutCep ? ` • CEP: ${checkoutCep}` : ''}`,
      deliveryDate: checkoutSchedule.startsWith('Hoje') ? 'Hoje' : 'Amanhã',
      deliveryPeriod: checkoutSchedule,
      notes: checkoutNotes
    };

    setOrders((prev) => [newOrder, ...prev]);
    void saveOrderToCloud(newOrder).catch(() => {});

    setUser({
      name: checkoutName,
      email: user?.email || '',
      phone: phoneVal.formatted,
      cep: checkoutCep || user?.cep || '',
      street: checkoutStreet,
      number: checkoutNumber,
      neighborhood: checkoutNeighborhood,
      complement: checkoutComplement
    });

    setCart([]);
    setAppliedCoupon(null);
    setShowClearCartConfirm(false);
    setCouponInput('');
    setLastConfirmedOrder(newOrder);

    if (sendWhatsApp) {
      const itemsText = newOrder.items
        .map((it) => `• ${it.qty}x ${it.name} (${formatCurrency(it.price * it.qty)})${it.notes ? ` [Obs: ${it.notes}]` : ''}`)
        .join('\n');
      const payText =
        checkoutPayment === 'pix'
          ? 'Pix Instantâneo'
          : checkoutPayment === 'card'
          ? `Cartão na Entrega (${checkoutCardType} - ${checkoutCardBrand})`
          : `Dinheiro${checkoutChange ? ` (Troco para ${checkoutChange})` : ' (Sem troco)'}`;
      const waMsg = `*Novo Pedido no Mercado Fresco!*\n*Pedido:* #${orderId}\n*Cliente:* ${checkoutName}\n*WhatsApp:* ${phoneVal.formatted}\n*Endereço:* ${newOrder.deliveryAddress}\n*Agendamento:* ${newOrder.deliveryDate} - ${newOrder.deliveryPeriod}\n\n*Itens:*\n${itemsText}\n\n*Subtotal:* ${formatCurrency(newOrder.subtotal)}${
        newOrder.discount ? `\n*Desconto (${newOrder.couponCode}):* -${formatCurrency(newOrder.discount)}` : ''
      }\n*Taxa de Entrega:* ${newOrder.deliveryFee === 0 ? 'Grátis' : formatCurrency(newOrder.deliveryFee)}\n*Total a Pagar:* ${formatCurrency(newOrder.total)}\n*Pagamento:* ${payText}${
        checkoutNotes ? `\n*Observações:* ${checkoutNotes}` : ''
      }`;
      openWhatsApp(waMsg);
    }
    setActiveSheet('order_success');
  };

  const featuredProducts = useMemo(() => {
    return catalogProducts.filter((p) => p.id === 'kit' || p.id === 'salada1' || p.id === 'salada2' || p.id === 'p:Manga Picada');
  }, [catalogProducts]);

  const favoriteCount = useMemo(() => {
    return Object.values(favorites).filter(Boolean).length;
  }, [favorites]);

  return (
    <div className={`app ${isDark ? 'dark' : ''}`} id="app" data-palette={paletteTheme}>
      {/* 1. Hero Strip (for secondary views) */}
      {activeNav !== 'inicio' && (
        <div className="hero" id="hero">
          <span className="hero-pill">PEDIDOS SOMENTE POR ENCOMENDA</span>
        </div>
      )}

      {/* VIEW: INÍCIO */}
      {activeNav === 'inicio' && (
        <div className="view-container view-motion-wrapper" key="view-inicio">
          {/* Cover Wrap with Logo and Share Button */}
          <div className="coverwrap" id="coverWrap">
            <div className="cover">
              <img
                src="/hortifruti-cover-banner.jpg"
                alt="Hortifruti"
                className="cover-banner-img"
                referrerPolicy="no-referrer"
              />
              <div className="top-actions">
                <button
                  type="button"
                  className="sharebtn"
                  onClick={() => setThemePreference(isDark ? 'light' : 'dark')}
                  aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                  title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button
                  type="button"
                  className="sharebtn"
                  id="shareBtn"
                  onClick={handleShare}
                  aria-label="Compartilhar"
                  title="Compartilhar"
                >
                  ↗
                </button>
              </div>
              <div className="cover-encomenda-text">
                PEDIDOS SOMENTE POR ENCOMENDA
              </div>
            </div>
            <div className="logo" id="storeLogo">
              <img
                src="/logo-hortifruti.jpg"
                alt="Mercado Fresco - Hortifruti"
                className="store-logo-img"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Store Head & Info */}
          <div className="storehead" id="storeHead">
            <h3>Mercado Fresco</h3>
            <small>Hortifruti fresco todo dia por encomenda</small>
          </div>

          <div className="storeinfo" id="storeInfo">
            <div className="statusrow">
              <span className="openbadge">Aberto!</span>
              <span className="hours">00:00 – 23:59</span>
              <button
                type="button"
                className="loginbtn"
                id="loginBtn"
                onClick={() => handleNavClick('conta')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span id="loginBtnText">{user ? user.name.split(' ')[0] : 'Minha Conta'}</span>
              </button>
            </div>

            <div className="inforow">
              <span>
                Entrega grátis acima de <b>R$ 165,00</b>
              </span>
              <span
                className="rating"
                id="ratingBtn"
                title="Ver avaliações dos clientes"
                onClick={() => setActiveSheet('reviews')}
              >
                <Star size={13} className="inline fill-amber-400 text-amber-400 mr-1" /> 4.8
              </span>
            </div>

            <div className="inforow2">
              <span>
                Pedido mínimo <b>R$ 40,00</b>
              </span>
            </div>

            <div className="wpprow" id="wppBtn" onClick={() => openWhatsApp()}>
              <span><MessageCircle size={15} className="inline mr-1" /> WhatsApp da Loja</span>
            </div>
          </div>

          {/* Notice Box */}
          <div className="notice" id="notice">
            <div className="notice-header">
              <Sparkles size={16} className="text-amber-300" />
              <span className="notice-title">Bem-vindo(a) ao Mercado Fresco!</span>
            </div>
            <div className="notice-recado">
              "Aqui a feira é feita para você: colhemos e separamos tudo fresquinho no dia da sua entrega."
            </div>
            <div className="notice-badges">
              <div className="notice-badge-item">
                <Package size={13} className="notice-badge-icon" />
                <span>Encomenda planejada</span>
              </div>
              <div className="notice-badge-item">
                <CheckCircle2 size={13} className="notice-badge-icon" />
                <span>Ponto ideal de maturação</span>
              </div>
            </div>
          </div>

          {/* Quick Categories Grid */}
          <div className="home-section">
            <div className="home-section-head">
              <div className="home-section-title">
                <ShoppingBag size={18} className="inline mr-1 theme-accent-icon" /> Categorias Rápidas
              </div>
              <button
                type="button"
                className="home-see-all"
                onClick={() => handleNavClick('cardapio')}
              >
                Ver todas →
              </button>
            </div>

            <div className="categories-grid">
              <div className="category-card" onClick={() => goToCategory('kit')}>
                <div className="category-card-icon">
                  <ShoppingBag size={28} className="theme-accent-icon" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="category-card-title">Kits de Frutas</div>
                  <div className="category-card-desc">Semanais e família</div>
                </div>
              </div>
              <div className="category-card" onClick={() => goToCategory('saladas')}>
                <div className="category-card-icon">
                  <Salad size={28} className="theme-accent-icon" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="category-card-title">Saladas Prontas</div>
                  <div className="category-card-desc">Frescas e higienizadas</div>
                </div>
              </div>
              <div className="category-card" onClick={() => goToCategory('frutas')}>
                <div className="category-card-icon">
                  <Apple size={28} className="text-amber-600" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="category-card-title">Frutas Picadas</div>
                  <div className="category-card-desc">Potes práticos</div>
                </div>
              </div>
              <div className="category-card" onClick={() => goToCategory('legumes')}>
                <div className="category-card-icon">
                  <Carrot size={28} className="text-orange-600" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="category-card-title">Verduras & Legumes</div>
                  <div className="category-card-desc">Colheita selecionada</div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured / Most Loved Products */}
          <div className="home-section">
            <div className="home-section-head">
              <div className="home-section-title">
                <Flame size={18} className="inline mr-1 text-orange-600" /> Mais Pedidos por Encomenda
              </div>
              <button
                type="button"
                className="home-see-all"
                onClick={() => handleNavClick('cardapio')}
              >
                Cardápio completo →
              </button>
            </div>

            <div className="products">
              {featuredProducts.map((item) => {
                const qty = getItemQty(item.id);
                const isFav = !!favorites[item.id];
                return (
                  <div
                    key={item.id}
                    className="card"
                    onClick={() => openProductDetail(item)}
                  >
                    <div
                      className="pic"
                      style={item.grad ? { background: item.grad, color: '#fff' } : undefined}
                    >
                      <button
                        type="button"
                        className={`heart ${isFav ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label="Favoritar"
                      >
                        <Heart size={15} fill={isFav ? '#e11d48' : 'none'} color={isFav ? '#e11d48' : '#64748b'} />
                      </button>
                      <ProductIcon item={item} size={40} />
                    </div>

                    <div className="info">
                      {item.tags && item.tags.length > 0 && (
                        <div className="tags">
                          {item.tags.map((t) => (
                            <span key={t} className={`tag ${t}`}>
                              {t === 'novo' ? 'Novidade!' : 'Destaque!'}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="name">{item.name}</div>
                      <div className="weight">{item.weight}</div>
                      <div className="desc">{item.desc}</div>
                      <div className="price">{formatCurrency(item.price)}</div>
                    </div>

                    <div className="action" onClick={(e) => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="add"
                          onClick={(e) => addToCart(item, 1, undefined, e)}
                          aria-label={`Adicionar ${item.name}`}
                        >
                          +
                        </button>
                      ) : (
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() => addToCart(item, -1)}
                            aria-label="Diminuir"
                          >
                            –
                          </button>
                          <span className="bump">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => addToCart(item, 1, undefined, e)}
                            aria-label="Aumentar"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="home-trust">
            <div className="home-trust-item">
              <div className="home-trust-icon">🌱</div>
              <div className="home-trust-title">100% Fresco</div>
              <div className="home-trust-desc">Colheita selecionada</div>
            </div>
            <div className="home-trust-item">
              <div className="home-trust-icon">🧺</div>
              <div className="home-trust-title">Seleção Manual</div>
              <div className="home-trust-desc">No ponto ideal</div>
            </div>
            <div className="home-trust-item">
              <div className="home-trust-icon">🚚</div>
              <div className="home-trust-title">Por Encomenda</div>
              <div className="home-trust-desc">Sem desperdício</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CARDÁPIO */}
      {activeNav === 'cardapio' && (
        <div className="view-motion-wrapper" key="view-cardapio">
          <CardapioView
            sections={catalogSections}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeChip={activeChip}
            handleChipClick={handleChipClick}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            getItemQty={getItemQty}
            addToCart={addToCart}
            openProductDetail={openProductDetail}
            isDark={isDark}
          />
        </div>
      )}

      {/* VIEW: FAVORITOS */}
      {activeNav === 'favoritos' && (
        <div className="view-motion-wrapper" key="view-favoritos">
          <FavoritosView
            allProducts={catalogProducts}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            getItemQty={getItemQty}
            addToCart={addToCart}
            openProductDetail={openProductDetail}
            onNavigateToCardapio={() => handleNavClick('cardapio')}
            onOpenCart={() => setIsCartOpen(true)}
            isDark={isDark}
          />
        </div>
      )}

      {/* VIEW: PEDIDOS */}
      {activeNav === 'pedidos' && (
        <div className="view-motion-wrapper" key="view-pedidos">
          <PedidosView
            orders={orders}
            onReorder={handleReorder}
            onNavigateToCardapio={() => handleNavClick('cardapio')}
            openWhatsApp={openWhatsApp}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onOpenTracking={(ord) => setTrackingOrder(ord)}
            isDark={isDark}
          />
        </div>
      )}

      {/* VIEW: CONTA */}
      {activeNav === 'conta' && (
        <div className="view-container view-motion-wrapper" key="view-conta">
          <div className="view-header">
            <div className="view-header-content">
              <h2 className="view-header-title">
                <User size={20} className="inline mr-1 theme-accent-icon" /> Minha Conta
              </h2>
              <div className="view-header-subtitle">Seus dados de entrega e preferências</div>
            </div>
          </div>

          {/* Theme Switch */}
          <div className="theme-discreet-card" id="themeDiscreetSwitch">
            <div className="theme-discreet-row">
              <div className="theme-discreet-left">
                <div className="theme-discreet-icon" aria-hidden="true">
                  {isDark ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="theme-discreet-meta">
                  <div className="theme-discreet-title">Modo de Cor</div>
                  <div className="theme-discreet-sub">
                    {themePreference === 'auto'
                      ? `Automático (${systemIsDark ? 'escuro' : 'claro'} pelo sistema)`
                      : themePreference === 'dark'
                      ? 'Tema Escuro'
                      : 'Tema Claro'}
                  </div>
                </div>
              </div>
              <div className="theme-segmented-pills">
                <button
                  type="button"
                  className={`theme-seg-btn ${themePreference === 'auto' ? 'active' : ''}`}
                  onClick={() => setThemePreference('auto')}
                  title="Automático: segue o sistema operacional"
                >
                  Auto
                </button>
                <button
                  type="button"
                  className={`theme-seg-btn ${themePreference === 'light' ? 'active' : ''}`}
                  onClick={() => setThemePreference('light')}
                  title="Tema Claro"
                >
                  Claro
                </button>
                <button
                  type="button"
                  className={`theme-seg-btn ${themePreference === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemePreference('dark')}
                  title="Tema Escuro"
                >
                  Escuro
                </button>
              </div>
            </div>

            {/* Palette Theme Selector */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                Estilo da Feira (Paleta de Cores)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                Personalize os tons de destaque e botões de todo o app
              </div>
              <div className="palette-selector-wrap">
                <button
                  type="button"
                  className={`palette-btn ${paletteTheme === 'esmeralda' ? 'active' : ''}`}
                  onClick={() => setPaletteTheme('esmeralda')}
                >
                  <span className="palette-color-dot" style={{ background: '#237637' }} />
                  Horta Fresca
                </button>
                <button
                  type="button"
                  className={`palette-btn ${paletteTheme === 'citrico' ? 'active' : ''}`}
                  onClick={() => setPaletteTheme('citrico')}
                >
                  <span className="palette-color-dot" style={{ background: '#ea580c' }} />
                  Cítrico
                </button>
                <button
                  type="button"
                  className={`palette-btn ${paletteTheme === 'silvestre' ? 'active' : ''}`}
                  onClick={() => setPaletteTheme('silvestre')}
                >
                  <span className="palette-color-dot" style={{ background: '#7e22ce' }} />
                  Silvestre
                </button>
              </div>
            </div>
          </div>

          {/* Hidden File Input for Avatar */}
          <input
            type="file"
            ref={avatarFileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          {user && !isEditingProfile ? (
            <div>
              <div className="account-profile-card">
                <div
                  className="account-avatar-wrapper"
                  onClick={() => avatarFileInputRef.current?.click()}
                  title="Toque para alterar sua foto de perfil"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleAvatarFile(file);
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="account-avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="account-avatar-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="account-avatar-badge" title="Alterar foto">
                    <Camera size={12} />
                  </div>
                </div>
                <div className="account-details">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div className="account-name-lg">{user.name}</div>
                    <button
                      type="button"
                      className="account-edit-inline-btn"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Pencil size={12} /> Editar
                    </button>
                  </div>
                  <div className="account-contact"><Phone size={14} className="inline mr-1 theme-accent-icon" /> {user.phone || 'Sem telefone'}</div>
                  {user.email && <div className="account-contact"><Mail size={14} className="inline mr-1 theme-accent-icon" /> {user.email}</div>}
                  {user.avatar && (
                    <button
                      type="button"
                      className="account-avatar-remove-btn"
                      onClick={handleRemoveAvatar}
                      title="Remover foto de perfil"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <div className="account-card-box">
                <div className="account-card-title">
                  <span><MapPin size={16} className="inline mr-1 theme-accent-icon" /> Endereço de Entrega</span>
                </div>
                {user.street ? (
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--ink)' }}>
                    <div style={{ fontWeight: 700 }}>
                      {user.street}, {user.number}
                      {user.complement ? ` • ${user.complement}` : ''}
                    </div>
                    <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                      {user.cep ? `CEP: ${user.cep} • ` : ''}Bairro: {user.neighborhood || 'Centro'}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                    Nenhum endereço cadastrado ainda.
                  </div>
                )}
              </div>

              {/* Quick Navigation Links */}
              <div className="account-nav-list">
                <button
                  type="button"
                  className="account-nav-btn"
                  onClick={() => handleNavClick('pedidos')}
                >
                  <div className="account-nav-left">
                    <Package size={17} className="inline mr-1 theme-accent-icon" />
                    <span>Histórico de Pedidos ({orders.length})</span>
                  </div>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  className="account-nav-btn"
                  onClick={() => handleNavClick('favoritos')}
                >
                  <div className="account-nav-left">
                    <Heart size={17} className="inline mr-1 fill-rose-500 text-rose-500" />
                    <span>Produtos Favoritos ({favoriteCount})</span>
                  </div>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  className="account-nav-btn"
                  onClick={() => openWhatsApp('Olá Mercado Fresco! Preciso de ajuda com meu cadastro.')}
                >
                  <div className="account-nav-left">
                    <MessageCircle size={17} className="inline mr-1 theme-accent-icon" />
                    <span>Atendimento pelo WhatsApp</span>
                  </div>
                  <span>→</span>
                </button>
              </div>

              <button
                type="button"
                className="account-logout-btn"
                onClick={handleLogout}
              >
                Sair da Minha Conta
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 12px' }}>
              <div className="account-card-box" style={{ margin: '0 0 14px' }}>
                <div className="account-card-title">
                  <span>{user ? 'Editar Meus Dados' : 'Dados para Entrega'}</span>
                  {user && (
                    <button
                      type="button"
                      className="account-edit-inline-btn"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {user
                    ? 'Atualize seu telefone e endereço de entrega.'
                    : 'Salve seus dados para agilizar seus pedidos de hortifruti por encomenda e acompanhar entregas.'}
                </div>

                {profileErrorMsg && (
                  <div style={{ color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                    {profileErrorMsg}
                  </div>
                )}
                {profileSuccessMsg && (
                  <div className="account-success-msg">
                    <Check size={16} className="theme-accent-icon" /> Dados salvos com sucesso!
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  {/* Photo picker in form */}
                  <div className="account-photo-card">
                    <div
                      className="account-avatar-wrapper"
                      onClick={() => avatarFileInputRef.current?.click()}
                      title="Toque para escolher foto"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleAvatarFile(file);
                      }}
                    >
                      {loginAvatar ? (
                        <img
                          src={loginAvatar}
                          alt="Foto"
                          className="account-avatar-img"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="account-avatar-lg">
                          {loginName ? loginName.charAt(0).toUpperCase() : <User size={22} />}
                        </div>
                      )}
                      <div className="account-avatar-badge" title="Escolher foto">
                        <Camera size={12} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Foto de Perfil</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        Toque no círculo ou selecione uma foto do dispositivo.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="account-edit-inline-btn"
                          onClick={() => avatarFileInputRef.current?.click()}
                        >
                          <Camera size={12} /> {loginAvatar ? 'Trocar Foto' : 'Adicionar Foto'}
                        </button>
                        {loginAvatar && (
                          <button
                            type="button"
                            className="account-avatar-remove-btn"
                            onClick={handleRemoveAvatar}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria da Silva"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Telefone / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>E-mail (opcional)</label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>CEP (busca automática de endereço)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={loginCep}
                        onChange={(e) => handleCepChange(e.target.value, 'profile')}
                      />
                      {loadingCepProfile && (
                        <div style={{ position: 'absolute', right: 12, top: 11, fontSize: '11px', color: 'var(--muted)' }}>
                          Buscando...
                        </div>
                      )}
                    </div>
                    {cepFeedbackProfile && (
                      <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px', fontWeight: 600 }}>
                        {cepFeedbackProfile}
                      </div>
                    )}
                  </div>
                  <div className="field">
                    <label>Rua / Avenida</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Flores"
                      value={loginStreet}
                      onChange={(e) => setLoginStreet(e.target.value)}
                    />
                  </div>
                  <div className="fieldrow">
                    <div className="field">
                      <label>Número</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={loginNumber}
                        onChange={(e) => setLoginNumber(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Complemento</label>
                      <input
                        type="text"
                        placeholder="Apto 42, Bloco B"
                        value={loginComplement}
                        onChange={(e) => setLoginComplement(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Bairro</label>
                    <input
                      type="text"
                      placeholder="Centro"
                      value={loginNeighborhood}
                      onChange={(e) => setLoginNeighborhood(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="submit" className="primarybtn" style={{ flex: 1 }}>
                      {user ? 'Salvar Alterações' : 'Salvar Dados e Continuar'}
                    </button>
                    {user && (
                      <button
                        type="button"
                        className="secondarybtn"
                        style={{ width: 'auto', marginTop: 0, padding: '0 16px' }}
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Bottom Navigation Dock with Sliding Indicator */}
      <div className="navwrap" id="navWrap">
        <div className="bottom" ref={navContainerRef}>
          <div className="navindicator" id="navIndicator" style={indicatorStyle} />
          <button
            ref={(el) => {
              navRefs.current['inicio'] = el;
            }}
            type="button"
            className={`nav ${activeNav === 'inicio' ? 'active' : ''}`}
            id="nav-inicio"
            onClick={() => handleNavClick('inicio')}
          >
            <Home size={20} />
            <span className="navlabel">Início</span>
          </button>
          <button
            ref={(el) => {
              navRefs.current['cardapio'] = el;
            }}
            type="button"
            className={`nav ${activeNav === 'cardapio' ? 'active' : ''}`}
            id="nav-cardapio"
            onClick={() => handleNavClick('cardapio')}
          >
            <BookOpen size={20} />
            <span className="navlabel">Cardápio</span>
          </button>
          <button
            ref={(el) => {
              navRefs.current['favoritos'] = el;
            }}
            type="button"
            className={`nav ${activeNav === 'favoritos' ? 'active' : ''}`}
            id="nav-favoritos"
            onClick={() => handleNavClick('favoritos')}
          >
            <Heart size={20} />
            <span className="navlabel">Favoritos</span>
          </button>
          <button
            ref={(el) => {
              navRefs.current['pedidos'] = el;
            }}
            type="button"
            className={`nav ${activeNav === 'pedidos' ? 'active' : ''}`}
            id="nav-pedidos"
            onClick={() => handleNavClick('pedidos')}
          >
            <Package size={20} />
            <span className="navlabel">Pedidos</span>
          </button>
          <button
            ref={(el) => {
              navRefs.current['conta'] = el;
            }}
            type="button"
            className={`nav ${activeNav === 'conta' ? 'active' : ''}`}
            id="nav-conta"
            onClick={() => handleNavClick('conta')}
          >
            <User size={20} />
            <span className="navlabel">Conta</span>
          </button>
          {/* Cart Dock Floating Button */}
          <button
            type="button"
            className={`cartdock ${dockBump ? 'dock-bump' : ''} ${totalCartCount === 0 ? 'cartdock-empty' : ''}`}
            id="cartDockBtn"
            onClick={() => setIsCartOpen(true)}
            aria-label="Abrir carrinho"
          >
            {dockRipple && <span className="dock-ripple" />}
            <ShoppingBag size={20} />
            <span className={`badge ${badgeBump ? 'bump' : ''}`} id="cartBadge">
              {totalCartCount}
            </span>
          </button>
        </div>
      </div>

      {/* 8. Cart Panel Overlay */}
      <div
        className={`overlay ${isCartOpen ? 'open' : ''}`}
        id="overlay"
        onClick={() => setIsCartOpen(false)}
      >
        <div className="cartpanel" id="cartPanel" onClick={(e) => e.stopPropagation()}>
          <div className="cartpanel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Meu Carrinho</h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  id="clearCartBtn"
                  onClick={() => setShowClearCartConfirm((prev) => !prev)}
                  title="Esvaziar sacola"
                  style={{
                    background: 'var(--red-bg, rgba(239, 68, 68, 0.08))',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  <Trash2 size={13} /> Limpar
                </button>
              )}
            </div>
            <button
              type="button"
              className="closebtn"
              onClick={() => {
                setIsCartOpen(false);
                setShowClearCartConfirm(false);
              }}
              aria-label="Fechar carrinho"
            >
              <X size={18} />
            </button>
          </div>

          {/* In-app Clear Cart Confirmation Banner */}
          {showClearCartConfirm && cart.length > 0 && (
            <div
              style={{
                margin: '8px 14px 0',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--red-bg, rgba(239, 68, 68, 0.08))',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700, fontSize: '13px' }}>
                <Trash2 size={16} /> Deseja esvaziar sua sacola?
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.4 }}>
                Todos os itens e quantidades selecionadas serão removidos do carrinho.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowClearCartConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sim, Esvaziar
                </button>
              </div>
            </div>
          )}

          {/* Free shipping progress bar */}
          <div className="freebar-wrap">
            <div className="freebar">
              <i id="freebarfill" style={{ width: `${freeShippingPercent}%` }} />
            </div>
            <div className="freetext" id="freetext">
              {freeShippingMissing <= 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Truck size={15} /> Parabéns! Você ganhou frete grátis!
                </span>
              ) : (
                `Faltam ${formatCurrency(freeShippingMissing)} para frete grátis`
              )}
            </div>
          </div>

          {/* Items list */}
          <div className="cartlist" id="cartList">
            {cart.length === 0 ? (
              <div className="cartempty" id="cartEmpty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)', marginBottom: '3px' }}>
                    Sua sacola está vazia
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Que tal escolher frutas, legumes e verduras fresquinhas?
                  </div>
                </div>
                <button
                  type="button"
                  className="primarybtn"
                  style={{ width: 'auto', padding: '8px 18px', fontSize: '12.5px', marginTop: '4px' }}
                  onClick={() => {
                    setIsCartOpen(false);
                    handleNavClick('cardapio');
                  }}
                >
                  Explorar a Feira
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="cartitem">
                  <div className="ci-thumb">
                    <ProductIcon item={item.product} size={36} />
                  </div>
                  <div className="ci-name">
                    <div>{item.product.name}</div>
                    <div className="ci-price">{formatCurrency(item.product.price)} un.</div>
                    {item.notes && <div className="ci-notes">Obs: {item.notes}</div>}
                  </div>
                  <div className="ci-qty">
                    <button
                      type="button"
                      onClick={() => addToCart(item.product, -1)}
                      aria-label="Diminuir"
                    >
                      –
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(item.product, 1)}
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>
                  <div className="ci-sub">{formatCurrency(item.product.price * item.qty)}</div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    title="Remover produto"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      marginLeft: '2px'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 4px 2px' }}>
                <button
                  type="button"
                  id="clearCartBottomBtn"
                  onClick={() => setShowClearCartConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 6px'
                  }}
                >
                  <Trash2 size={12} /> Esvaziar sacola
                </button>
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="cartfoot">
              {/* Cupom de Desconto */}
              <div style={{ marginBottom: '12px', background: 'var(--chip-bg, #f1f5f9)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                  <Tag size={14} className="theme-accent-icon" /> Cupom de Desconto
                </div>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--green-pale)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--green)' }}>{appliedCoupon.code}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ink)', marginLeft: '6px' }}>
                        {appliedCoupon.type === 'fixed' && `(-${formatCurrency(appliedCoupon.value)})`}
                        {appliedCoupon.type === 'percent' && `(-${appliedCoupon.value}%)`}
                        {appliedCoupon.type === 'free_shipping' && '(Frete Grátis)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Ex: BEMVINDO10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon(couponInput);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          textTransform: 'uppercase',
                          background: 'var(--surface)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(couponInput)}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          background: 'var(--green)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                        {couponError}
                      </div>
                    )}
                    {couponSuccess && (
                      <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px', fontWeight: 600 }}>
                        {couponSuccess}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Detalhamento de Valores */}
              <div style={{ fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--muted)' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--green)', fontWeight: 600 }}>
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--muted)' }}>
                  <span>Taxa de Entrega</span>
                  <span style={{ color: deliveryFee === 0 ? 'var(--green)' : 'inherit', fontWeight: deliveryFee === 0 ? 600 : 400 }}>
                    {deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="totalrow">
                <span>Total a Pagar:</span>
                <span id="cartTotal">{formatCurrency(finalCartTotal)}</span>
              </div>
              {cartSubtotal < MIN_ORDER_THRESHOLD && (
                <div style={{ fontSize: '11px', color: '#b45309', marginBottom: '8px', textAlign: 'center' }}>
                  Pedido mínimo de {formatCurrency(MIN_ORDER_THRESHOLD)} (faltam {formatCurrency(MIN_ORDER_THRESHOLD - cartSubtotal)})
                </div>
              )}
              <button
                type="button"
                className="checkoutbtn"
                id="checkoutBtn"
                disabled={cartSubtotal < MIN_ORDER_THRESHOLD}
                style={{
                  opacity: cartSubtotal < MIN_ORDER_THRESHOLD ? 0.6 : 1,
                  cursor: cartSubtotal < MIN_ORDER_THRESHOLD ? 'not-allowed' : 'pointer'
                }}
                onClick={handleCheckoutClick}
              >
                Finalizar pedido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 9. Dynamic Bottom Sheet Overlay for All Modals */}
      <div
        className={`overlay ${activeSheet ? 'open' : ''}`}
        id="sheetOverlay"
        onClick={closeSheet}
      >
        <div
          className={`cartpanel ${activeSheet === 'product_detail' ? 'pd-panel-active' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* SHEET: CHECKOUT */}
          {activeSheet === 'checkout' && (
            <>
              <div className="cartpanel-head">
                <h3>Finalizar Encomenda</h3>
                <button
                  type="button"
                  className="closebtn"
                  onClick={closeSheet}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="cartlist" style={{ maxHeight: '70vh' }}>
                <div className="notice" style={{ margin: '0 0 12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} className="theme-accent-icon" />
                  <span>Pedidos preparados sob encomenda com hortifruti fresco.</span>
                </div>

                {checkoutError && (
                  <div style={{ color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                    {checkoutError}
                  </div>
                )}

                <div className="field">
                  <label>Seu Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                  />
                </div>
                <div className="field" id="checkoutPhoneField">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label htmlFor="checkoutPhoneInput" style={{ marginBottom: 0 }}>WhatsApp para confirmação *</label>
                    {phoneValidation.isValid && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                        {phoneValidation.info ? `${phoneValidation.info.state} (${phoneValidation.ddd})` : 'Válido'}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="checkoutPhoneInput"
                      ref={phoneInputRef}
                      type="tel"
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      value={checkoutPhone}
                      onFocus={() => setPhoneTouched(true)}
                      onBlur={() => setPhoneTouched(true)}
                      onChange={(e) => {
                        setCheckoutPhone(formatBrazilianPhone(e.target.value));
                        if (checkoutError && (checkoutError.toLowerCase().includes('telefone') || checkoutError.toLowerCase().includes('whatsapp') || checkoutError.toLowerCase().includes('ddd') || checkoutError.toLowerCase().includes('dígitos'))) {
                          setCheckoutError(null);
                        }
                      }}
                      style={{
                        paddingRight: '36px',
                        borderColor: (phoneTouched || checkoutError) && checkoutPhone.length > 0 && !phoneValidation.isValid
                          ? '#ef4444'
                          : phoneValidation.isValid
                          ? '#22c55e'
                          : undefined
                      }}
                    />
                    <div style={{ position: 'absolute', right: 10, top: 11, pointerEvents: 'none' }}>
                      {phoneValidation.isValid ? (
                        <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                      ) : (phoneTouched || checkoutError) && checkoutPhone.length > 0 ? (
                        <AlertCircle size={16} style={{ color: '#ef4444' }} />
                      ) : (
                        <Phone size={15} style={{ color: 'var(--muted)', opacity: 0.6 }} />
                      )}
                    </div>
                  </div>

                  {/* Real-time Inline Feedback */}
                  {checkoutPhone.length > 0 && !phoneValidation.isValid && (phoneTouched || checkoutError) && (
                    <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', lineHeight: 1.3 }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{phoneValidation.errorMessage}</span>
                    </div>
                  )}

                  {phoneValidation.isValid && (
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                      <span>{phoneValidation.type === 'celular' ? 'Celular válido para WhatsApp' : 'Telefone fixo válido'} • {phoneValidation.info?.region}</span>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>CEP (preenchimento automático)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="00000-000"
                      maxLength={9}
                      value={checkoutCep}
                      onChange={(e) => handleCepChange(e.target.value, 'checkout')}
                    />
                    {loadingCepCheckout && (
                      <div style={{ position: 'absolute', right: 12, top: 11, fontSize: '11px', color: 'var(--muted)' }}>
                        Buscando...
                      </div>
                    )}
                  </div>
                  {cepFeedbackCheckout && (
                    <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px', fontWeight: 600 }}>
                      {cepFeedbackCheckout}
                    </div>
                  )}
                </div>
                <div className="fieldrow">
                  <div className="field">
                    <label>Rua / Avenida *</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Flores"
                      value={checkoutStreet}
                      onChange={(e) => setCheckoutStreet(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Número *</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={checkoutNumber}
                      onChange={(e) => setCheckoutNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="fieldrow">
                  <div className="field">
                    <label>Bairro *</label>
                    <input
                      type="text"
                      placeholder="Ex: Jardins"
                      value={checkoutNeighborhood}
                      onChange={(e) => setCheckoutNeighborhood(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto 42"
                      value={checkoutComplement}
                      onChange={(e) => setCheckoutComplement(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Agendamento da Entrega *</label>
                  <select
                    value={checkoutSchedule}
                    onChange={(e: any) => setCheckoutSchedule(e.target.value)}
                  >
                    <option value="Hoje (Expressa 60-90 min)">Hoje - Entrega Expressa (60 a 90 min)</option>
                    <option value="Manhã (08h-12h)">Amanhã - Manhã (08h às 12h)</option>
                    <option value="Tarde (13h-17h)">Amanhã - Tarde (13h às 17h)</option>
                    <option value="Noite (17h-20h)">Amanhã - Noite (17h às 20h)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Forma de Pagamento *</label>
                  <div className="paymethods">
                    <button
                      type="button"
                      className={`paybtn ${checkoutPayment === 'pix' ? 'active' : ''}`}
                      onClick={() => setCheckoutPayment('pix')}
                    >
                      <QrCode size={15} className="inline mr-1" /> Pix
                    </button>
                    <button
                      type="button"
                      className={`paybtn ${checkoutPayment === 'card' ? 'active' : ''}`}
                      onClick={() => setCheckoutPayment('card')}
                    >
                      <CreditCard size={15} className="inline mr-1" /> Cartão
                    </button>
                    <button
                      type="button"
                      className={`paybtn ${checkoutPayment === 'cash' ? 'active' : ''}`}
                      onClick={() => setCheckoutPayment('cash')}
                    >
                      <Banknote size={15} className="inline mr-1" /> Dinheiro
                    </button>
                  </div>
                </div>

                {checkoutPayment === 'pix' && (
                  <div className="pixbox">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <QrCode size={16} className="theme-accent-icon" />
                        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Pix Instantâneo (Banco Central)</span>
                      </div>
                      <span style={{ fontSize: '10.5px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Aprovação Imediata
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 10px' }}>
                      <img
                        src={getPixQrCodeImageUrl(generatePixPayload(finalCartTotal, 'CHECKOUT', DEFAULT_PIX_PHONE_KEY))}
                        alt="QR Code Pix"
                        style={{
                          width: '130px',
                          height: '130px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: '#ffffff',
                          padding: '4px'
                        }}
                      />
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '4px' }}>
                        Aponte a câmera no app do seu banco
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '8px', textAlign: 'center' }}>
                      Chave Pix (Celular): <b style={{ color: 'var(--ink)' }}>{formatBrazilianPhone(DEFAULT_PIX_PHONE_KEY)}</b>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="primarybtn"
                        style={{ flex: 1, padding: '7px 12px', fontSize: '11.5px', marginTop: 0 }}
                        onClick={() => handleCopyPixCode(finalCartTotal)}
                      >
                        {copiedPixCode ? <><Check size={13} className="inline mr-1" /> Código Copiado!</> : 'Copiar Código Pix'}
                      </button>
                      <button
                        type="button"
                        className="secondarybtn"
                        style={{ flex: 1, padding: '7px 12px', fontSize: '11.5px', marginTop: 0 }}
                        onClick={handleCopyPixKey}
                      >
                        {copiedPixKey ? <><Check size={13} className="inline mr-1" /> Chave Copiada!</> : 'Copiar Chave Celular'}
                      </button>
                    </div>
                  </div>
                )}

                {checkoutPayment === 'card' && (
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Tipo de Cartão na Entrega:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {(['Crédito', 'Débito', 'Vale-Alimentação / Refeição'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCheckoutCardType(type)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: checkoutCardType === type ? 700 : 500,
                            borderRadius: '6px',
                            border: checkoutCardType === type ? '1.5px solid var(--primary-green)' : '1px solid var(--border)',
                            background: checkoutCardType === type ? 'var(--green-pale)' : 'var(--surface)',
                            color: checkoutCardType === type ? 'var(--primary-green)' : 'var(--ink)',
                            cursor: 'pointer'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                      Bandeira:
                    </div>
                    <select
                      value={checkoutCardBrand}
                      onChange={(e) => setCheckoutCardBrand(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                    >
                      <option value="Mastercard / Visa">Mastercard / Visa</option>
                      <option value="Elo">Elo</option>
                      <option value="Hipercard">Hipercard</option>
                      <option value="Alelo (Refeição / Alimentação)">Alelo (Refeição / Alimentação)</option>
                      <option value="Sodexo / Pluxee">Sodexo / Pluxee</option>
                      <option value="VR Benefícios">VR Benefícios</option>
                      <option value="Ticket Restaurante / Alimentação">Ticket Restaurante / Alimentação</option>
                    </select>

                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '6px' }}>
                      O entregador levará a máquina com aproximação (NFC) correspondente à sua bandeira.
                    </div>
                  </div>
                )}

                {checkoutPayment === 'cash' && (
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px', display: 'block' }}>
                      Precisa de troco?
                    </label>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {['Não preciso', 'Troco p/ R$ 50', 'Troco p/ R$ 100', 'Troco p/ R$ 200'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCheckoutChange(opt === 'Não preciso' ? '' : opt.replace('Troco p/ ', ''))}
                          style={{
                            padding: '5px 8px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--ink)',
                            cursor: 'pointer'
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Ou digite o valor: Ex: R$ 150,00"
                      value={checkoutChange}
                      onChange={(e) => setCheckoutChange(e.target.value)}
                    />
                  </div>
                )}

                <div className="field">
                  <label>Observações do Pedido (Opcional)</label>
                  <textarea
                    placeholder="Ex: Tocar o interfone 2x, deixar na portaria se ausente..."
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="cartfoot">
                <div style={{ fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--muted)' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--green)', fontWeight: 600 }}>
                      <span>Desconto ({appliedCoupon?.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--muted)' }}>
                    <span>Taxa de Entrega</span>
                    <span style={{ color: deliveryFee === 0 ? 'var(--green)' : 'inherit', fontWeight: deliveryFee === 0 ? 600 : 400 }}>
                      {deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                </div>
                <div className="totalrow">
                  <span>Total da Encomenda:</span>
                  <span>{formatCurrency(finalCartTotal)}</span>
                </div>
                <button
                  type="button"
                  className="primarybtn"
                  onClick={() => handleConfirmOrder(true)}
                  style={{ background: '#25D366', color: '#fff', marginBottom: '8px' }}
                >
                  <MessageCircle size={18} className="inline mr-1" /> Enviar Pedido via WhatsApp
                </button>
                <button
                  type="button"
                  className="primarybtn"
                  onClick={() => handleConfirmOrder(false)}
                >
                  Confirmar no Aplicativo
                </button>
              </div>
            </>
          )}

          {/* SHEET: ORDER SUCCESS */}
          {activeSheet === 'order_success' && (
            <>
              <div className="cartpanel-head">
                <h3>Pedido Confirmado!</h3>
                <button
                  type="button"
                  className="closebtn"
                  onClick={closeSheet}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="cartlist" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <CheckCircle2 size={48} className="theme-accent-icon" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: '6px' }}>
                  Pedido #{lastConfirmedOrder?.id} Realizado!
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '18px' }}>
                  Sua encomenda foi recebida com sucesso. Separamos cada item fresco com máximo carinho para entrega em:
                  <br />
                  <b style={{ color: 'var(--ink)' }}>{lastConfirmedOrder?.deliveryDate} - {lastConfirmedOrder?.deliveryPeriod}</b>
                </div>
                <div className="accountcard" style={{ textAlign: 'left', margin: '0 0 16px' }}>
                  <div style={{ fontSize: '12px', width: '100%' }}>
                    <div><b>Entregar em:</b> {lastConfirmedOrder?.deliveryAddress}</div>
                    <div style={{ marginTop: '4px' }}><b>Total:</b> {formatCurrency(lastConfirmedOrder?.total || 0)}</div>
                    <div style={{ marginTop: '4px' }}>
                      <b>Pagamento:</b> {lastConfirmedOrder?.paymentMethod === 'pix' ? 'Pix Instantâneo' : lastConfirmedOrder?.paymentMethod === 'card' ? 'Cartão na Entrega' : 'Dinheiro'}
                      {lastConfirmedOrder?.changeFor ? ` (Troco para ${lastConfirmedOrder.changeFor})` : ''}
                    </div>
                  </div>
                </div>

                {lastConfirmedOrder?.paymentMethod === 'pix' && (
                  <div className="pixbox" style={{ margin: '0 0 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <QrCode size={16} className="theme-accent-icon" /> Pagamento Instantâneo via Pix
                    </div>
                    <img
                      src={getPixQrCodeImageUrl(generatePixPayload(lastConfirmedOrder.total, lastConfirmedOrder.id, DEFAULT_PIX_PHONE_KEY))}
                      alt="QR Code Pix"
                      style={{
                        width: '130px',
                        height: '130px',
                        margin: '0 auto 8px',
                        display: 'block',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: '#ffffff',
                        padding: '4px'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                      Chave Pix: <b style={{ color: 'var(--ink)' }}>{formatBrazilianPhone(DEFAULT_PIX_PHONE_KEY)}</b>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="primarybtn"
                        style={{ flex: 1, padding: '8px 10px', fontSize: '11.5px', marginTop: 0 }}
                        onClick={() => handleCopyPixCode(lastConfirmedOrder.total, lastConfirmedOrder.id)}
                      >
                        {copiedPixCode ? <><Check size={13} className="inline mr-1" /> Copiado!</> : 'Copiar Código Pix'}
                      </button>
                      <button
                        type="button"
                        className="secondarybtn"
                        style={{ flex: 1, padding: '8px 10px', fontSize: '11.5px', marginTop: 0 }}
                        onClick={handleCopyPixKey}
                      >
                        {copiedPixKey ? <><Check size={13} className="inline mr-1" /> Copiada!</> : 'Copiar Chave Pix'}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="primarybtn"
                  style={{
                    background: 'var(--orange-dark)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}
                  onClick={() => {
                    closeSheet();
                    if (lastConfirmedOrder) {
                      setTrackingOrder(lastConfirmedOrder);
                    }
                  }}
                >
                  <Bike size={18} /> Acompanhar Entrega ao Vivo no Mapa
                </button>
                <button
                  type="button"
                  className="primarybtn"
                  onClick={() => {
                    closeSheet();
                    handleNavClick('pedidos');
                  }}
                >
                  Ver em Meus Pedidos
                </button>
                <button
                  type="button"
                  className="secondarybtn"
                  onClick={() => {
                    closeSheet();
                    handleNavClick('cardapio');
                  }}
                >
                  Voltar ao Cardápio
                </button>
              </div>
            </>
          )}

          {/* SHEET: REVIEWS */}
          {activeSheet === 'reviews' && (
            <>
              <div className="cartpanel-head">
                <h3>Avaliações dos Clientes</h3>
                <button
                  type="button"
                  className="closebtn"
                  onClick={closeSheet}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="cartlist">
                <div style={{ textAlign: 'center', padding: '10px 0 14px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Star size={28} className="fill-amber-400 text-amber-400 inline" />
                    {customerReviews.length > 0
                      ? (customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length).toFixed(1)
                      : '5.0'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Baseado em {customerReviews.length} avaliações de clientes verificados
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Check size={14} className="theme-accent-icon inline" /> 98% de satisfação com entrega e frescor
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="secondarybtn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '6px 14px', fontSize: '12px', margin: '0 auto' }}
                      onClick={() => setReviewFormOpen(!reviewFormOpen)}
                    >
                      <Star size={14} className="theme-accent-icon" />
                      {reviewFormOpen ? 'Fechar Formulário' : 'Escrever Minha Avaliação'}
                    </button>
                  </div>
                </div>

                {reviewFormOpen && (
                  <form
                    onSubmit={handleAddReview}
                    style={{
                      background: 'var(--chip-bg, #f1f5f9)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '14px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                      Deixe sua opinião
                    </div>
                    <div className="field">
                      <label>Sua Nota</label>
                      <div style={{ display: 'flex', gap: '6px', padding: '4px 0' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewReviewRating(s)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Star
                              size={22}
                              className={s <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <label>Seu Nome *</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos M."
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Produto ou Categoria (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Salada de Frutas, Hortifruti da semana..."
                        value={newReviewProduct}
                        onChange={(e) => setNewReviewProduct(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Seu Comentário *</label>
                      <textarea
                        placeholder="Conte como foi sua experiência com os produtos frescos e entrega..."
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="primarybtn"
                      style={{ marginTop: '6px', width: '100%' }}
                    >
                      Publicar Avaliação
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customerReviews.map((rev) => (
                    <div key={rev.id} className="ordercard">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{rev.name}</span>
                          {rev.verified && (
                            <span style={{ fontSize: '10px', background: 'var(--green-pale)', color: 'var(--green)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Compra Verificada
                            </span>
                          )}
                        </div>
                        <span style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      </div>
                      {rev.recommendedProduct && (
                        <div style={{ fontSize: '11px', color: 'var(--orange-dark)', fontWeight: 600, marginTop: '2px' }}>
                          Sobre: {rev.recommendedProduct}
                        </div>
                      )}
                      <div style={{ fontSize: '11.5px', color: 'var(--ink)', marginTop: '4px', lineHeight: 1.4 }}>
                        "{rev.comment}"
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                        {rev.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SHEET: PRODUCT DETAIL */}
          {activeSheet === 'product_detail' && selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              isOpen={true}
              isFavorite={Boolean(favorites[selectedProduct.id])}
              initialQty={productQty}
              initialNotes={productNotes}
              onClose={closeSheet}
              onToggleFavorite={toggleFavorite}
              onAddToCart={(prod, qty, notes, e) => {
                addToCart(prod, qty, notes, e, true);
              }}
            />
          )}
        </div>
      </div>

      {/* Floating iFood-style active order tracking card */}
      <ActiveOrderFloatingBanner
        order={mostRecentActiveOrder}
        onOpenTracking={(ord) => setTrackingOrder(ord)}
        isVisible={Boolean(mostRecentActiveOrder && activeNav !== 'pedidos' && !isCartOpen && !activeSheet)}
      />

      {/* Interactive Map Live Tracking Modal */}
      {trackingOrder && (
        <LiveOrderTrackingModal
          order={trackingOrder}
          isOpen={Boolean(trackingOrder)}
          onClose={() => setTrackingOrder(null)}
          isDark={isDark}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* Flying particles to cart */}
      <AnimatePresence>
        {flyingParticles.map((p) => {
          const midX = (p.startX + p.targetX) / 2 + (p.startX > p.targetX ? 35 : -35);
          const midY = Math.min(p.startY, p.targetY) - 85;

          return (
            <motion.div
              key={p.id}
              className="flying-particle"
              initial={{
                left: p.startX,
                top: p.startY,
                x: '-50%',
                y: '-50%',
                scale: 0.6,
                opacity: 0.95,
                rotate: 0,
              }}
              animate={{
                left: [p.startX, midX, p.targetX],
                top: [p.startY, midY, p.targetY],
                scale: [0.6, 1.25, 0.28],
                opacity: [0.95, 1, 0.9, 0],
                rotate: [0, -18, 14, 0],
              }}
              transition={{
                duration: 0.65,
                times: [0, 0.45, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => handleParticleArrival(p.id)}
            >
              {p.image ? (
                <img src={p.image} alt={p.name} referrerPolicy="no-referrer" />
              ) : (
                <span>{p.icon}</span>
              )}
              <span className="flying-particle-plus">+1</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default App;
