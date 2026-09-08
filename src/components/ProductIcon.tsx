import React, { useState } from 'react';
import {
  Apple,
  Carrot,
  Citrus,
  Leaf,
  Salad,
  ShoppingBag
} from 'lucide-react';
import { Product } from '../types';
import { ITEM_INDEX } from '../data/products';

interface ProductIconProps {
  item?: Partial<Product> | null;
  name?: string;
  category?: string;
  size?: number;
  className?: string;
  imgClassName?: string;
  iconOnly?: boolean;
}

export const ProductIcon: React.FC<ProductIconProps> = ({
  item,
  name = '',
  category = '',
  size = 32,
  className = '',
  imgClassName = '',
  iconOnly = false
}) => {
  const [imageError, setImageError] = useState(false);

  // Look up image from item or backfill from catalog index
  const resolvedImageUrl =
    item?.image ||
    (item?.id ? ITEM_INDEX[item.id]?.image : undefined);

  // Render real product photo if available, unless iconOnly is requested or image failed to load
  if (resolvedImageUrl && !imageError && !iconOnly && size > 16) {
    return (
      <img
        src={resolvedImageUrl}
        alt={item?.name || name || 'Produto'}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImageError(true)}
        className={`product-real-photo ${imgClassName}`}
      />
    );
  }

  const prodName = (item?.name || name || '').toLowerCase();
  const prodCat = (item?.category || category || '').toLowerCase();

  // Determine the most fitting vector icon
  if (prodCat.includes('kit') || prodName.includes('kit') || prodName.includes('combo')) {
    return <ShoppingBag size={size} className={className} strokeWidth={1.8} />;
  }

  if (
    prodCat.includes('salada') ||
    prodName.includes('salada') ||
    prodName.includes('mix') ||
    prodName.includes('tigela')
  ) {
    return <Salad size={size} className={className} strokeWidth={1.8} />;
  }

  if (
    prodName.includes('laranja') ||
    prodName.includes('limão') ||
    prodName.includes('limao') ||
    prodName.includes('abacaxi') ||
    prodName.includes('maracujá') ||
    prodName.includes('maracuja') ||
    prodName.includes('mexerica') ||
    prodName.includes('tangerina')
  ) {
    return <Citrus size={size} className={className} strokeWidth={1.8} />;
  }

  if (
    prodCat.includes('legume') ||
    prodCat.includes('verdura') ||
    prodName.includes('cenoura') ||
    prodName.includes('brócolis') ||
    prodName.includes('brocolis') ||
    prodName.includes('tomate') ||
    prodName.includes('abobrinha') ||
    prodName.includes('chuchu') ||
    prodName.includes('batata') ||
    prodName.includes('mandioca')
  ) {
    return <Carrot size={size} className={className} strokeWidth={1.8} />;
  }

  if (
    prodCat.includes('tempero') ||
    prodName.includes('hortelã') ||
    prodName.includes('hortela') ||
    prodName.includes('cheiro verde') ||
    prodName.includes('salsa') ||
    prodName.includes('cebolinha') ||
    prodName.includes('manjericão') ||
    prodName.includes('manjericao') ||
    prodName.includes('alecrim') ||
    prodName.includes('couve') ||
    prodName.includes('espinafre') ||
    prodName.includes('rúcula') ||
    prodName.includes('rucula') ||
    prodName.includes('alface')
  ) {
    return <Leaf size={size} className={className} strokeWidth={1.8} />;
  }

  if (
    prodCat.includes('fruta') ||
    prodName.includes('manga') ||
    prodName.includes('maçã') ||
    prodName.includes('maca') ||
    prodName.includes('morango') ||
    prodName.includes('melancia') ||
    prodName.includes('melão') ||
    prodName.includes('melao') ||
    prodName.includes('uva') ||
    prodName.includes('banana') ||
    prodName.includes('mamão') ||
    prodName.includes('mamao') ||
    prodName.includes('pera') ||
    prodName.includes('pêra') ||
    prodName.includes('kiwi')
  ) {
    return <Apple size={size} className={className} strokeWidth={1.8} />;
  }

  return <Leaf size={size} className={className} strokeWidth={1.8} />;
};
