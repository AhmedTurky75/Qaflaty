import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';
import { NavBadgeCounts, NavStateService } from '../shell/nav-state.service';
import { BOTTOM_NAV, NavItem } from '../shell/nav.config';

/**
 * Mobile bottom navigation: the pinned destinations plus a trigger that opens
 * the full grouped nav drawer. Shown only below the `lg` breakpoint.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  private readonly nav = inject(NavStateService);

  readonly badges = input<NavBadgeCounts>({});
  readonly more = output<void>();

  protected readonly items = BOTTOM_NAV;

  protected badgeFor(item: NavItem): number {
    return this.nav.itemBadge(item, this.badges());
  }
}
