/**
 * Single source of truth for the section library: what a seller can drop onto a
 * page, how it is grouped, what it is called in seller-facing language, and what
 * a brand-new instance of it looks like.
 *
 * Nothing here changes the persisted shape of a section — instances are still
 * plain `SectionConfigurationDto`s with `contentJson` / `settingsJson` strings.
 * Defaults are only ever applied when *creating* a new section, never merged
 * into one that already exists.
 */
import { SectionConfigurationDto } from 'shared';

export interface SectionVariant {
  id: string;
  label: string;
}

/** Purpose-based grouping used by the library panel. */
export type SectionGroupKey = 'hero' | 'products' | 'categories' | 'content' | 'trust' | 'conversion' | 'layout';

/**
 * Where a section can be used: on a page, in the header/footer layout groups,
 * or either. Keeps page-only blocks out of the header and vice versa.
 */
export type SectionScope = 'page' | 'layout' | 'both';

export interface SectionGroup {
  key: SectionGroupKey;
  label: string;
  /** One line telling the seller what this group is for. */
  hint: string;
}

export interface SectionTypeInfo {
  key: string;
  /** Seller-facing name — says what the section shows, never the internal key. */
  label: string;
  description: string;
  group: SectionGroupKey;
  defaultVariantId: string;
  /** Width:height of the miniature card, so the panel reserves the right space. */
  aspect: number;
  /** Content applied to a freshly created instance so it renders finished. */
  defaultContent?: Record<string, unknown>;
  /**
   * Set when the section draws from the store's catalogue, which is what gives
   * it a "what should this show?" picker in its settings.
   */
  dataSource?: 'products' | 'categories';
  /** Defaults to 'page' when unset. */
  scope?: SectionScope;
}

export const SECTION_GROUPS: SectionGroup[] = [
  { key: 'hero', label: 'Hero & banners', hint: 'The first thing shoppers see' },
  { key: 'products', label: 'Products', hint: 'Show what you sell' },
  { key: 'categories', label: 'Categories', hint: 'Help shoppers browse' },
  { key: 'content', label: 'Content', hint: 'Tell your story' },
  { key: 'trust', label: 'Trust & social proof', hint: 'Reasons to buy from you' },
  { key: 'conversion', label: 'Offers & checkout', hint: 'Turn visits into orders' },
  { key: 'layout', label: 'Header & footer', hint: 'What wraps every page' }
];

const bi = (en: string, ar: string) => ({ en, ar });

/**
 * Every section type the builder offers. `defaultContent` is what makes a
 * dropped-and-never-opened section render like a finished block (§6): real
 * store data fills the data-bound slots, this fills the copy slots.
 */
