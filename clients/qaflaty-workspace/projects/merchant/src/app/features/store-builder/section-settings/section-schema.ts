/**
 * What each section type lets a seller edit, declared once.
 *
 * Adding a field is a line here, not new markup: `SectionFieldsComponent`
 * renders whatever this describes. Keys are the same `contentJson` /
 * `settingsJson` keys the storefront already reads — this describes the
 * existing data, it does not reshape it.
 */
export type SectionFieldKind =
  | 'text'
  | 'textarea'
  | 'bilingual'
  | 'bilingualArea'
  | 'richText'
  | 'number'
  | 'toggle'
  | 'select'
  | 'color'
  | 'image'
  | 'video'
  | 'product'
  | 'datetime'
  | 'list'
  | 'blocks'
  | 'specGroups'
  | 'overlayAnchor';

/**
 * One kind of block a `blocks` field accepts. Unlike a list — where every row
 * has the same shape — a section can offer several block types and the merchant
 * picks which to add. Blocks are stored as `[{ type, …fields }]`.
 */
export interface SectionBlockType {
  type: string;
  label: string;
  fields: SectionField[];
  /** Shape of a newly added block, without its `type`. */
  newBlock?: ContentTemplate;
}

export interface SectionFieldOption {
  value: string;
  label: string;
}

export interface SectionField {
  /** Key inside contentJson (or settingsJson when `target` says so). */
  key: string;
  label: string;
  kind: SectionFieldKind;
  placeholder?: string;
  /** Placeholder for the Arabic half of a bilingual field. */
  placeholderAr?: string;
  help?: string;
  /** Marks the field as one search engines read. */
  seo?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: SectionFieldOption[];
  /** Toggles that are on unless explicitly switched off. */
  defaultOn?: boolean;
  /** Written to settingsJson instead of contentJson. */
  target?: 'settings';
  /**
   * Show only while a sibling field holds one of these values. `fallback` is
   * the value assumed when the sibling has never been set.
   */
  showWhen?: { key: string; equals: string[]; fallback?: string };
  /** Takes the full row instead of half of it. */
  full?: boolean;

  // ── list only ──
  itemFields?: SectionField[];
  addLabel?: string;
  /** Shape of a newly added row. */
  newItem?: ContentTemplate;
  /** Singular noun for the row header, e.g. "Slide 2". */
  itemNoun?: string;

  // ── blocks only ──
  blockTypes?: SectionBlockType[];
}

export type ContentTemplate = Record<string, unknown>;

const bilingualPair = () => ({ en: '', ar: '' });

const TITLE = (placeholder: string, placeholderAr = ''): SectionField =>
  ({ key: 'title', label: 'Heading', kind: 'bilingual', placeholder, placeholderAr, seo: true, full: true });

const SUBTITLE = (placeholder = '', placeholderAr = ''): SectionField =>
  ({ key: 'subtitle', label: 'Sub-heading', kind: 'bilingual', placeholder, placeholderAr, full: true });

