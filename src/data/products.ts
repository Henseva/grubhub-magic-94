import { Section, Product } from '../types';

export const FREE_SHIPPING_THRESHOLD = 165.0;
export const MIN_ORDER_THRESHOLD = 40.0;
export const STANDARD_DELIVERY_FEE = 9.9;
export const STORE_PHONE = '5511999999999';

export const SECTIONS: Section[] = [
  {
    id: 'kit',
    chip: 'Kit Fruta Semanal',
    title: 'Kit Fruta Semanal',
    banner: '🧺',
    bannerImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    bannerCaption: 'Frutas frescas selecionadas sob encomenda para toda a sua semana',
    items: [
      {
        id: 'kit',
        name: 'Kit Fruta Semanal',
        weight: 'variado',
        desc: 'Seleção de frutas frescas para a semana, itens variados e higienizados.',
        price: 49.9,
        icon: '🍎',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
        grad: 'linear-gradient(135deg,#efb35d,#e94b35,#6da54c)',
        tags: ['novo'],
        category: 'Kits',
        nutritionalTip: 'Variedade rica em fibras solúveis, vitamina C e antioxidantes naturais.',
        storageTip: 'Manter em local fresco e arejado; refrigerar frutas maduras.'
      }
    ]
  },
  {
    id: 'saladas',
    chip: 'Saladas Especiais',
    title: 'Saladas de Frutas Especiais',
    bannerImage: 'https://images.unsplash.com/photo-1568158879051-c296bb9612ac?auto=format&fit=crop&w=1200&q=80',
    bannerCaption: 'Cortes nobres de frutas frescas preparadas no dia',
    items: [
      {
        id: 'salada1',
        name: 'Salada de Frutas Especial',
        weight: '250g',
        desc: 'Mix de frutas frescas selecionadas.',
        price: 12.9,
        icon: '🍓',
        image: 'https://images.unsplash.com/photo-1568158879051-c296bb9612ac?auto=format&fit=crop&w=600&q=80',
        grad: 'linear-gradient(135deg,#e94,#fd5,#d43)',
        tags: ['novo', 'promo'],
        category: 'Saladas',
        nutritionalTip: 'Morangos, uvas e manga fresca, sem adição de açúcar ou conservantes.',
        storageTip: 'Manter refrigerado entre 2°C e 6°C até o consumo.'
      },
      {
        id: 'salada2',
        name: 'Salada de Frutas Cremosa',
        weight: '250g',
        desc: 'Frutas frescas com toque cremoso.',
        price: 14.9,
        icon: '🥝',
        image: 'https://images.unsplash.com/photo-1541256942802-7b29631f0bc5?auto=format&fit=crop&w=600&q=80',
        grad: 'linear-gradient(135deg,#f55,#fc4,#8b4)',
        tags: ['promo'],
        category: 'Saladas',
        nutritionalTip: 'Creme leve especial artesanal que harmoniza com frutas doces e ácidas.',
        storageTip: 'Consumir em até 48 horas mantendo sob refrigeração.'
      }
    ]
  },
  {
    id: 'frutas',
    chip: 'Frutas Picadas',
    title: 'Frutas Higienizadas e Picadas',
    bannerImage: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80',
    bannerCaption: 'Praticidade total: abriu, consumiu!',
    items: [
      {
        id: 'p:Manga Picada',
        name: 'Manga Picada',
        weight: '250g',
        desc: 'Manga selecionada, higienizada e pronta para consumir.',
        price: 6.9,
        icon: '🥭',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Rica em betacaroteno e vitamina A para imunidade e visão.',
        storageTip: 'Pronta para consumo imediato em pote selado.'
      },
      {
        id: 'p:Melancia Picada',
        name: 'Melancia Picada',
        weight: '250g',
        desc: 'Melancia doce e fresca, cortada em cubos.',
        price: 5.4,
        icon: '🍉',
        image: 'https://images.unsplash.com/photo-1589984662646-e7b2e4959493?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Ultra hidratante: 92% de água natural e licopeno antioxidante.',
        storageTip: 'Consumir bem geladinha.'
      },
      {
        id: 'p:Salada de Frutas - opcao 1',
        name: 'Salada de Frutas - opção 1',
        weight: '250g',
        desc: 'Mix de frutas frescas.',
        price: 8.9,
        icon: '🥣',
        image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Combinação equilibrada para lanche rápido ou sobremesa saudável.'
      },
      {
        id: 'p:Abacaxi Fatiado',
        name: 'Abacaxi Fatiado',
        weight: '300g',
        desc: 'Abacaxi doce, selecionado e fatiado.',
        price: 10.5,
        icon: '🍍',
        image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Fonte concentrada de bromelina, auxiliando na digestão.',
        storageTip: 'Refrigerar fechado.'
      },
      {
        id: 'p:Abacaxi Inteiro sem casca',
        name: 'Abacaxi Inteiro sem casca',
        weight: '500g',
        desc: 'Pronto para consumir.',
        price: 12.9,
        icon: '🍍',
        image: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=600&q=80',
        tags: ['novo'],
        category: 'Frutas',
        nutritionalTip: 'Descascado artesanalmente sem desperdício de polpa doce.'
      },
      {
        id: 'p:Banana',
        name: 'Banana',
        weight: '1kg',
        desc: 'Bananas selecionadas.',
        price: 8.0,
        icon: '🍌',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Excelente fonte de potássio, magnésio e energia rápida natural.'
      },
      {
        id: 'p:Uva',
        name: 'Uva',
        weight: '500g',
        desc: 'Uvas frescas.',
        price: 12.9,
        icon: '🍇',
        image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Ricas em resveratrol e antioxidantes para saúde cardiovascular.'
      },
      {
        id: 'p:Morangos',
        name: 'Morangos',
        weight: '250g',
        desc: 'Morangos frescos.',
        price: 13.9,
        icon: '🍓',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
        category: 'Frutas',
        nutritionalTip: 'Baixo índice glicêmico e alto teor de vitamina C.'
      }
    ]
  },
  {
    id: 'legumes',
    chip: 'Legumes e Verduras',
    title: 'Legumes e Verduras Picados',
    bannerImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    bannerCaption: 'Cortes precisos higienizados para agilizar seus preparos',
    items: [
      {
        id: 'p:Cebola Picada',
        name: 'Cebola Picada',
        weight: '250g',
        desc: 'Cebola fresca já higienizada.',
        price: 5.9,
        icon: '🧅',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Poupe tempo e lágrimas na cozinha com cebolas frescas e picadas finas.'
      },
      {
        id: 'p:Salsinha Higienizada',
        name: 'Salsinha Higienizada',
        weight: '50g',
        desc: 'Salsinha fresca pronta para uso.',
        price: 4.9,
        icon: '🌿',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Higienizada em água ozonizada, pronta para finalizar qualquer prato.'
      },
      {
        id: 'p:Brocolis Higienizado',
        name: 'Brócolis Higienizado',
        weight: '300g',
        desc: 'Brócolis selecionado e higienizado.',
        price: 14.5,
        icon: '🥦',
        image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
        tags: ['novo'],
        category: 'Legumes',
        nutritionalTip: 'Floretas firmes ricos em sulforafano, ácido fólico e cálcio vegetal.'
      },
      {
        id: 'p:Couve Flor Higienizada',
        name: 'Couve Flor Higienizada',
        weight: '300g',
        desc: 'Couve-flor fresca.',
        price: 14.5,
        icon: '🥦',
        image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Ideal para vapor, refogados, purês low-carb e assados.'
      },
      {
        id: 'p:Mix Brocolis com Couve-flor',
        name: 'Mix Brócolis com Couve-flor',
        weight: '300g',
        desc: 'Mix de vegetais frescos.',
        price: 15.9,
        icon: '🥗',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Praticidade dupla para refeições saudáveis e coloridas.'
      },
      {
        id: 'p:Abobora Fatiada',
        name: 'Abóbora Fatiada',
        weight: '300g',
        desc: 'Abóbora limpa e pronta para cozinhar.',
        price: 8.2,
        icon: '🎃',
        image: 'https://images.unsplash.com/photo-1570586435893-ab4ae1a21e42?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Descascada e fatiada para sopas, purês e grelhados.'
      },
      {
        id: 'p:Abobrinha Fatiada',
        name: 'Abobrinha Fatiada',
        weight: '250g',
        desc: 'Abobrinha fresca fatiada.',
        price: 9.9,
        icon: '🥒',
        image: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Fatias no ponto para refogados rápidos e lasanhas de abobrinha.'
      },
      {
        id: 'p:Berinjela',
        name: 'Berinjela',
        weight: '250g',
        desc: 'Berinjela selecionada.',
        price: 8.5,
        icon: '🍆',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Polpa firme e casca brilhante, rica em antocianinas protetoras.'
      },
      {
        id: 'p:Repolho Verde ralado',
        name: 'Repolho Verde ralado',
        weight: '250g',
        desc: 'Repolho fresco ralado.',
        price: 9.9,
        icon: '🥬',
        image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Crocante e fininho para saladas frescas tipo coleslaw.'
      },
      {
        id: 'p:Tomate fatiado',
        name: 'Tomate fatiado',
        weight: '250g',
        desc: 'Tomates selecionados.',
        price: 9.0,
        icon: '🍅',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Fatias uniformes de tomate maduro e firme para saladas e lanches.'
      },
      {
        id: 'p:Vagem Picada',
        name: 'Vagem Picada',
        weight: '250g',
        desc: 'Vagem fresca pronta para preparo.',
        price: 11.9,
        icon: '🌱',
        image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=600&q=80',
        category: 'Legumes',
        nutritionalTip: 'Sem pontas e picadinha no tamanho exato para cozimento rápido.'
      }
    ]
  },
  {
    id: 'temperos',
    chip: 'Temperos',
    title: 'Temperos',
    banner: '🧂',
    bannerImage: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=1200&q=80',
    bannerCaption: 'Deixe sua comida mais saborosa com nossos temperos selecionados',
    items: [
      {
        id: 'p:Paprica',
        name: 'Páprica',
        weight: '100g',
        desc: 'Tempero selecionado.',
        price: 5.5,
        icon: '🌶️',
        image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      },
      {
        id: 'p:Pimenta Calabresa',
        name: 'Pimenta Calabresa',
        weight: '50g',
        desc: 'Pimenta calabresa.',
        price: 5.0,
        icon: '🌶️',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      },
      {
        id: 'p:Pimenta do Reino moida',
        name: 'Pimenta do Reino moída',
        weight: '50g',
        desc: 'Pimenta moída na hora.',
        price: 5.0,
        icon: '🧂',
        image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      },
      {
        id: 'p:Sal',
        name: 'Sal',
        weight: '500g',
        desc: 'Sal refinado.',
        price: 4.0,
        icon: '🧂',
        image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      },
      {
        id: 'p:Tempero Ana Maria',
        name: 'Tempero Ana Maria',
        weight: '100g',
        desc: 'Mistura especial de temperos.',
        price: 5.0,
        icon: '🌿',
        image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      },
      {
        id: 'p:Tempero do Chefe',
        name: 'Tempero do Chefe',
        weight: '100g',
        desc: 'Blend de temperos.',
        price: 7.9,
        icon: '🍲',
        image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
        category: 'Temperos'
      }
    ]
  }
];

export function formatCurrency(value: number): string {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

export const ITEM_INDEX: Record<string, Product> = {};
export const ALL_PRODUCTS: Product[] = [];

SECTIONS.forEach((section) => {
  section.items.forEach((item) => {
    ITEM_INDEX[item.id] = item;
    ALL_PRODUCTS.push(item);
  });
});