export const SECTION_TYPES: SectionTypeInfo[] = [
  {
    key: 'Hero', label: 'Hero banner', description: 'Big headline, image and a button',
    group: 'hero', defaultVariantId: 'hero-full-image', aspect: 16 / 9,
    defaultContent: {
      title: bi('Welcome to our store', 'مرحبًا بكم في متجرنا'),
      subtitle: bi('Quality products, delivered fast', 'منتجات عالية الجودة، توصيل سريع'),
      buttonText: 'Shop now', buttonLink: '/products'
    }
  },
  {
    key: 'Banner', label: 'Promo banner', description: 'A promotional strip or card',
    group: 'hero', defaultVariantId: 'banner-strip', aspect: 16 / 5,
    defaultContent: {
      title: bi('Season sale — up to 40% off', 'تخفيضات الموسم — حتى 40%'),
      subtitle: bi('Limited stock, while it lasts', 'الكمية محدودة'),
      buttonText: bi('See offers', 'شاهد العروض'), buttonLink: '/products'
    }
  },
  {
    key: 'AnnouncementBar', label: 'Announcement bar', description: 'Thin promo strip across the top',
    // Equally at home above the header or on a page.
    group: 'hero', defaultVariantId: 'announcement-bar', aspect: 16 / 3, scope: 'both',
    defaultContent: {
      text: bi('Free shipping on orders over 500', 'شحن مجاني للطلبات فوق 500'),
      link: '/products', bg: '#111827', textColor: '#ffffff', dismissible: true
    }
  },
  {
    key: 'Slider', label: 'Image slider', description: 'Rotating full-width slides',
    group: 'hero', defaultVariantId: 'slider-standard', aspect: 16 / 7,
    defaultContent: {
      slides: [
        { title: bi('New arrivals', 'وصل حديثًا'), subtitle: bi('Fresh picks this week', 'أحدث المنتجات هذا الأسبوع'), buttonText: bi('Shop now', 'تسوق الآن'), buttonLink: '/products' },
        { title: bi('Best sellers', 'الأكثر مبيعًا'), subtitle: bi('Loved by our customers', 'المفضلة لدى عملائنا'), buttonText: bi('Browse', 'تصفح'), buttonLink: '/products' }
      ]
    }
  },
  {
    key: 'Image', label: 'Image block', description: 'A single full-width image',
    group: 'hero', defaultVariantId: 'image-standard', aspect: 16 / 6,
    defaultContent: { caption: bi('', '') }
  },

  {
    key: 'FeaturedProducts', label: 'Featured products', description: 'A grid of products from your store',
    group: 'products', defaultVariantId: 'grid-standard', aspect: 16 / 11, dataSource: 'products',
    defaultContent: { title: bi('Featured products', 'منتجات مميزة'), subtitle: bi('Handpicked for you', 'مختارة لك') }
  },
  {
    key: 'ProductCarousel', label: 'Product carousel', description: 'Products that scroll sideways',
    group: 'products', defaultVariantId: 'carousel-standard', aspect: 16 / 9, dataSource: 'products',
    defaultContent: { title: bi('You may also like', 'قد يعجبك أيضًا') }
  },
  {
    key: 'Specs', label: 'Specifications table', description: 'Grouped product detail rows',
    group: 'products', defaultVariantId: 'specs-standard', aspect: 16 / 10,
    defaultContent: {
      title: bi('Specifications', 'المواصفات'),
      groups: [{
        name: bi('General', 'عام'),
        rows: [
          { label: bi('Material', 'الخامة'), value: bi('Premium cotton', 'قطن فاخر') },
          { label: bi('Warranty', 'الضمان'), value: bi('12 months', '12 شهرًا') }
        ]
      }]
    }
  },

  {
    key: 'CategoryShowcase', label: 'Category grid', description: 'Your categories as browsable tiles',
    group: 'categories', defaultVariantId: 'cats-grid', aspect: 16 / 10, dataSource: 'categories',
    defaultContent: { title: bi('Shop by category', 'تسوق حسب الفئة') }
  },

  {
    key: 'MediaText', label: 'Image with text', description: 'Alternating image and copy rows',
    group: 'content', defaultVariantId: 'media-text-standard', aspect: 16 / 9,
    defaultContent: {
      items: [{
        title: bi('Made to last', 'مصنوع ليدوم'),
        text: bi('Every piece is checked by hand before it ships to you.', 'يتم فحص كل قطعة يدويًا قبل شحنها إليك.'),
        layout: 'image-left'
      }]
    }
  },
  {
    key: 'RichText', label: 'Text block', description: 'Formatted paragraphs and headings',
    group: 'content', defaultVariantId: 'rich-text', aspect: 16 / 8,
    defaultContent: {
      html: bi(
        '<h2>About this collection</h2><p>Tell shoppers what makes it worth buying.</p>',
        '<h2>عن هذه المجموعة</h2><p>أخبر العملاء لماذا تستحق الشراء.</p>'
      )
    }
  },
  {
    key: 'Video', label: 'Video', description: 'An embedded or uploaded video',
    group: 'content', defaultVariantId: 'video-youtube', aspect: 16 / 9,
    defaultContent: { title: bi('See it in action', 'شاهده أثناء الاستخدام'), source: 'youtube' }
  },
  {
    key: 'Marquee', label: 'Scrolling text bar', description: 'Running text across the page',
    group: 'content', defaultVariantId: 'marquee-standard', aspect: 16 / 3,
    defaultContent: {
      messages: [
        { text: bi('Free returns within 14 days', 'إرجاع مجاني خلال 14 يومًا') },
        { text: bi('Cash on delivery available', 'الدفع عند الاستلام متاح') }
      ]
    }
  },
  {
    key: 'CustomHtml', label: 'Custom HTML', description: 'Your own HTML snippet',
    group: 'content', defaultVariantId: 'custom-html', aspect: 16 / 7
  },
  {
    key: 'FeatureHighlights', label: 'Feature highlights', description: 'Key features with icons',
    group: 'content', defaultVariantId: 'feat-icons', aspect: 16 / 6,
    defaultContent: {
      title: bi('Why shop with us', 'لماذا تتسوق معنا'),
      items: [
        { icon: '🚚', title: bi('Fast delivery', 'توصيل سريع'), text: bi('Days, not weeks', 'أيام وليس أسابيع') },
        { icon: '💳', title: bi('Secure payment', 'دفع آمن'), text: bi('Your data stays safe', 'بياناتك في أمان') },
        { icon: '↩️', title: bi('Easy returns', 'إرجاع سهل'), text: bi('No questions asked', 'بدون أسئلة') }
      ]
    }
  },

  {
    key: 'Testimonials', label: 'Customer reviews', description: 'Quotes from happy customers',
    group: 'trust', defaultVariantId: 'test-cards', aspect: 16 / 9,
    defaultContent: {
      title: bi('What our customers say', 'ماذا يقول عملاؤنا'),
      items: [
        { name: 'Sara M.', rating: 5, text: bi('Arrived quickly and exactly as described.', 'وصل بسرعة ومطابق للوصف تمامًا.') },
        { name: 'Omar K.', rating: 5, text: bi('Great quality for the price. Will order again.', 'جودة ممتازة مقابل السعر. سأطلب مرة أخرى.') },
        { name: 'Nour A.', rating: 4, text: bi('Friendly support, easy checkout.', 'دعم ودود وعملية شراء سهلة.') }
      ]
    }
  },
  {
    key: 'ReviewsShowcase', label: 'Product reviews', description: 'Real reviews on product pages',
    group: 'trust', defaultVariantId: 'reviews-standard', aspect: 16 / 9,
    defaultContent: { title: bi('Customer reviews', 'تقييمات العملاء') }
  },
  {
    key: 'Benefits', label: 'Benefits', description: 'Value propositions with icons',
    group: 'trust', defaultVariantId: 'benefits-standard', aspect: 16 / 6,
    defaultContent: {
      title: bi("Why you'll love it", 'لماذا ستحبه'),
      items: [
        { icon: '⭐', title: bi('Top rated', 'الأعلى تقييمًا'), text: bi('Loved by customers', 'محبوب من العملاء') },
        { icon: '🛡️', title: bi('Guaranteed', 'مضمون'), text: bi('Money-back promise', 'ضمان استرداد الأموال') },
        { icon: '🚚', title: bi('Fast delivery', 'توصيل سريع'), text: bi('Delivered in days', 'يصل خلال أيام') }
      ]
    }
  },
  {
    key: 'Guarantee', label: 'Guarantee badge', description: 'A reassurance banner',
    group: 'trust', defaultVariantId: 'guarantee-standard', aspect: 16 / 5,
    defaultContent: {
      icon: '🛡️',
      title: bi('Satisfaction guaranteed', 'رضا مضمون'),
      text: bi('Or your money back, within 14 days.', 'أو استرداد أموالك خلال 14 يومًا.')
    }
  },
  {
    key: 'Faq', label: 'Questions & answers', description: 'An expandable FAQ list',
    group: 'trust', defaultVariantId: 'faq-accordion', aspect: 16 / 10,
    defaultContent: {
      title: bi('Frequently asked questions', 'الأسئلة الشائعة'),
      items: [
        { question: bi('How long does delivery take?', 'كم يستغرق التوصيل؟'), answer: bi('Typically 2–5 business days.', 'عادةً من 2 إلى 5 أيام عمل.') },
        { question: bi('Can I return an item?', 'هل يمكنني إرجاع المنتج؟'), answer: bi('Yes, within 14 days of delivery.', 'نعم، خلال 14 يومًا من الاستلام.') }
      ]
    }
  },
  {
    key: 'Stats', label: 'Numbers & counters', description: 'Figures worth bragging about',
    group: 'trust', defaultVariantId: 'stats-standard', aspect: 16 / 5,
    defaultContent: {
      items: [
        { value: '12k+', label: bi('Orders delivered', 'طلب تم توصيله') },
        { value: '4.8', label: bi('Average rating', 'متوسط التقييم') },
        { value: '24h', label: bi('Support response', 'زمن الرد') }
      ]
    }
  },
  {
    key: 'Comparison', label: 'Comparison table', description: 'You versus the alternatives',
    group: 'trust', defaultVariantId: 'comparison-standard', aspect: 16 / 10,
    defaultContent: {
      title: bi('Why we are different', 'لماذا نحن مختلفون'),
      usLabel: bi('Us', 'نحن'), themLabel: bi('Others', 'الآخرون'),
      rows: [
        { label: bi('Free delivery', 'توصيل مجاني'), us: true, them: false },
        { label: bi('14-day returns', 'إرجاع خلال 14 يومًا'), us: true, them: false },
        { label: bi('Local support', 'دعم محلي'), us: true, them: true }
      ]
    }
  },
  {
    key: 'BeforeAfter', label: 'Before & after', description: 'A draggable image comparison',
    group: 'trust', defaultVariantId: 'before-after-standard', aspect: 16 / 9,
    defaultContent: { title: bi('See the difference', 'شاهد الفرق'), beforeLabel: bi('Before', 'قبل'), afterLabel: bi('After', 'بعد') }
  },

  {
    key: 'CallToAction', label: 'Call to action', description: 'A closing invitation to buy',
    group: 'conversion', defaultVariantId: 'cta-band', aspect: 16 / 6,
    defaultContent: {
      title: bi('Ready to get yours?', 'هل أنت مستعد للحصول عليه؟'),
      subtitle: bi('Order now while stock lasts', 'اطلب الآن قبل نفاد الكمية'),
      buttonText: bi('Shop now', 'تسوق الآن'), buttonLink: '/products'
    }
  },
  {
    key: 'CtaButton', label: 'Button', description: 'A standalone or WhatsApp button',
    group: 'conversion', defaultVariantId: 'cta-button', aspect: 16 / 4,
    defaultContent: { text: bi('Order on WhatsApp', 'اطلب عبر واتساب'), style: 'whatsapp' }
  },
  {
    key: 'Countdown', label: 'Countdown timer', description: 'Shows an offer running out',
    group: 'conversion', defaultVariantId: 'countdown-standard', aspect: 16 / 6,
    defaultContent: {
      title: bi('Hurry — offer ends in', 'أسرع، ينتهي العرض خلال'),
      expiredBehavior: 'message', expiredText: bi('Offer ended', 'انتهى العرض')
    }
  },
  {
    key: 'Newsletter', label: 'Email signup', description: 'Collect shopper email addresses',
    group: 'conversion', defaultVariantId: 'news-inline', aspect: 16 / 6,
    defaultContent: {
      title: bi('Stay in the loop', 'ابقَ على اطلاع'),
      subtitle: bi('Offers and new arrivals, no spam.', 'عروض ومنتجات جديدة، بدون إزعاج.'),
      buttonText: 'Subscribe'
    }
  },
  {
    key: 'OrderForm', label: 'Order form', description: 'An inline buy box for one product',
    group: 'conversion', defaultVariantId: 'order-form', aspect: 16 / 11,
    defaultContent: {
      title: bi('Complete your order', 'أكمل طلبك'),
      buttonText: bi('Order now', 'اطلب الآن')
    }
  },
  {
    key: 'Bundle', label: 'Quantity offers', description: 'Buy-more-save-more tiers',
    group: 'conversion', defaultVariantId: 'bundle-tiers', aspect: 16 / 9,
    defaultContent: {
      title: bi('Choose your offer', 'اختر عرضك'),
      tiers: [
        { qty: 1, label: bi('Single', 'قطعة واحدة'), badge: bi('', ''), highlight: false },
        { qty: 2, label: bi('Two pieces', 'قطعتان'), badge: bi('Most popular', 'الأكثر طلبًا'), highlight: true },
        { qty: 3, label: bi('Three pieces', 'ثلاث قطع'), badge: bi('Best value', 'أفضل قيمة'), highlight: false }
      ]
    }
  },
  {
    key: 'StickyBar', label: 'Sticky buy bar', description: 'A buy bar pinned to the screen bottom',
    group: 'conversion', defaultVariantId: 'sticky-bar', aspect: 16 / 4,
    defaultContent: { buttonText: bi('Add to cart', 'أضف إلى السلة') }
  },

  // ── Header and footer ──
  {
    key: 'HeaderBar', label: 'Header bar', description: 'Logo, menu links, cart and language',
    group: 'layout', defaultVariantId: 'header-bar', aspect: 16 / 2.4, scope: 'layout',
    defaultContent: { showName: true, sticky: true, showCart: true, showAccount: true, showLanguage: true }
  },
  {
    key: 'FooterColumns', label: 'Footer columns', description: 'Columns of links or text',
    group: 'layout', defaultVariantId: 'footer-columns', aspect: 16 / 7, scope: 'layout',
    defaultContent: { showStoreBlurb: true, blocks: [] }
  },
  {
    key: 'FooterSocial', label: 'Social links', description: 'Your social accounts as icons',
    group: 'layout', defaultVariantId: 'footer-social', aspect: 16 / 3, scope: 'layout',
    defaultContent: { title: bi('Follow us', 'تابعنا') }
  },
  {
    key: 'Copyright', label: 'Copyright line', description: 'The closing line of the footer',
    group: 'layout', defaultVariantId: 'copyright-bar', aspect: 16 / 2.4, scope: 'layout',
    defaultContent: { text: bi('© {year} {store}. All rights reserved.', '© {year} {store}. جميع الحقوق محفوظة.') }
  }
];

