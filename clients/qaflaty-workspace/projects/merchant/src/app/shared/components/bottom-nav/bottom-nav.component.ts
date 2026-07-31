import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';
import { BOTTOM_NAV } from '../shell/nav.config';

/**
 * Mobile bottom navigation: four core destinations plus a "More" trigger that
 * opens the shared nav drawer. Shown only below the `lg` breakpoint.
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
  readonly chatUnread = input<number>(0);
  readonly more = output<void>();

  protected readonly items = BOTTOM_NAV;
}
