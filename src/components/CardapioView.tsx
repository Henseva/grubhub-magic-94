import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Flame,
  Heart,
  Salad,
  Search,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { SECTIONS, formatCurrency } from '../data/products';
import { Product } from '../types';
import { ProductIcon } from './ProductIcon';

interface CardapioViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeChip: string;
  handleChipClick: (chipId: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (productId: string, e?: React.MouseEvent) => void;
  getItemQty: (productId: string) => number;
  addToCart: (product: Product, delta: number, notes?: string, e?: React.MouseEvent) => void;
  openProductDetail: (product: Product) => void;
  isDark: boolean;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type FilterTag = 'all' | 'promos' | 'kits' | 'saladas' | 'frutas' | 'legumes';

export const CardapioView: React.FC<CardapioViewProps> = ({
  searchQuery,
  setSearchQuery,
  activeChip,
  handleChipClick,
  favorites,
  toggleFavorite,
  getItemQty,
  addToCart,
  openProductDetail,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('mf_cardapio_view_mode');
      if (saved === 'list' || saved === 'grid') return saved;
    } catch {}
    return 'list';
  });

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('mf_cardapio_view_mode', mode);
    } catch {}
  };
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [activeFilterTag, setActiveFilterTag] = useState<FilterTag>('all');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SECTIONS.forEach((sec) => {
      counts[sec.id] = sec.items.length;
    });
    return counts;
  }, []);

  // Filter sections and items
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return SECTIONS.map((sec) => {
      let items = sec.items.filter((it) => {
        const matchesQuery =
          !q ||
          it.name.toLowerCase().includes(q) ||
          it.desc.toLowerCase().includes(q) ||
          (it.category && it.category.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        // Tag filter
        if (activeFilterTag === 'promos') {
          return it.tags && (it.tags.includes('promo') || it.tags.includes('novo'));
        }
        if (activeFilterTag === 'kits') {
          return sec.id === 'kit';
        }
        if (activeFilterTag === 'saladas') {
          return sec.id === 'saladas';
        }
        if (activeFilterTag === 'frutas') {
          return sec.id === 'frutas';
        }
        if (activeFilterTag === 'legumes') {
          return sec.id === 'legumes' || sec.id === 'temperos';
        }

        return true;
      });

      // Sorting within sections
      if (sortBy === 'price-asc') {
        items = [...items].sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        items = [...items].sort((a, b) => b.price - a.price);
      } else if (sortBy === 'name-asc') {
        items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      }

      return {
        ...sec,
        items
      };
    }).filter((sec) => itemsMatchSection(sec, activeChip));
  }, [searchQuery, activeFilterTag, sortBy, activeChip]);

  function itemsMatchSection(sec: { id: string; items: Product[] }, currentChip: string) {
    if (sec.items.length === 0) return false;
    if (currentChip === 'all') return true;
    return sec.id === currentChip;
  }

  const totalFilteredCount = useMemo(() => {
    return filteredSections.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [filteredSections]);

  return (
    <div className="view-container">
      {/* View Header with title & badges */}
      <div className="view-header">
        <div className="view-header-content">
          <h2 className="view-header-title">
            <BookOpen size={20} className="inline-icon" strokeWidth={2} /> Cardápio & Encomendas
          </h2>
          <div className="view-header-subtitle">
            Hortifruti selecionado na madrugada e higienizado para você
          </div>
        </div>
        <div className="view-header-meta">
          <span className="view-badge">{totalFilteredCount} itens frescos</span>
        </div>
      </div>

      {/* Sticky Search + Chips Bar */}
      <div className="header" id="header">
        <div className="search">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            id="search"
            type="text"
            placeholder="Buscar por frutas, saladas, legumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar produtos no cardápio"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Categories Carousel */}
        <div className="chips" id="chips" role="tablist" aria-label="Categorias">
          <button
            type="button"
            className={`chip chip-todos ${activeChip === 'all' ? 'active' : ''}`}
            onClick={() => handleChipClick('all')}
            role="tab"
            aria-selected={activeChip === 'all'}
          >
            Todos ({SECTIONS.reduce((a, s) => a + s.items.length, 0)})
          </button>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`chip ${activeChip === sec.id ? 'active' : ''}`}
              onClick={() => handleChipClick(sec.id)}
              role="tab"
              aria-selected={activeChip === sec.id}
            >
              {sec.chip} <span className="chip-count">({categoryCounts[sec.id] || 0})</span>
            </button>
          ))}
        </div>

        {/* Secondary Toolbar: Filters, Sorting & View Toggle */}
        <div className="catalog-toolbar">
          <div className="catalog-filters-row">
            <div className="catalog-pills">
              <button
                type="button"
                className={`catalog-pill ${activeFilterTag === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('all')}
              >
                Geral
              </button>
              <button
                type="button"
                className={`catalog-pill ${activeFilterTag === 'promos' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('promos')}
              >
                <Flame size={13} className="inline-icon text-orange-500" /> Destaques
              </button>
              <button
                type="button"
                className={`catalog-pill ${activeFilterTag === 'kits' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('kits')}
              >
                <ShoppingBag size={13} className="inline-icon theme-accent-icon" /> Kits
              </button>
              <button
                type="button"
                className={`catalog-pill ${activeFilterTag === 'saladas' ? 'active' : ''}`}
                onClick={() => setActiveFilterTag('saladas')}
              >
                <Salad size={13} className="inline-icon theme-accent-icon" /> Saladas
              </button>
            </div>

            <div className="catalog-controls-right">
              {/* Sort selector */}
              <div className="catalog-sort-wrap">
                <label htmlFor="catalog-sort-select" className="sr-only">
                  Ordenar por
                </label>
                <select
                  id="catalog-sort-select"
                  className="catalog-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="default">Recomendados</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="name-asc">Nome (A–Z)</option>
                </select>
              </div>

              {/* View mode toggle (List vs Grid) */}
              <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleSetViewMode('list')}
                  title="Visualização em Lista"
                  aria-label="Visualização em Lista"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleSetViewMode('grid')}
                  title="Visualização em Grade"
                  aria-label="Visualização em Grade"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Product Sections */}
      <div id="content" className="catalog-content">
        {filteredSections.map((sec) => (
          <section key={sec.id} id={`section-${sec.id}`} className="section">
            <div className="section-head-bar">
              <h2 className="section-title">
                {sec.title}
                <span className="section-count-tag">{sec.items.length} itens</span>
              </h2>
            </div>

            {sec.bannerImage ? (
              <div className="section-banner-with-img">
                <img
                  src={sec.bannerImage}
                  alt={sec.title}
                  referrerPolicy="no-referrer"
                  className="section-banner-real-photo"
                  loading="lazy"
                />
                <div className="section-banner-overlay">
                  <span className="section-banner-title">{sec.title}</span>
                </div>
              </div>
            ) : sec.banner ? (
              <div className="section-banner">
                <ProductIcon category={sec.id} size={30} className="theme-accent-icon" />
              </div>
            ) : null}
            {sec.bannerCaption && (
              <div className="section-caption">{sec.bannerCaption}</div>
            )}

            {/* List Mode */}
            {viewMode === 'list' && (
              <div className="products">
                {sec.items.map((item) => {
                  const qty = getItemQty(item.id);
                  const isFav = !!favorites[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`card ${qty > 0 ? 'in-cart' : ''}`}
                      id={`card-${item.id}`}
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
                          aria-label={isFav ? `Remover ${item.name} dos favoritos` : `Favoritar ${item.name}`}
                          title={isFav ? 'Favoritado' : 'Favoritar'}
                        >
                          <Heart size={15} fill={isFav ? '#e11d48' : 'none'} color={isFav ? '#e11d48' : '#64748b'} />
                        </button>
                        <ProductIcon item={item} size={38} />
                      </div>

                      <div className="info">
                        <div className="tags">
                          {item.tags?.map((t) => (
                            <span key={t} className={`tag ${t}`}>
                              {t === 'novo' ? 'Novidade!' : 'Promoção!'}
                            </span>
                          ))}
                          {item.category && (
                            <span className="tag-category">{item.category}</span>
                          )}
                          {qty > 0 && (
                            <span className="tag-in-cart">{qty} no carrinho</span>
                          )}
                        </div>

                        <div className="name">{item.name}</div>
                        <div className="weight">{item.weight} • Seleção fresca</div>
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
                              aria-label="Diminuir quantidade"
                            >
                              –
                            </button>
                            <span className="bump">{qty}</span>
                            <button
                              type="button"
                              onClick={(e) => addToCart(item, 1, undefined, e)}
                              aria-label="Aumentar quantidade"
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
            )}

            {/* Grid Mode */}
            {viewMode === 'grid' && (
              <div className="products-grid">
                {sec.items.map((item) => {
                  const qty = getItemQty(item.id);
                  const isFav = !!favorites[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`grid-card ${qty > 0 ? 'in-cart' : ''}`}
                      onClick={() => openProductDetail(item)}
                    >
                      <div
                        className="grid-card-pic"
                        style={item.grad ? { background: item.grad, color: '#fff' } : undefined}
                      >
                        <button
                          type="button"
                          className={`heart ${isFav ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(item.id, e)}
                          aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                        >
                          <Heart size={15} fill={isFav ? '#e11d48' : 'none'} color={isFav ? '#e11d48' : '#64748b'} />
                        </button>
                        <ProductIcon item={item} size={36} />
                        {qty > 0 && (
                          <span className="grid-cart-badge">{qty} no carrinho</span>
                        )}
                      </div>

                      <div className="grid-card-body">
                        <div className="grid-card-tags">
                          {item.tags?.map((t) => (
                            <span key={t} className={`tag ${t}`}>
                              {t === 'novo' ? 'Novo' : 'Promo'}
                            </span>
                          ))}
                        </div>
                        <div className="grid-card-name" title={item.name}>
                          {item.name}
                        </div>
                        <div className="grid-card-weight">{item.weight}</div>
                        <div className="grid-card-bottom">
                          <span className="grid-card-price">{formatCurrency(item.price)}</span>

                          <div className="grid-card-action" onClick={(e) => e.stopPropagation()}>
                            {qty === 0 ? (
                              <button
                                type="button"
                                className="grid-add-btn"
                                onClick={(e) => addToCart(item, 1, undefined, e)}
                                aria-label={`Adicionar ${item.name}`}
                              >
                                + Pedir
                              </button>
                            ) : (
                              <div className="qty mini">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

        {/* Empty Search State */}
        {totalFilteredCount === 0 && (
          <div className="view-empty-state" style={{ margin: '30px 14px' }}>
            <div className="view-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Search size={40} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <div className="view-empty-title">Nenhum produto encontrado</div>
            <div className="view-empty-desc">
              Não encontramos resultados para "{searchQuery}". Experimente buscar por outro termo ou explore as categorias abaixo.
            </div>
            <div className="empty-search-suggestions">
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Tente buscar:</span>
              <div className="empty-search-chips">
                {['Manga', 'Salada', 'Kit', 'Brócolis', 'Abacaxi', 'Morango'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="view-empty-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveFilterTag('all');
                handleChipClick('all');
              }}
              style={{ marginTop: '14px' }}
            >
              Limpar Filtros e Ver Todos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
