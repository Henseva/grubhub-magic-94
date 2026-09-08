import React, { useState } from 'react';
import {
  X,
  Heart,
  Sparkles,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Scale,
  Leaf,
  Info
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../data/products';
import { ProductIcon } from './ProductIcon';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  isFavorite: boolean;
  initialQty: number;
  initialNotes?: string;
  onClose: () => void;
  onToggleFavorite: (productId: string, e?: React.MouseEvent) => void;
  onAddToCart: (product: Product, qty: number, notes?: string, event?: React.MouseEvent) => void;
}

const MATURATION_OPTIONS = [
  { id: 'verde', label: 'Mais verde', hint: 'Para amadurecer na semana' },
  { id: 'ponto', label: 'No ponto', hint: 'Pronto para consumo hoje' },
  { id: 'maduro', label: 'Bem maduro', hint: 'Macio, ideal p/ sucos' }
];

const QUICK_OBS = [
  'Sem machucados',
  'Tamanho médio',
  'Mais firme',
  'Fruta bem doce',
  'Folhas bem frescas'
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  isFavorite,
  initialQty,
  initialNotes = '',
  onClose,
  onToggleFavorite,
  onAddToCart
}) => {
  const [qty, setQty] = useState(initialQty || 1);
  const [selectedMaturation, setSelectedMaturation] = useState<string>('ponto');
  const [selectedQuickObs, setSelectedQuickObs] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState(initialNotes);

  if (!isOpen) return null;

  const toggleQuickObs = (obs: string) => {
    setSelectedQuickObs((prev) =>
      prev.includes(obs) ? prev.filter((o) => o !== obs) : [...prev, obs]
    );
  };

  const handleConfirmAdd = (e: React.MouseEvent) => {
    const parts: string[] = [];
    if (selectedMaturation) {
      const mat = MATURATION_OPTIONS.find((m) => m.id === selectedMaturation);
      if (mat) parts.push(`Maturação: ${mat.label}`);
    }
    if (selectedQuickObs.length > 0) {
      parts.push(selectedQuickObs.join(', '));
    }
    if (customNotes.trim()) {
      parts.push(customNotes.trim());
    }

    const finalNotes = parts.join(' • ');
    onAddToCart(product, qty, finalNotes, e);
    onClose();
  };

  const totalPrice = product.price * qty;

  return (
    <div className="product-detail-container">
      {/* Top action buttons over banner */}
      <div className="pd-topbar">
        <button
          type="button"
          className={`pd-icon-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => onToggleFavorite(product.id, e)}
          aria-label="Favoritar"
        >
          <Heart
            size={18}
            fill={isFavorite ? '#e11d48' : 'none'}
            color={isFavorite ? '#e11d48' : '#475569'}
          />
        </button>

        <button
          type="button"
          className="pd-icon-btn close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Hero Product Visual Stage */}
      <div className="pd-hero-stage">
        <div
          className="pd-hero-box"
          style={product.grad && !product.image ? { background: product.grad } : undefined}
        >
          <ProductIcon item={product} size={88} className="text-white" />

          {/* Floating Badges */}
          <div className="pd-badges-cluster">
            {product.isOrganic && (
              <span className="pd-badge organic">
                <Leaf size={11} /> 100% Orgânico
              </span>
            )}
            {product.tags?.includes('promo') && (
              <span className="pd-badge promo">Oportunidade</span>
            )}
            {product.tags?.includes('novo') && (
              <span className="pd-badge novo">Safra Nova</span>
            )}
            <span className="pd-badge category">{product.category}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="pd-body-scroll">
        {/* Title & Price Header */}
        <div className="pd-title-row">
          <div>
            <h2 className="pd-product-name">{product.name}</h2>
            <div className="pd-meta-chips">
              <span className="pd-meta-pill">
                <Scale size={12} /> {product.weight}
              </span>
              <span className="pd-meta-pill">
                <Clock size={12} /> Colheita Fresca
              </span>
              {product.origin && (
                <span className="pd-meta-pill">
                  <Leaf size={12} /> {product.origin}
                </span>
              )}
            </div>
          </div>

          <div className="pd-price-display">
            <div className="pd-price-val">{formatCurrency(product.price)}</div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="pd-price-orig">{formatCurrency(product.originalPrice)}</div>
            )}
            <div className="pd-price-unit">{product.weight}</div>
          </div>
        </div>

        {/* Product Description */}
        {product.desc && (
          <p className="pd-description">{product.desc}</p>
        )}

        {/* Maturation Selection (Feira Touch) */}
        <div className="pd-section-card">
          <div className="pd-section-label">
            <span>Ponto de Maturação Desejado</span>
            <span className="pd-label-sub">Escolha como prefere receber</span>
          </div>
          <div className="pd-maturation-grid">
            {MATURATION_OPTIONS.map((opt) => {
              const active = selectedMaturation === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`pd-maturation-chip ${active ? 'active' : ''}`}
                  onClick={() => setSelectedMaturation(opt.id)}
                >
                  <div className="pd-mat-radio">
                    {active && <span className="pd-radio-inner" />}
                  </div>
                  <div className="pd-mat-info">
                    <span className="pd-mat-title">{opt.label}</span>
                    <span className="pd-mat-hint">{opt.hint}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Observation Chips */}
        <div className="pd-section-card">
          <div className="pd-section-label">
            <span>Preferências de Seleção</span>
            <span className="pd-label-sub">Toque para selecionar</span>
          </div>
          <div className="pd-quick-chips">
            {QUICK_OBS.map((obs) => {
              const selected = selectedQuickObs.includes(obs);
              return (
                <button
                  key={obs}
                  type="button"
                  className={`pd-quick-pill ${selected ? 'selected' : ''}`}
                  onClick={() => toggleQuickObs(obs)}
                >
                  {selected ? <Check size={13} className="pd-check-icon" /> : <Plus size={13} />}
                  <span>{obs}</span>
                </button>
              );
            })}
          </div>

          <div className="pd-custom-note-wrap">
            <input
              type="text"
              placeholder="Outra observação para o feirante (ex: embalar separado)..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="pd-note-input"
            />
          </div>
        </div>

        {/* Informative Cards (Nutritional & Storage) */}
        <div className="pd-tips-grid">
          {product.nutritionalTip && (
            <div className="pd-tip-box nutritional">
              <div className="pd-tip-icon">
                <Sparkles size={16} />
              </div>
              <div className="pd-tip-text">
                <span className="pd-tip-heading">Dica Nutricional</span>
                <p>{product.nutritionalTip}</p>
              </div>
            </div>
          )}

          {product.storageTip && (
            <div className="pd-tip-box storage">
              <div className="pd-tip-icon">
                <ShieldCheck size={16} />
              </div>
              <div className="pd-tip-text">
                <span className="pd-tip-heading">Como Conservar</span>
                <p>{product.storageTip}</p>
              </div>
            </div>
          )}

          <div className="pd-tip-box quality">
            <div className="pd-tip-icon">
              <Info size={16} />
            </div>
            <div className="pd-tip-text">
              <span className="pd-tip-heading">Garantia Mercado Fresco</span>
              <p>Selecionado manualmente na manhã do dia da sua entrega. Satisfação garantida.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pd-sticky-footer">
        <div className="pd-qty-selector">
          <button
            type="button"
            className="pd-qty-btn"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Diminuir"
          >
            <Minus size={15} />
          </button>
          <span className="pd-qty-number">{qty}</span>
          <button
            type="button"
            className="pd-qty-btn"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Aumentar"
          >
            <Plus size={15} />
          </button>
        </div>

        <button
          type="button"
          className="pd-add-to-cart-btn"
          onClick={handleConfirmAdd}
        >
          <ShoppingBag size={18} />
          <span>Adicionar</span>
          <span className="pd-btn-separator">•</span>
          <span className="pd-btn-price">{formatCurrency(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
};
