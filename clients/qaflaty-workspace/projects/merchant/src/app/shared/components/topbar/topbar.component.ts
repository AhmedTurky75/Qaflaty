import { ChangeDetectionStrategy, Component, HostListener, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../icon/icon.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

/**
 * The top bar: mobile hamburger, breadcrumb, a redundant active-store chip,
 * notifications, and the user menu. Auth/store calls are unchanged from the
 * previous shell — only markup and styling moved here.
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent, BreadcrumbComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly storeContext = inject(StoreContextService);

  /** Fired when the mobile hamburger opens the nav drawer. */
  readonly menu = output<void>();

  protected readonly merchant = this.auth.currentMerchant;
  protected readonly currentStore = this.storeContext.currentStore;
  protected readonly userMenuOpen = signal(false);

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  protected logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-user-menu]')) {
      this.userMenuOpen.set(false);
    }
  }
}
