import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';
import { handleNavKeydown } from '../shell/nav-keyboard';
import { NavBadgeCounts, NavStateService } from '../shell/nav-state.service';
import { isNavGroup, NavGroup } from '../shell/nav.config';

/**
 * Slide-in drawer holding the full navigation for mobile, where the rail is
 * hidden. It renders the same config, grouping and expansion state as the rail,
 * so the information architecture is identical on both. Opened from the mobile
 * bottom-nav More button or the topbar hamburger.
 */
@Component({
  selector: 'app-nav-drawer',
  standalone: true,
  imports: [NgClass, RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './nav-drawer.component.html',
  styleUrl: './nav-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavDrawerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nav = inject(NavStateService);

  readonly open = input<boolean>(false);
  readonly badges = input<NavBadgeCounts>({});
  readonly close = output<void>();

  protected readonly entries = this.nav.entries;
  protected readonly firstGroupId = this.nav.firstGroupId;

  protected readonly isGroup = isNavGroup;

  protected showsCollapsedActive(group: NavGroup): boolean {
    return !this.nav.isExpanded(group.id) && this.nav.activeGroupId() === group.id;
  }

  protected onKeydown(event: KeyboardEvent): void {
    handleNavKeydown(event, this.host.nativeElement);
  }
}
