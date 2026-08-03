import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import {
  isNavGroup,
  MERCHANT_NAV,
  NavBadgeKey,
  NavEntry,
  NavGroup,
  NavItem,
} from './nav.config';

/** Counts feeding item badges, keyed by {@link NavBadgeKey}. */
export type NavBadgeCounts = Partial<Record<NavBadgeKey, number>>;

const STORAGE_PREFIX = 'qaflaty.nav.expanded';

/**
 * Owns everything the sidebar needs beyond the static config: permission
 * filtering, which item/group the current URL belongs to, and which groups are
 * expanded (persisted per merchant + store).
 *
 * Shared by the desktop rail and the mobile drawer so both render the same IA
 * and stay in sync on expansion.
 */
@Injectable({ providedIn: 'root' })
export class NavStateService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly storeContext = inject(StoreContextService);

  /** Current URL without query/fragment, refreshed on every navigation. */
  private readonly url = signal(this.stripUrl(this.router.url));

  /** Groups the merchant has explicitly opened (or that auto-expanded). */
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  /**
   * Authority comes from owning the active store — there is no role claim on the
   * token. Mirrors the rule the previous drawer applied to the Team entry.
   */
  private readonly isStoreOwner = computed(() => {
    const merchant = this.auth.currentMerchant();
    const store = this.storeContext.currentStore();
    return !!merchant && !!store && store.merchantId === merchant.id;
  });

  /**
   * The config with unpermitted items removed. A group whose children all drop
   * out disappears entirely rather than rendering an empty header.
   */
  readonly entries = computed<NavEntry[]>(() => {
    const owner = this.isStoreOwner();
    const permitted = (item: NavItem) => !item.ownerOnly || owner;

    return MERCHANT_NAV.reduce<NavEntry[]>((acc, entry) => {
      if (!isNavGroup(entry)) {
        if (permitted(entry)) acc.push(entry);
        return acc;
      }
      const items = entry.items.filter(permitted);
      if (items.length) acc.push({ ...entry, items });
      return acc;
    }, []);
  });

  /** First group in render order — the divider hangs off it. */
  readonly firstGroupId = computed(
    () => this.entries().find(isNavGroup)?.id ?? null,
  );

  /**
   * The active item is the one whose route is the longest prefix of the current
   * URL, so `/products/categories` highlights Categories rather than Products,
   * and `/products/42` still highlights Products.
   */
  readonly activeItemId = computed<string | null>(() => {
    const url = this.url();
    let best: NavItem | null = null;

    for (const item of this.allItems()) {
      if (!this.matches(item.route, url)) continue;
      if (!best || item.route.length > best.route.length) best = item;
    }
    return best?.id ?? null;
  });

  /** Group owning the active item, if the active item lives in one. */
  readonly activeGroupId = computed<string | null>(() => {
    const itemId = this.activeItemId();
    if (!itemId) return null;
    return (
      this.entries()
        .filter(isNavGroup)
        .find((group) => group.items.some((item) => item.id === itemId))?.id ?? null
    );
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.url.set(this.stripUrl(e.urlAfterRedirects)));

    // Restore the persisted expansion and layer the active route's group on top
    // of it. Deliberately one effect, not two: the storage key only resolves
    // once the merchant and store signals settle (which happens *after* the
    // first navigation), so a separate restore pass would land last and wipe the
    // auto-expanded group.
    //
    // Re-runs on navigation to another group and on login/store switch. It does
    // not read `expandedIds`, so a manual collapse is not clobbered — and since
    // the collapse was persisted, the next re-run reads it back.
    effect(() => {
      const key = this.storageKey();
      const restored = new Set(key ? this.read(key) : []);

      const activeGroup = this.activeGroupId();
      if (activeGroup) restored.add(activeGroup);

      this.commit(restored);
    });
  }

  isExpanded(groupId: string): boolean {
    return this.expandedIds().has(groupId);
  }

  toggle(groupId: string): void {
    const next = new Set(this.expandedIds());
    if (!next.delete(groupId)) next.add(groupId);
    this.commit(next);
  }

  isActive(itemId: string): boolean {
    return this.activeItemId() === itemId;
  }

  /**
   * Badge for a single item, or 0 when it has no source. Collapsed group headers
   * show the sum of their children instead — see {@link groupBadge}.
   */
  itemBadge(item: NavItem, counts: NavBadgeCounts): number {
    return item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
  }

  groupBadge(group: NavGroup, counts: NavBadgeCounts): number {
    return group.items.reduce((sum, item) => sum + this.itemBadge(item, counts), 0);
  }

  private commit(next: ReadonlySet<string>): void {
    this.expandedIds.set(next);
    const key = this.storageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {
      // Storage unavailable (private mode, quota) — expansion just won't persist.
    }
  }

  private read(key: string): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set();
    } catch {
      return new Set();
    }
  }

  /** Keyed per merchant + store so two accounts on one browser don't collide. */
  private storageKey(): string | null {
    const merchantId = this.auth.currentMerchant()?.id;
    if (!merchantId) return null;
    return `${STORAGE_PREFIX}.${merchantId}.${this.storeContext.currentStore()?.id ?? 'none'}`;
  }

  private allItems(): NavItem[] {
    return this.entries().flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry]));
  }

  private matches(route: string, url: string): boolean {
    return url === route || url.startsWith(`${route}/`);
  }

  private stripUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }
}
