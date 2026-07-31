import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../icon/icon.component';
import { MORE_NAV, NavItem } from '../shell/nav.config';

/**
 * Slide-in drawer holding the "More" destinations — every feature that isn't a
 * core rail item, all reachable at their original routes. Opened from the rail's
 * More button, the mobile bottom-nav More, or the topbar hamburger.
 *
 * The Team entry is owner-only, mirroring the previous shell's rule: authority
 * comes from owning the active store (there is no role claim on the token).
 */
@Component({
  selector: 'app-nav-drawer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, IconComponent],
  templateUrl: './nav-drawer.component.html',
  styleUrl: './nav-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavDrawerComponent {
  private readonly auth = inject(AuthService);
  private readonly storeContext = inject(StoreContextService);

  readonly open = input<boolean>(false);
  readonly chatUnread = input<number>(0);
  readonly close = output<void>();

  private readonly isStoreOwner = computed(() => {
    const m = this.auth.currentMerchant();
    const s = this.storeContext.currentStore();
    return !!m && !!s && s.merchantId === m.id;
  });

  protected readonly items = computed<NavItem[]>(() =>
    MORE_NAV.filter((i) => !i.ownerOnly || this.isStoreOwner()),
  );
}