/** The section types offered while editing a page, or a header/footer group. */
export function sectionTypesFor(scope: 'page' | 'layout'): SectionTypeInfo[] {
  return SECTION_TYPES.filter(type => (type.scope ?? 'page') === scope || type.scope === 'both');
}

export const SECTION_VARIANTS: Record<string, SectionVariant[]> = {
  Hero: [
    { id: 'hero-full-image', label: 'Full width image' },
    { id: 'hero-split', label: 'Image beside text' },
    { id: 'hero-slider', label: 'Slider' },
    { id: 'hero-minimal', label: 'Minimal' }
  ],
  FeaturedProducts: [
    { id: 'grid-standard', label: 'Standard grid' },
    { id: 'grid-large', label: 'Large grid' },
    { id: 'grid-list', label: 'List view' },
    { id: 'grid-compact', label: 'Compact grid' }
  ],
  CategoryShowcase: [
    { id: 'cats-grid', label: 'Grid' },
    { id: 'cats-slider', label: 'Slider' },
    { id: 'cats-icons', label: 'Icons' }
  ],
  FeatureHighlights: [
    { id: 'feat-icons', label: 'Icons' },
    { id: 'feat-cards', label: 'Cards' }
  ],
  Newsletter: [
    { id: 'news-inline', label: 'Inline form' },
    { id: 'news-card', label: 'Card form' }
  ],
  Banner: [
    { id: 'banner-strip', label: 'Strip' },
    { id: 'banner-card', label: 'Card' }
  ],
  ProductCarousel: [{ id: 'carousel-standard', label: 'Standard' }],
  Testimonials: [
    { id: 'test-cards', label: 'Cards' },
    { id: 'test-slider', label: 'Slider' }
  ],
  CustomHtml: [{ id: 'custom-html', label: 'Custom HTML block' }],
  MediaText: [{ id: 'media-text-standard', label: 'Standard' }],
  Benefits: [
    { id: 'benefits-standard', label: 'Standard' },
    { id: 'benefits-strip', label: 'Trust badge strip' }
  ],
  Slider: [{ id: 'slider-standard', label: 'Standard' }],
  Video: [{ id: 'video-youtube', label: 'YouTube' }],
  AnnouncementBar: [{ id: 'announcement-bar', label: 'Standard' }],
  Countdown: [{ id: 'countdown-standard', label: 'Standard' }],
  RichText: [{ id: 'rich-text', label: 'Standard' }],
  CtaButton: [{ id: 'cta-button', label: 'Standard' }],
  Stats: [{ id: 'stats-standard', label: 'Standard' }],
  Comparison: [{ id: 'comparison-standard', label: 'Standard' }],
  BeforeAfter: [{ id: 'before-after-standard', label: 'Standard' }],
  Image: [{ id: 'image-standard', label: 'Standard' }],
  Specs: [{ id: 'specs-standard', label: 'Standard' }],
  Marquee: [{ id: 'marquee-standard', label: 'Standard' }],
  OrderForm: [{ id: 'order-form', label: 'Standard' }],
  StickyBar: [{ id: 'sticky-bar', label: 'Standard' }],
  Bundle: [{ id: 'bundle-tiers', label: 'Quantity tiers' }],
  ReviewsShowcase: [{ id: 'reviews-standard', label: 'Standard' }],
  Faq: [{ id: 'faq-accordion', label: 'Accordion' }],
  Guarantee: [{ id: 'guarantee-standard', label: 'Standard' }],
  CallToAction: [{ id: 'cta-band', label: 'Band' }],
  HeaderBar: [{ id: 'header-bar', label: 'Standard' }],
  FooterColumns: [{ id: 'footer-columns', label: 'Columns' }],
  FooterSocial: [{ id: 'footer-social', label: 'Icons' }],
  Copyright: [{ id: 'copyright-bar', label: 'Standard' }]
};

