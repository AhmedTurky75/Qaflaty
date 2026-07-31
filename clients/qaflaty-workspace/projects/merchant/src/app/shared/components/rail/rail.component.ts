import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';
import { StoreSwitcherComponent } from '../store-switcher/store-switcher.component';
import { CORE_NAV } from '../shell/nav.config';

/**
 * The coloured desktop sidebar. Shows the brand, store switcher, the six core
 * destinations (icon + always-visible text label) and a user block at the foot.
 * Everything beyond the six lives behind the "More" button, which opens the
 * shared nav drawer. Hidden below the `lg` breakpoint (mobile uses the bottom
 * nav + drawer instead).
 */
@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, IconComponent, StoreSwitcherComponent],
  templateUrl: './rail.component.html',
  styleUrl: './rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent {
  private readonly auth = inject(AuthService);

  /** Unread chat count — surfaces a dot on the "More" entry. */
  readonly chatUnread = input<number>(0);
  /** Fired when the merchant opens the "More" area. */
  readonly more = output<void>();

  protected readonly coreNav = CORE_NAV;
  protected readonly merchant = this.auth.currentMerchant;
}