/** Everything a seller can fill in, per section type. */
export const SECTION_SCHEMAS: Record<string, SectionField[]> = {
  Hero: [
    TITLE('Welcome to our store', 'أهلاً بكم'),
    SUBTITLE('Discover our collection', 'اكتشف مجموعتنا'),
    { key: 'buttonText', label: 'Button text', kind: 'text', placeholder: 'Shop now' },
    { key: 'buttonLink', label: 'Button goes to', kind: 'text', placeholder: '/products' },
    { key: 'imageUrl', label: 'Background image', kind: 'image', full: true }
  ],

  FeaturedProducts: [
    TITLE('Featured products', 'منتجات مميزة'),
    SUBTITLE('Check out our top picks', 'اكتشف أفضل منتجاتنا')
  ],

  ProductCarousel: [
    TITLE('Popular products', 'المنتجات الشائعة'),
    SUBTITLE()
  ],

  CategoryShowcase: [
    TITLE('Shop by category', 'تسوق حسب الفئة'),
    SUBTITLE()
  ],

  FeatureHighlights: [
    TITLE('Why choose us', 'لماذا تختارنا'),
    {
      key: 'items', label: 'Features', kind: 'list', full: true,
      addLabel: 'Add a feature', itemNoun: 'Feature',
      newItem: { icon: '✓', title: bilingualPair(), text: bilingualPair() },
      itemFields: [
        { key: 'icon', label: 'Icon', kind: 'text', placeholder: '🚚' },
        { key: 'title', label: 'Feature', kind: 'bilingual', placeholder: 'Fast delivery', full: true },
        { key: 'text', label: 'Description', kind: 'bilingual', placeholder: 'Days, not weeks', full: true }
      ]
    }
  ],

  Newsletter: [
    TITLE('Stay in the loop', 'ابق على اطلاع'),
    SUBTITLE(),
    { key: 'placeholder', label: 'Email box hint', kind: 'text', placeholder: 'Enter your email' },
    { key: 'buttonText', label: 'Button text', kind: 'text', placeholder: 'Subscribe' }
  ],

  Banner: [
    TITLE('Special offer', 'عرض خاص'),
    SUBTITLE(),
    { key: 'buttonText', label: 'Button text', kind: 'text', placeholder: 'Shop now' },
    { key: 'buttonLink', label: 'Button goes to', kind: 'text', placeholder: '/products' },
    { key: 'imageUrl', label: 'Banner image', kind: 'image', full: true }
  ],

  Testimonials: [
    TITLE('What our customers say', 'ماذا يقول عملاؤنا'),
    {
      key: 'items', label: 'Reviews', kind: 'list', full: true,
      addLabel: 'Add a review', itemNoun: 'Review',
      newItem: { name: '', rating: 5, text: bilingualPair() },
      itemFields: [
        { key: 'name', label: 'Customer name', kind: 'text', placeholder: 'Sara M.' },
        { key: 'rating', label: 'Stars', kind: 'number', min: 1, max: 5, step: 1 },
        { key: 'text', label: 'What they said', kind: 'bilingualArea', placeholder: 'Arrived quickly and exactly as described.', full: true }
      ]
    }
  ],

  CustomHtml: [
    { key: 'html', label: 'Your HTML', kind: 'textarea', full: true, placeholder: '<div>…</div>', help: 'Pasted markup is rendered as-is on your storefront.' }
  ],

  MediaText: [
    {
      key: 'items', label: 'Rows', kind: 'list', full: true,
      addLabel: 'Add a row', itemNoun: 'Row',
      newItem: { title: bilingualPair(), text: bilingualPair(), layout: 'side' },
      itemFields: [
        { key: 'title', label: 'Heading', kind: 'bilingual', full: true },
        { key: 'text', label: 'Text', kind: 'bilingualArea', full: true },
        { key: 'imageUrl', label: 'Image', kind: 'image', full: true, help: 'Leave blank to use a product photo.' },
        {
          key: 'layout', label: 'Text position', kind: 'select', options: [
            { value: 'side', label: 'Beside the image' },
            { value: 'below', label: 'Below the image' },
            { value: 'overlay', label: 'Over the image' }
          ]
        },
        { key: 'reverse', label: 'Put the image on the right', kind: 'toggle', showWhen: { key: 'layout', equals: ['side'], fallback: 'side' } },
        { key: 'reverse', label: 'Put the text above the image', kind: 'toggle', showWhen: { key: 'layout', equals: ['below'] } },
        { key: 'overlayPosition', label: 'Where the text sits', kind: 'overlayAnchor', full: true, showWhen: { key: 'layout', equals: ['overlay'] } },
        {
          key: 'scrim', label: 'Shade behind the text', kind: 'select', showWhen: { key: 'layout', equals: ['overlay'] },
          options: [
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'none', label: 'None' }
          ]
        },
        { key: 'textColor', label: 'Text colour', kind: 'color', showWhen: { key: 'layout', equals: ['overlay'] } }
      ]
    }
  ],

  Benefits: [
    TITLE("Why you'll love it", 'لماذا ستحبه'),
    {
      key: 'items', label: 'Benefits', kind: 'list', full: true,
      addLabel: 'Add a benefit', itemNoun: 'Benefit',
      newItem: { icon: '✓', title: bilingualPair(), text: bilingualPair() },
      itemFields: [
        { key: 'icon', label: 'Icon', kind: 'text', placeholder: '🚚' },
        { key: 'title', label: 'Benefit', kind: 'bilingual', full: true },
        { key: 'text', label: 'Description', kind: 'bilingual', full: true }
      ]
    }
  ],

  Faq: [
    TITLE('Frequently asked questions', 'الأسئلة الشائعة'),
    {
      key: 'items', label: 'Questions', kind: 'list', full: true,
      addLabel: 'Add a question', itemNoun: 'Question',
      newItem: { question: bilingualPair(), answer: bilingualPair() },
      itemFields: [
        { key: 'question', label: 'Question', kind: 'bilingual', full: true, seo: true },
        { key: 'answer', label: 'Answer', kind: 'bilingualArea', full: true, seo: true }
      ]
    }
  ],

  Guarantee: [
    { key: 'icon', label: 'Icon', kind: 'text', placeholder: '🛡️' },
    TITLE('Satisfaction guaranteed', 'رضا مضمون'),
    { key: 'text', label: 'Supporting line', kind: 'bilingual', full: true, placeholder: 'Or your money back' }
  ],

  CallToAction: [
    TITLE('Ready to order?', 'مستعد للطلب؟'),
    SUBTITLE(),
    { key: 'buttonText', label: 'Button text', kind: 'bilingual', full: true, placeholder: 'Shop now' },
    { key: 'buttonLink', label: 'Button goes to', kind: 'text', placeholder: '/products' }
  ],

  ReviewsShowcase: [
    TITLE('What customers say', 'ماذا يقول العملاء')
  ],

  Slider: [
    { key: 'autoplay', label: 'Move on its own', kind: 'toggle', defaultOn: true },
    { key: 'interval', label: 'Seconds between slides', kind: 'number', min: 1500, step: 500, help: 'In milliseconds.' },
    {
      key: 'slides', label: 'Slides', kind: 'list', full: true,
      addLabel: 'Add a slide', itemNoun: 'Slide',
      newItem: { imageUrl: '', link: '', alt: '' },
      itemFields: [
        { key: 'imageUrl', label: 'Image', kind: 'image', full: true },
        { key: 'link', label: 'Goes to', kind: 'text', placeholder: '/products' },
        { key: 'alt', label: 'Image description', kind: 'text', seo: true, help: 'Read aloud by screen readers.' }
      ]
    }
  ],

  Video: [
    {
      key: 'source', label: 'Where the video is', kind: 'select', options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'upload', label: 'Uploaded file' }
      ]
    },
    { key: 'videoUrl', label: 'Video file', kind: 'video', full: true, showWhen: { key: 'source', equals: ['upload'] }, help: 'MP4 or WebM, up to 20 MB.' },
    { key: 'videoId', label: 'YouTube link or ID', kind: 'text', full: true, placeholder: 'https://youtube.com/watch?v=…', showWhen: { key: 'source', equals: ['youtube'], fallback: 'youtube' } },
    {
      key: 'aspectRatio', label: 'Shape', kind: 'select', options: [
        { value: '16 / 9', label: '16:9 (widescreen)' },
        { value: '4 / 3', label: '4:3' },
        { value: '1 / 1', label: '1:1 (square)' },
        { value: '9 / 16', label: '9:16 (vertical)' }
      ]
    },
    { key: 'autoplay', label: 'Start playing on its own', kind: 'toggle' }
  ],

  AnnouncementBar: [
    { key: 'text', label: 'Message', kind: 'bilingual', full: true, placeholder: 'Free shipping on orders over 500' },
    { key: 'link', label: 'Goes to', kind: 'text', placeholder: '/products' },
    { key: 'dismissible', label: 'Shoppers can close it', kind: 'toggle' },
    { key: 'bg', label: 'Background colour', kind: 'color' },
    { key: 'textColor', label: 'Text colour', kind: 'color' }
  ],

  Countdown: [
    TITLE('Hurry — offer ends in', 'أسرع، ينتهي العرض خلال'),
    {
      key: 'mode', label: 'Timer type', kind: 'select', options: [
        { value: 'fixed', label: 'Counts down to a date' },
        { value: 'evergreen', label: 'Restarts for each visitor' }
      ]
    },
    { key: 'endsAt', label: 'Ends at', kind: 'datetime', showWhen: { key: 'mode', equals: ['fixed'], fallback: 'fixed' } },
    { key: 'durationMinutes', label: 'Minutes per visitor', kind: 'number', min: 1, showWhen: { key: 'mode', equals: ['evergreen'] } },
    {
      key: 'expiredBehavior', label: 'When it runs out', kind: 'select', options: [
        { value: 'message', label: 'Show a message' },
        { value: 'hide', label: 'Hide the section' }
      ]
    },
    { key: 'expiredText', label: 'Message', kind: 'bilingual', full: true, placeholder: 'Offer ended', showWhen: { key: 'expiredBehavior', equals: ['message'], fallback: 'message' } }
  ],

  RichText: [
    { key: 'html', label: 'Text', kind: 'richText', full: true }
  ],

  CtaButton: [
    { key: 'text', label: 'Button text', kind: 'bilingual', full: true, placeholder: 'Buy now' },
    {
      key: 'style', label: 'Look', kind: 'select', options: [
        { value: 'primary', label: 'Filled' },
        { value: 'outline', label: 'Outline' },
        { value: 'dark', label: 'Dark' },
        { value: 'whatsapp', label: 'WhatsApp green' }
      ]
    },
    {
      key: 'action', label: 'What it does', kind: 'select', options: [
        { value: 'link', label: 'Opens a link' },
        { value: 'anchor', label: 'Scrolls to a section' },
        { value: 'whatsapp', label: 'Opens WhatsApp' },
        { value: 'phone', label: 'Starts a call' }
      ]
    },
    { key: 'link', label: 'Link', kind: 'text', placeholder: '/products', showWhen: { key: 'action', equals: ['link'], fallback: 'link' } },
    { key: 'anchor', label: 'Scrolls to', kind: 'text', placeholder: 'order-form', showWhen: { key: 'action', equals: ['anchor'] } },
    { key: 'whatsapp', label: 'WhatsApp number', kind: 'text', placeholder: '201000000000', help: 'Country code, no plus sign.', showWhen: { key: 'action', equals: ['whatsapp'] } },
    { key: 'message', label: 'Message to prefill', kind: 'bilingual', full: true, placeholder: "I'd like to order…", showWhen: { key: 'action', equals: ['whatsapp'] } },
    { key: 'phone', label: 'Phone number', kind: 'text', placeholder: '+20 100 000 0000', showWhen: { key: 'action', equals: ['phone'] } }
  ],

  Stats: [
    TITLE('Trusted by thousands', 'موثوق من الآلاف'),
    {
      key: 'items', label: 'Numbers', kind: 'list', full: true,
      addLabel: 'Add a number', itemNoun: 'Number',
      newItem: { prefix: '', value: '', suffix: '', label: bilingualPair() },
      itemFields: [
        { key: 'prefix', label: 'Before', kind: 'text', placeholder: '+' },
        { key: 'value', label: 'Number', kind: 'text', placeholder: '12000' },
        { key: 'suffix', label: 'After', kind: 'text', placeholder: 'k' },
        { key: 'label', label: 'What it counts', kind: 'bilingual', full: true, placeholder: 'Orders delivered' }
      ]
    }
  ],

  Comparison: [
    TITLE('Why we are different', 'لماذا نحن مختلفون'),
    { key: 'usLabel', label: 'Your column', kind: 'bilingual', full: true, placeholder: 'Us' },
    { key: 'themLabel', label: 'Their column', kind: 'bilingual', full: true, placeholder: 'Others' },
    {
      key: 'rows', label: 'Rows', kind: 'list', full: true,
      addLabel: 'Add a row', itemNoun: 'Row',
      newItem: { feature: bilingualPair(), us: true, them: false },
      itemFields: [
        { key: 'feature', label: 'What you are comparing', kind: 'bilingual', full: true, placeholder: 'Free delivery' },
        { key: 'us', label: 'We have it', kind: 'toggle' },
        { key: 'them', label: 'They have it', kind: 'toggle' }
      ]
    }
  ],

  BeforeAfter: [
    { key: 'beforeUrl', label: 'Before image', kind: 'image', full: true },
    { key: 'afterUrl', label: 'After image', kind: 'image', full: true },
    { key: 'beforeLabel', label: 'Before label', kind: 'bilingual', full: true, placeholder: 'Before' },
    { key: 'afterLabel', label: 'After label', kind: 'bilingual', full: true, placeholder: 'After' }
  ],

  Image: [
    { key: 'imageUrl', label: 'Image', kind: 'image', full: true },
    { key: 'link', label: 'Goes to', kind: 'text', placeholder: '/products' },
    { key: 'alt', label: 'Image description', kind: 'text', seo: true, help: 'Read aloud by screen readers.' },
    { key: 'caption', label: 'Caption', kind: 'bilingual', full: true }
  ],

  Specs: [
    TITLE('Specifications', 'المواصفات'),
    { key: 'groups', label: 'Specification groups', kind: 'specGroups', full: true }
  ],

  Marquee: [
    {
      key: 'speed', label: 'Speed', kind: 'select', options: [
        { value: 'slow', label: 'Slow' },
        { value: 'normal', label: 'Normal' },
        { value: 'fast', label: 'Fast' }
      ]
    },
    { key: 'separator', label: 'Between messages', kind: 'text', placeholder: '★' },
    { key: 'bg', label: 'Background colour', kind: 'color' },
    { key: 'textColor', label: 'Text colour', kind: 'color' },
    {
      key: 'messages', label: 'Messages', kind: 'list', full: true,
      addLabel: 'Add a message', itemNoun: 'Message',
      newItem: { text: bilingualPair() },
      itemFields: [
        { key: 'text', label: 'Message', kind: 'bilingual', full: true, placeholder: 'Free returns within 14 days' }
      ]
    }
  ],

  OrderForm: [
    { key: 'productSlug', label: 'Product', kind: 'product', full: true, help: 'Leave empty on a product page to use that product.' },
    { key: 'heading', label: 'Heading', kind: 'bilingual', full: true, placeholder: 'Complete your order' },
    { key: 'buttonText', label: 'Button text', kind: 'bilingual', full: true, placeholder: 'Order now' },
    { key: 'showImage', label: 'Show the product photo', kind: 'toggle', defaultOn: true },
    { key: 'showQuantity', label: 'Let shoppers choose quantity', kind: 'toggle', defaultOn: true }
  ],

  StickyBar: [
    { key: 'productSlug', label: 'Product', kind: 'product', full: true, help: 'Leave empty on a product page to use that product.' },
    { key: 'buttonText', label: 'Button text', kind: 'bilingual', full: true, placeholder: 'Add to cart' }
  ],

  Bundle: [
    { key: 'productSlug', label: 'Product', kind: 'product', full: true, help: 'Leave empty on a product page to use that product.' },
    TITLE('Choose your offer', 'اختر عرضك'),
    {
      key: 'tiers', label: 'Offers', kind: 'list', full: true,
      addLabel: 'Add an offer', itemNoun: 'Offer',
      newItem: { qty: 1, label: bilingualPair(), badge: bilingualPair(), highlight: false },
      itemFields: [
        { key: 'qty', label: 'Quantity', kind: 'number', min: 1 },
        { key: 'highlight', label: 'Highlight this one', kind: 'toggle' },
        { key: 'label', label: 'Offer name', kind: 'bilingual', full: true, placeholder: 'Two pieces' },
        { key: 'badge', label: 'Badge', kind: 'bilingual', full: true, placeholder: 'Most popular' }
      ]
    }
  ]
};

