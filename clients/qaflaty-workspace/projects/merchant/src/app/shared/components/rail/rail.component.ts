import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';
import { StoreSwitcherComponent } from '../store-switcher/store-switcher.component';
import { handleNavKeydown } from '../shell/nav-keyboard';
import { NavBadgeCounts, NavStateService } from '../shell/nav-state.service';
import { isNavGroup, NavGroup } from '../shell/nav.config';

/**
 * The coloured desktop sidebar: brand, store switcher, the pinned destinations
 * (Home, Orders, Live Chat) and the collapsible groups holding everything else,
 * with a user block at the foot. Every destination is at most one group expand
 * away. Hidden below the `lg` breakpoint (mobile uses the bottom nav + drawer).
 */
@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [NgClass, RouterLink, TranslocoPipe, IconComponent, StoreSwitcherComponent],
  templateUrl: './rail.component.html',
  styleUrl: './rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent {
  private readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nav = inject(NavStateService);

  /** Counts feeding item badges; groups sum their children while collapsed. */
  readonly badges = input<NavBadgeCounts>({});

  protected readonly merchant = this.auth.currentMerchant;
  protected readonly entries = this.nav.entries;
  protected readonly firstGroupId = this.nav.firstGroupId;

  protected readonly isGroup = isNavGroup;

  /** A collapsed group holding the active route gets a subtle active marker. */
  protected showsCollapsedActive(group: NavGroup): boolean {
    return !this.nav.isExpanded(group.id) && this.nav.activeGroupId() === group.id;
  }

  protected onKeydown(event: KeyboardEvent): void {
    handleNavKeydown(event, this.host.nativeElement);
  }
}
