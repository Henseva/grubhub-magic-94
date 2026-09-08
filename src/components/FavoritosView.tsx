import React, { useState, useMemo } from 'react';
import {
  Check,
  Flame,
  Heart,
  HeartOff,
  Leaf,
  Share2,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Truck
} from 'lucide-react';
import { ALL_PRODUCTS, FREE_SHIPPING_THRESHOLD, formatCurrency, STORE_PHONE } from '../data/products';
import { Product } from '../types';
import { ProductIcon } from './ProductIcon';
import { copyTextToClipboard } from '../utils/clipboard';

interface FavoritosViewProps {
  favorites: Record<string, boolean>;
  toggleFavorite: (productId: string, e?: React.MouseEvent) => void;
  getItemQty: (productId: string) => number;
  addToCart: (product: Product, delta: number, notes?: string, e?: React.MouseEvent) => void;
  openProductDetail: (product: Product) => void;
  onNavigateToCardapio: () => void;
  onOpenCart: () => void;
  isDark: boolean;
}

export const FavoritosView: React.FC<FavoritosViewProps> = ({
  favorites,
  toggleFavorite,
  getItemQty,
  addToCart,
  openProductDetail,
  onNavigateToCardapio,
  onOpenCart,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // List of favorite products
  const favoriteProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((p) => !!favorites[p.id]);
  }, [favorites]);

  // Total value of all favorites combined
  const favoritesTotalValue = useMemo(() => {
    return favoriteProducts.reduce((sum, p) => sum + p.price, 0);
  }, [favoriteProducts]);

  // Categories present in favorites
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    favoriteProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [favoriteProducts]);

  // Filtered favorite products
  const filteredFavorites = useMemo(() => {
    if (activeCategoryFilter === 'all') return favoriteProducts;
    return favoriteProducts.filter((p) => p.category === activeCategoryFilter);
  }, [favoriteProducts, activeCategoryFilter]);

  // Free shipping math
  const freeShippingMissing = Math.max(0, FREE_SHIPPING_THRESHOLD - favoritesTotalValue);
  const freeShippingPercent = Math.min(100, Math.round((favoritesTotalValue / FREE_SHIPPING_THRESHOLD) * 100));

  // Curated popular items for suggestions when list is empty or small
  const suggestedProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(
      (p) => !favorites[p.id] && (p.id === 'kit' || p.id === 'salada1' || p.id === 'p:Manga Picada' || p.id === 'p:Brocolis Higienizado')
    ).slice(0, 4);
  }, [favorites]);

  // Add all favorites to cart
  const handleAddAllToCart = (e?: React.MouseEvent) => {
    favoriteProducts.forEach((product) => {
      addToCart(product, 1, undefined, e);
    });
    onOpenCart();
  };

  // Share favorite list
  const handleShareFavorites = async () => {
    const textLines = [
      'Minha Lista de Favoritos - Mercado Fresco:',
      ...favoriteProducts.map((p) => `• ${p.name} (${formatCurrency(p.price)})`),
      `Total estimado: ${formatCurrency(favoritesTotalValue)}`,
      'Peça você também com entrega fresca!'
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Lista de Favoritos no Mercado Fresco',
          text: textLines,
          url: window.location.href
        });
        return;
      } catch {}
    }

    const ok = await copyTextToClipboard(textLines);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      const waUrl = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(textLines)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-header-content">
          <h2 className="view-header-title">
            <Heart size={22} className="inline-icon" fill="#e11d48" color="#e11d48" /> Meus Favoritos
          </h2>
          <div className="view-header-subtitle">
            Sua seleção pessoal para pedir hortifruti sempre fresco com 1 clique
          </div>
        </div>
        <div className="view-header-meta">
          <span className="view-badge">{favoriteProducts.length} salvos</span>
        </div>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="favorites-empty-wrapper">
          <div className="view-empty-state">
            <div className="view-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <HeartOff size={44} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <div className="view-empty-title">Sua lista de favoritos está vazia</div>
            <div className="view-empty-desc">
              Você ainda não favoritou nenhum item. Toque no coração em qualquer fruta, kit ou legume para montar sua feira recorrente!
            </div>
            <button
              type="button"
              className="view-empty-btn"
              onClick={onNavigateToCardapio}
            >
              Explorar o Cardápio Completo
            </button>
          </div>

          {/* Curated suggestions to start favoriting */}
          <div className="fav-suggestions-section">
            <div className="fav-suggestions-header">
              <div className="fav-suggestions-title">
                <Sparkles size={16} className="inline-icon text-amber-500" /> Mais Amados pelos Clientes
              </div>
              <span className="fav-suggestions-subtitle">Toque no coração para favoritar</span>
            </div>

            <div className="products">
              {suggestedProducts.map((item) => {
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
        </div>
      ) : (
        <>
          {/* Smart Basket Builder Summary Card */}
          <div className="favorites-summary-card">
            <div className="fav-summary-header">
              <div className="fav-summary-badge">
                <ShoppingBasket size={16} className="inline-icon theme-accent-icon" /> Minha Feira Semanal
              </div>
              <span className="fav-summary-count">{favoriteProducts.length} itens salvos</span>
            </div>

            <div className="fav-summary-metrics">
              <div>
                <span className="fav-metrics-label">Valor Total Estimado</span>
                <div className="fav-metrics-price">{formatCurrency(favoritesTotalValue)}</div>
              </div>
              <div className="fav-metrics-right">
                <span className="fav-free-tag">
                  {freeShippingMissing === 0 ? (
                    <>
                      <Truck size={13} className="inline-icon" /> Frete Grátis Ativado!
                    </>
                  ) : (
                    'Sob Encomenda'
                  )}
                </span>
              </div>
            </div>

            {/* Free Shipping Progress bar */}
            <div className="fav-shipping-progress">
              <div className="fav-progress-track">
                <div
                  className="fav-progress-fill"
                  style={{ width: `${freeShippingPercent}%` }}
                ></div>
              </div>
              <div className="fav-progress-label">
                {freeShippingMissing === 0 ? (
                  <span style={{ color: 'var(--primary-green-accent, var(--primary-green))', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} className="inline-icon" /> Sua lista de favoritos atinge o Frete Grátis (R$ {FREE_SHIPPING_THRESHOLD.toFixed(2)})!
                  </span>
                ) : (
                  <span>
                    Adicione mais <b>{formatCurrency(freeShippingMissing)}</b> para garantir Frete Grátis
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Add All to Cart & Share */}
            <div className="fav-summary-actions">
              <button
                type="button"
                className="fav-add-all-btn"
                onClick={handleAddAllToCart}
              >
                <ShoppingCart size={16} className="inline-icon" /> Adicionar Todos ao Carrinho ({formatCurrency(favoritesTotalValue)})
              </button>
              <button
                type="button"
                className="fav-share-btn"
                onClick={handleShareFavorites}
                title="Compartilhar lista de favoritos"
              >
                {copiedLink ? (
                  <>
                    <Check size={15} className="inline-icon" /> Copiado!
                  </>
                ) : (
                  <>
                    <Share2 size={15} className="inline-icon" /> Compartilhar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Internal Category Filter Chips */}
          {availableCategories.length > 1 && (
            <div className="fav-category-filter">
              <button
                type="button"
                className={`fav-cat-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter('all')}
              >
                Todos ({favoriteProducts.length})
              </button>
              {availableCategories.map((cat) => {
                const count = favoriteProducts.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`fav-cat-chip ${activeCategoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategoryFilter(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Products List */}
          <div className="products" style={{ padding: '8px 12px 24px' }}>
            {filteredFavorites.map((item) => {
              const qty = getItemQty(item.id);
              return (
                <div
                  key={item.id}
                  className={`card fav-card ${qty > 0 ? 'in-cart' : ''}`}
                  onClick={() => openProductDetail(item)}
                >
                  <div
                    className="pic"
                    style={item.grad ? { background: item.grad, color: '#fff' } : undefined}
                  >
                    <button
                      type="button"
                      className="heart active"
                      onClick={(e) => toggleFavorite(item.id, e)}
                      aria-label={`Remover ${item.name} dos favoritos`}
                      title="Remover dos favoritos"
                    >
                      <Heart size={15} fill="#e11d48" color="#e11d48" />
                    </button>
                    <ProductIcon item={item} size={40} />
                  </div>

                  <div className="info">
                    <div className="fav-card-meta-row">
                      <span className="fav-fresh-badge">
                        <Leaf size={12} className="inline-icon" /> Colheita garantida
                      </span>
                      {qty > 0 && <span className="tag-in-cart">{qty} no carrinho</span>}
                    </div>
                    <div className="name">{item.name}</div>
                    <div className="weight">{item.weight} • {item.category || 'Hortifruti'}</div>
                    <div className="desc">{item.desc}</div>
                    <div className="price-row">
                      <span className="price">{formatCurrency(item.price)}</span>
                    </div>
                  </div>

                  <div className="action" onClick={(e) => e.stopPropagation()}>
                    {qty === 0 ? (
                      <button
                        type="button"
                        className="add"
                        onClick={(e) => addToCart(item, 1, undefined, e)}
                        aria-label={`Adicionar ${item.name} ao carrinho`}
                        title="Adicionar ao carrinho"
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
        </>
      )}
    </div>
  );
};
