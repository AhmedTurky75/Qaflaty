/**
 * Navigation information architecture for the merchant shell (Direction C).
 *
 * The rail surfaces six core destinations; every other feature stays reachable
 * at its original route but folds into the "More" area. Routes are UNCHANGED —
 * this is presentation-only grouping.
 */
export interface NavItem {
  /** i18n key for the visible text label. */
  labelKey: string;
  /** Icon name understood by <app-icon>. */
  icon: string;
  /** Router path — must match the existing route exactly. */
  route: string;
  /** Optional badge source (currently only 'chat' for unread messages). */
  badge?: 'chat';
  /** Only shown when the merchant owns the active store. */
  ownerOnly?: boolean;
}

/** The six core rail destinations. */
export const CORE_NAV: NavItem[] = [
  { labelKey: 'nav.home', icon: 'home', route: '/dashboard' },
  { labelKey: 'nav.orders', icon: 'orders', route: '/orders' },
  { labelKey: 'nav.products', icon: 'products', route: '/products' },
  { labelKey: 'nav.customers', icon: 'customers', route: '/customers' },
  { labelKey: 'nav.stores', icon: 'stores', route: '/stores' },
  { labelKey: 'nav.settings', icon: 'settings', route: '/settings' },
];

/** Mobile bottom-bar destinations (4 + a More trigger rendered separately). */
export const BOTTOM_NAV: NavItem[] = CORE_NAV.slice(0, 4);

/**
 * Secondary destinations shown in the "More" drawer. Stores & Settings are
 * repeated here so they remain reachable on mobile (where they are not in the
 * bottom bar); on desktop the drawer hides them since the rail already has them.
 */
export const MORE_NAV: NavItem[] = [
  { labelKey: 'nav.stores', icon: 'stores', route: '/stores' },
  { labelKey: 'nav.settings', icon: 'settings', route: '/settings' },
  { labelKey: 'nav.live', icon: 'live', route: '/live' },
  { labelKey: 'nav.activeCarts', icon: 'active-carts', route: '/active-carts' },
  { labelKey: 'nav.returns', icon: 'returns', route: '/returns' },
  { labelKey: 'nav.reviews', icon: 'reviews', route: '/reviews' },
  { labelKey: 'nav.promoCodes', icon: 'promo', route: '/promo-codes' },
  { labelKey: 'nav.chat', icon: 'chat', route: '/chat', badge: 'chat' },
  { labelKey: 'nav.builder', icon: 'builder', route: '/store-builder' },
  { labelKey: 'nav.ads', icon: 'ads', route: '/ads' },
  { labelKey: 'nav.team', icon: 'team', route: '/stores/team', ownerOnly: true },
];
