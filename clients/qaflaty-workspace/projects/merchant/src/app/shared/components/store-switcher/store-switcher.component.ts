import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';

@Component({
  selector: 'app-store-switcher',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative px-3 mb-4">
      <!-- Trigger button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
        @if (storeContext.loading()) {
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-md bg-gray-200 animate-pulse"></div>
            <span class="text-sm text-gray-400">Loading...</span>
          </div>
        } @else if (storeContext.currentStore(); as store) {
          <div class="flex items-center space-x-2 min-w-0">
            <div
              class="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              [style.background-color]="store.branding.primaryColor"
            >
              {{ store.name.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium text-gray-900 truncate">
              {{ store.name }}
            </span>
          </div>
        } @else {
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-md bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
              ?
            </div>
            <span class="text-sm text-gray-500">No store selected</span>
          </div>
        }
        <svg
          class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform"
          [class.rotate-180]="dropdownOpen()"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown -->
      @if (dropdownOpen()) {
        <div class="absolute left-3 right-3 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          @for (store of storeContext.stores(); track store.id) {
            <button
              type="button"
              (click)="onSelectStore(store.id)"
              class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              [class.bg-primary-50]="store.id === storeContext.currentStoreId()"
            >
              <div
                class="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                [style.background-color]="store.branding.primaryColor"
              >
                {{ store.name.charAt(0).toUpperCase() }}
              </div>
              <span
                class="ml-2 text-sm truncate"
                [class.font-semibold]="store.id === storeContext.currentStoreId()"
                [class.text-primary-700]="store.id === storeContext.currentStoreId()"
                [class.text-gray-700]="store.id !== storeContext.currentStoreId()"
              >
                {{ store.name }}
              </span>
              @if (store.id === storeContext.currentStoreId()) {
                <svg class="ml-auto w-4 h-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              }
            </button>
          }

          @if (storeContext.stores().length > 0) {
            <hr class="my-1 border-gray-100">
          }

          <a
            routerLink="/stores/create"
            (click)="dropdownOpen.set(false)"
            class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors text-primary-600"
          >
            <div class="w-7 h-7 rounded-md border-2 border-dashed border-primary-300 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="ml-2 text-sm font-medium">Create New Store</span>
          </a>
        </div>
      }
    </div>
  `
})
export class StoreSwitcherComponent {
  storeContext = inject(StoreContextService);
  dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
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