export interface PageTemplate {
  key: string;
  label: string;
  description: string;
  sections: Array<{ sectionType: string; variantId: string; content?: unknown; settings?: unknown }>;
}

/** Whole-page starting points; they replace the current section list. */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: 'tpl-landing', label: 'Product landing page', description: 'Announcement, hero, benefits, countdown, reviews, questions, guarantee, closing CTA',
    sections: [
      { sectionType: 'AnnouncementBar', variantId: 'announcement-bar' },
      { sectionType: 'Hero', variantId: 'hero-full-image' },
      { sectionType: 'Benefits', variantId: 'benefits-standard' },
      { sectionType: 'Countdown', variantId: 'countdown-standard' },
      { sectionType: 'ReviewsShowcase', variantId: 'reviews-standard' },
      { sectionType: 'Faq', variantId: 'faq-accordion' },
      { sectionType: 'Guarantee', variantId: 'guarantee-standard' },
      { sectionType: 'CallToAction', variantId: 'cta-band' }
    ]
  },
  {
    key: 'tpl-home', label: 'Simple store home', description: 'Hero, featured products, categories, email signup',
    sections: [
      { sectionType: 'Hero', variantId: 'hero-full-image' },
      { sectionType: 'FeaturedProducts', variantId: 'grid-standard' },
      { sectionType: 'CategoryShowcase', variantId: 'cats-grid' },
      { sectionType: 'Newsletter', variantId: 'news-inline' }
    ]
  }
];

