/**
 * Navigation information architecture for the merchant shell.
 *
 * A handful of everyday destinations stay pinned and flat at the top; everything
 * else lives in a named, collapsible group. Routes are UNCHANGED — this is
 * presentation-only grouping, and every entry points at a route that already
 * exists in `app.routes.ts`.
 */

/** Sources a count badge can be fed from. Keyed lookup so groups can sum them. */
export type NavBadgeKey = 'chat';

/** A leaf destination. Pinned entries are bare NavItems in {@link MERCHANT_NAV}. */
export interface NavItem {
  /** Stable identifier — used for tracking and for active/expansion lookups. */
  id: string;
  /** i18n key for the visible text label. */
  labelKey: string;
  /** Icon name understood by <app-icon>. */
  icon: string;
  /** Router path — must match the existing route exactly. */
  route: string;
  /** Optional count-badge source. */
  badgeKey?: NavBadgeKey;
  /** Only shown when the merchant owns the active store. */
  ownerOnly?: boolean;
}

/** A named, collapsible set of destinations. Headers never navigate. */
export interface NavGroup {
  id: string;
  labelKey: string;
  icon: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

/** Discriminates the union for the template and the state service. */
export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

/**
 * The whole sidebar, in render order: pinned items first, then groups ordered by
 * how often a merchant needs them, with Settings last.
 *
 * Only Live Chat carries a badge today — `MerchantChatService.totalUnreadCount`
 * is the sole count source in the app. Group headers sum the badges of their
 * children, so a future `badgeKey` on a grouped item bubbles up with no further
 * change here.
 */
export const MERCHANT_NAV: NavEntry[] = [
  // ── Pinned / hot access ────────────────────────────────────────────────────
  { id: 'home', labelKey: 'nav.home', icon: 'home', route: '/dashboard' },
  { id: 'orders', labelKey: 'nav.orders', icon: 'orders', route: '/orders' },
  { id: 'chat', labelKey: 'nav.chat', icon: 'chat', route: '/chat', badgeKey: 'chat' },

  // ── Groups ─────────────────────────────────────────────────────────────────
  {
    id: 'sales',
    labelKey: 'nav.group.sales',
    icon: 'orders',
    items: [
      { id: 'live', labelKey: 'nav.live', icon: 'live', route: '/live' },
      { id: 'active-carts', labelKey: 'nav.activeCarts', icon: 'active-carts', route: '/active-carts' },
      { id: 'returns', labelKey: 'nav.returns', icon: 'returns', route: '/returns' },
    ],
  },
  {
    id: 'catalog',
    labelKey: 'nav.group.catalog',
    icon: 'products',
    items: [
      { id: 'products', labelKey: 'nav.products', icon: 'products', route: '/products' },
      { id: 'categories', labelKey: 'nav.categories', icon: 'folder', route: '/products/categories' },
    ],
  },
  {
    id: 'audience',
    labelKey: 'nav.group.customers',
    icon: 'customers',
    items: [
      { id: 'customers', labelKey: 'nav.customers', icon: 'customers', route: '/customers' },
      { id: 'reviews', labelKey: 'nav.reviews', icon: 'reviews', route: '/reviews' },
      { id: 'blocked-phones', labelKey: 'nav.blockedPhones', icon: 'phone-off', route: '/blocked-phones' },
    ],
  },
  {
    id: 'marketing',
    labelKey: 'nav.group.marketing',
    icon: 'promo',
    items: [
      { id: 'promo-codes', labelKey: 'nav.promoCodes', icon: 'promo', route: '/promo-codes' },
      { id: 'ads', labelKey: 'nav.ads', icon: 'ads', route: '/ads' },
    ],
  },
  {
    id: 'storefront',
    labelKey: 'nav.group.storefront',
    icon: 'builder',
    items: [
      { id: 'builder', labelKey: 'nav.builder', icon: 'builder', route: '/store-builder' },
      { id: 'stores', labelKey: 'nav.stores', icon: 'stores', route: '/stores' },
      { id: 'team', labelKey: 'nav.team', icon: 'team', route: '/stores/team', ownerOnly: true },
    ],
  },
  {
    id: 'settings',
    labelKey: 'nav.group.settings',
    icon: 'settings',
    items: [
      { id: 'store-settings', labelKey: 'settings.stores', icon: 'stores', route: '/settings/stores' },
      { id: 'profile', labelKey: 'settings.profile', icon: 'user', route: '/settings/profile' },
      { id: 'notifications', labelKey: 'settings.notifications', icon: 'bell', route: '/settings/notifications' },
    ],
  },
];

/**
 * Mobile bottom-bar destinations — the pinned entries, which is also the set
 * that must never hide inside a group. A "More" trigger opening the full grouped
 * drawer is rendered alongside them.
 */
export const BOTTOM_NAV: NavItem[] = MERCHANT_NAV.filter(
  (entry): entry is NavItem => !isNavGroup(entry),
);