// ── Header and footer ──────────────────────────────────────────────────────

SECTION_SCHEMAS['HeaderBar'] = [
  { key: 'showName', label: 'Show the store name beside the logo', kind: 'toggle', defaultOn: true },
  { key: 'sticky', label: 'Stay visible while scrolling', kind: 'toggle', defaultOn: true },
  { key: 'showCart', label: 'Show the cart', kind: 'toggle', defaultOn: true },
  { key: 'showAccount', label: 'Show the account link', kind: 'toggle', defaultOn: true },
  { key: 'showLanguage', label: 'Show the language switcher', kind: 'toggle', defaultOn: true },
  {
    key: 'blocks', label: 'Menu links', kind: 'blocks', full: true,
    addLabel: 'Add a link', itemNoun: 'Link',
    help: 'With no links added, the header lists your store pages.',
    blockTypes: [{
      type: 'link',
      label: 'Menu link',
      newBlock: { label: bilingualPair(), url: '/products' },
      fields: [
        { key: 'label', label: 'Link text', kind: 'bilingual', full: true, placeholder: 'Shop' },
        { key: 'url', label: 'Goes to', kind: 'text', full: true, placeholder: '/products' }
      ]
    }]
  }
];

SECTION_SCHEMAS['FooterColumns'] = [
  { key: 'showStoreBlurb', label: 'Show the store name and description', kind: 'toggle', defaultOn: true, full: true },
  {
    key: 'blocks', label: 'Columns', kind: 'blocks', full: true,
    addLabel: 'Add a column', itemNoun: 'Column',
    help: 'With no columns added, the footer lists your store pages.',
    blockTypes: [
      {
        type: 'links',
        label: 'Column of links',
        newBlock: { title: bilingualPair(), links: [] },
        fields: [
          { key: 'title', label: 'Column heading', kind: 'bilingual', full: true, placeholder: 'Shop' },
          {
            key: 'links', label: 'Links', kind: 'list', full: true,
            addLabel: 'Add a link', itemNoun: 'Link',
            newItem: { label: bilingualPair(), url: '' },
            itemFields: [
              { key: 'label', label: 'Link text', kind: 'bilingual', full: true },
              { key: 'url', label: 'Goes to', kind: 'text', full: true, placeholder: '/products' }
            ]
          }
        ]
      },
      {
        type: 'text',
        label: 'Column of text',
        newBlock: { title: bilingualPair(), text: bilingualPair() },
        fields: [
          { key: 'title', label: 'Column heading', kind: 'bilingual', full: true },
          { key: 'text', label: 'Text', kind: 'bilingualArea', full: true }
        ]
      }
    ]
  }
];

SECTION_SCHEMAS['FooterSocial'] = [
  {
    key: 'title', label: 'Heading', kind: 'bilingual', full: true, placeholder: 'Follow us',
    help: 'The accounts themselves come from your store settings.'
  }
];

SECTION_SCHEMAS['Copyright'] = [
  {
    key: 'text', label: 'Closing line', kind: 'bilingual', full: true,
    placeholder: '© {year} {store}. All rights reserved.',
    help: 'Write {year} for the current year and {store} for your store name.'
  }
];

export function schemaFor(sectionType: string): SectionField[] {
  return SECTION_SCHEMAS[sectionType] ?? [];
}
