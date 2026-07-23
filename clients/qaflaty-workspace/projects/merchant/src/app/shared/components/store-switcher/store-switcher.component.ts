import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Store switcher shown at the top of the coloured rail. The active store's
 * brand colour is used for the chip so the merchant always recognises which
 * store they are working in. Split out of the previous inline-template version.
 *
 * Behaviour is unchanged — it still reads StoreContextService and calls
 * selectStore(); only the markup/styles were moved into separate files and
 * restyled to the rail token palette.
 */
@Component({
  selector: 'app-store-switcher',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './store-switcher.component.html',
  styleUrl: './store-switcher.component.scss',
})
export class StoreSwitcherComponent {
  storeContext = inject(StoreContextService);
  dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  onSelectStore(storeId: string): void {
    this.storeContext.selectStore(storeId);
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-store-switcher')) {
      this.dropdownOpen.set(false);
    }
  }
}