export function findSectionType(key: string): SectionTypeInfo | undefined {
  return SECTION_TYPES.find(t => t.key === key);
}

export function sectionTypeLabel(key: string): string {
  return findSectionType(key)?.label ?? key;
}

export function variantsFor(sectionType: string): SectionVariant[] {
  return SECTION_VARIANTS[sectionType] ?? [{ id: sectionType.toLowerCase(), label: 'Standard' }];
}

/**
 * Builds a brand-new section instance. Used by every insertion path (library
 * drop, keyboard add, page template) so a section always lands finished.
 * Existing sections never pass through here.
 */
export function createSectionInstance(
  typeKey: string,
  overrides?: { variantId?: string; content?: unknown; settings?: unknown }
): SectionConfigurationDto | null {
  const info = findSectionType(typeKey);
  if (!info) return null;

  const content = overrides?.content !== undefined ? overrides.content : info.defaultContent;

  return {
    id: crypto.randomUUID(),
    sectionType: typeKey,
    variantId: overrides?.variantId ?? info.defaultVariantId,
    isEnabled: true,
    sortOrder: 0,
    contentJson: content !== undefined ? JSON.stringify(content) : undefined,
    settingsJson: overrides?.settings !== undefined ? JSON.stringify(overrides.settings) : undefined
  };
}
