import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MORE_NAV, NavItem } from '../../../shared/components/shell/nav.config';

/**
 * Settings ▸ More: a hub of every secondary feature (Live, Active Carts,
 * Returns, Reviews, Promo Codes, Live Chat, Store Builder, Ads, Team). Each
 * links to its existing route — nothing was removed from the app, just folded
 * out of the core rail. Team is owner-only, mirroring the drawer/shell rule.
 */
@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './more.component.html',
  styleUrl: './more.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreComponent {
  private readonly auth = inject(AuthService);
  private readonly storeContext = inject(StoreContextService);

  private readonly isStoreOwner = computed(() => {
    const m = this.auth.currentMerchant();
    const s = this.storeContext.currentStore();
    return !!m && !!s && s.merchantId === m.id;
  });

  /** Secondary features only — Stores/Settings (present in MORE_NAV for the mobile drawer) are excluded here. */
  protected readonly items = computed<NavItem[]>(() =>
    MORE_NAV.filter((i) => i.route !== '/stores' && i.route !== '/settings')
      .filter((i) => !i.ownerOnly || this.isStoreOwner()),
  );
}
