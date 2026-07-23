import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../icon/icon.component';

interface Crumb {
  /** i18n key (translated in template) — set for known segments. */
  key?: string;
  /** Literal text — set for dynamic segments (store name, detail ids). */
  text?: string;
  /** Router link, or null for the current (last) crumb. */
  url: string | null;
  last?: boolean;
  ellipsis?: boolean;
}

/** URL segment → i18n label key. Reuses the nav.* keys where they line up. */
const LABEL_KEYS: Record<string, string> = {
  dashboard: 'nav.home',
  orders: 'nav.orders',
  products: 'nav.products',
  customers: 'nav.customers',
  stores: 'nav.stores',
  settings: 'nav.settings',
  returns: 'nav.returns',
  reviews: 'nav.reviews',
  'promo-codes': 'nav.promoCodes',
  chat: 'nav.chat',
  'store-builder': 'nav.builder',
  ads: 'nav.ads',
  'active-carts': 'nav.activeCarts',
  live: 'nav.live',
  team: 'nav.team',
  new: 'crumb.new',
  create: 'crumb.create',
  categories: 'crumb.categories',
  profile: 'crumb.profile',
  password: 'crumb.password',
  notifications: 'crumb.notifications',
  'cross-sell': 'crumb.crossSell',
  upsell: 'crumb.upsell',
  downsell: 'crumb.downsell',
  related: 'crumb.related',
};

const isId = (seg: string): boolean =>
  /^\d+$/.test(seg) || /^[0-9a-f]{8}-/i.test(seg) || seg.length >= 20;

const titleCase = (seg: string): string =>
  decodeURIComponent(seg)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Breadcrumb driven by the router URL. Rules (Design System §04):
 *  - First crumb is always Home; the second is always the active store name
 *    (a redundant store-context cue), then the route trail.
 *  - Beyond four levels the middle collapses to an expandable "…".
 *  - On mobile it collapses to a back-chevron + the current page.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly storeContext = inject(StoreContextService);

  private readonly url = signal(this.router.url);
  protected readonly expanded = signal(false);

  protected readonly crumbs = computed<Crumb[]>(() => this.build(this.url()));

  /** Collapsed view: Home + … + last two, unless expanded or short. */
  protected readonly visible = computed<Crumb[]>(() => {
    const cs = this.crumbs();
    if (this.expanded() || cs.length <= 4) return cs;
    return [cs[0], { url: null, ellipsis: true }, cs[cs.length - 2], cs[cs.length - 1]];
  });

  /** Parent crumb for the mobile back-chevron. */
  protected readonly parent = computed<Crumb | null>(() => {
    const cs = this.crumbs();
    return cs.length > 1 ? cs[cs.length - 2] : null;
  });

  protected readonly current = computed<Crumb | null>(() => {
    const cs = this.crumbs();
    return cs.length ? cs[cs.length - 1] : null;
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.expanded.set(false);
      });
  }

  protected expand(): void {
    this.expanded.set(true);
  }

  private build(rawUrl: string): Crumb[] {
    const path = rawUrl.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);

    const crumbs: Crumb[] = [{ key: 'nav.home', url: '/dashboard' }];

    const store = this.storeContext.currentStore();
    if (store) {
      crumbs.push({ text: store.name, url: '/dashboard' });
    }

    let acc = '';
    for (const seg of segments) {
      acc += '/' + seg;
      if (seg === 'dashboard') continue; // Home already represents it
      if (LABEL_KEYS[seg]) {
        crumbs.push({ key: LABEL_KEYS[seg], url: acc });
      } else if (isId(seg)) {
        crumbs.push({ key: 'crumb.detail', url: acc });
      } else {
        crumbs.push({ text: titleCase(seg), url: acc });
      }
    }

    if (crumbs.length) {
      const last = crumbs[crumbs.length - 1];
      last.last = true;
      last.url = null;
    }
    return crumbs;
  }
}
