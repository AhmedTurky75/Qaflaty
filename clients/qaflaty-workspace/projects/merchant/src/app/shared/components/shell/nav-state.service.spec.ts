import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { StoreDto, StoreStatus } from 'shared';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { NavStateService } from './nav-state.service';
import { isNavGroup, MERCHANT_NAV, NavGroup, NavItem } from './nav.config';

const MERCHANT_ID = 'm-1';

function storeDto(merchantId = MERCHANT_ID): StoreDto {
  return {
    id: 'store-1',
    merchantId,
    slug: 'demo',
    name: 'Demo store',
    branding: { primaryColor: '#7c3aed' },
    status: StoreStatus.Active,
    isMaintenanceMode: false,
    deliverySettings: { deliveryFee: { amount: 20, currency: 'EGP' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    currency: 'EGP',
    currencySymbol: 'ج.م',
  };
}

const groups = (): NavGroup[] => MERCHANT_NAV.filter(isNavGroup);
const pinned = (): NavItem[] => MERCHANT_NAV.filter((e): e is NavItem => !isNavGroup(e));
const allItems = (): NavItem[] =>
  MERCHANT_NAV.flatMap((e) => (isNavGroup(e) ? e.items : [e]));

describe('MERCHANT_NAV', () => {
  it('pins 3–4 everyday destinations, including Orders and Chat', () => {
    const ids = pinned().map((i) => i.id);
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(ids.length).toBeLessThanOrEqual(4);
    expect(ids).toContain('orders');
    expect(ids).toContain('chat');
  });

  it('has 5–8 groups with Settings last', () => {
    const gs = groups();
    expect(gs.length).toBeGreaterThanOrEqual(5);
    expect(gs.length).toBeLessThanOrEqual(8);
    expect(gs[gs.length - 1].id).toBe('settings');
  });

  it('gives every group 2–8 children (a single child would not be a group)', () => {
    for (const group of groups()) {
      expect(group.items.length).toBeGreaterThanOrEqual(2);
      expect(group.items.length).toBeLessThanOrEqual(8);
    }
  });

  it('renders pinned entries before any group', () => {
    const firstGroup = MERCHANT_NAV.findIndex(isNavGroup);
    expect(MERCHANT_NAV.slice(0, firstGroup).every((e) => !isNavGroup(e))).toBeTrue();
    expect(MERCHANT_NAV.slice(firstGroup).every(isNavGroup)).toBeTrue();
  });

  it('keeps ids and routes unique — an item belongs to exactly one group', () => {
    const ids = allItems().map((i) => i.id);
    const routes = allItems().map((i) => i.route);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('carries over every destination the old flat list exposed', () => {
    const routes = new Set(allItems().map((i) => i.route));
    for (const route of [
      '/dashboard', '/orders', '/products', '/customers', '/stores', '/live',
      '/active-carts', '/returns', '/reviews', '/promo-codes', '/chat',
      '/store-builder', '/ads', '/stores/team',
    ]) {
      expect(routes.has(route)).withContext(route).toBeTrue();
    }
  });
});

describe('NavStateService', () => {
  let auth: AuthService;
  let storeContext: StoreContextService;
  let router: Router;

  function setUp(url = '/dashboard') {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    storeContext = TestBed.inject(StoreContextService);
    router = TestBed.inject(Router);

    auth.currentMerchant.set({ id: MERCHANT_ID } as never);
    storeContext.currentStore.set(storeDto());
    spyOnProperty(router, 'url', 'get').and.returnValue(url);

    const nav = TestBed.inject(NavStateService);
    TestBed.tick(); // settle the restore / auto-expand effect
    return nav;
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('resolves the active item by longest matching route', () => {
    expect(setUp('/products/categories').activeItemId()).toBe('categories');
  });

  it('keeps a parent highlighted on its own detail routes', () => {
    expect(setUp('/products/42').activeItemId()).toBe('products');
  });

  it('ignores query strings and fragments', () => {
    expect(setUp('/orders?status=new#top').activeItemId()).toBe('orders');
  });

  it('auto-expands the group holding the active route', () => {
    const nav = setUp('/promo-codes');
    expect(nav.activeGroupId()).toBe('marketing');
    expect(nav.isExpanded('marketing')).toBeTrue();
  });

  it('persists expansion so it survives a reload', () => {
    const nav = setUp('/dashboard');
    nav.toggle('catalog');
    expect(nav.isExpanded('catalog')).toBeTrue();

    TestBed.resetTestingModule();
    expect(setUp('/dashboard').isExpanded('catalog')).toBeTrue();
  });

  it('keeps a collapsed group collapsed across a reload', () => {
    const nav = setUp('/dashboard');
    nav.toggle('catalog');
    nav.toggle('catalog');

    TestBed.resetTestingModule();
    expect(setUp('/dashboard').isExpanded('catalog')).toBeFalse();
  });

  it('lets the merchant collapse the auto-expanded active group', () => {
    const nav = setUp('/promo-codes');
    nav.toggle('marketing');
    expect(nav.isExpanded('marketing')).toBeFalse();
  });

  it('drops owner-only items — and any group left empty — for non-owners', () => {
    const nav = setUp('/dashboard');
    storeContext.currentStore.set(storeDto('someone-else'));

    const storefront = nav.entries().filter(isNavGroup).find((g) => g.id === 'storefront');
    expect(storefront?.items.some((i) => i.id === 'team')).toBeFalse();
    expect(nav.entries().filter(isNavGroup).every((g) => g.items.length > 0)).toBeTrue();
  });

  it('sums child badges for a collapsed group header', () => {
    const nav = setUp('/dashboard');
    const group: NavGroup = {
      id: 'g', labelKey: 'g', icon: 'orders',
      items: [
        { id: 'a', labelKey: 'a', icon: 'chat', route: '/a', badgeKey: 'chat' },
        { id: 'b', labelKey: 'b', icon: 'chat', route: '/b', badgeKey: 'chat' },
        { id: 'c', labelKey: 'c', icon: 'orders', route: '/c' },
      ],
    };
    expect(nav.groupBadge(group, { chat: 4 })).toBe(8);
    expect(nav.itemBadge(group.items[2], { chat: 4 })).toBe(0);
  });
});
