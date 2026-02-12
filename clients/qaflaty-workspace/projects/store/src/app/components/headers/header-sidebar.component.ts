import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { CartService } from '../../services/cart.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';

@Component({
  selector: 'app-header-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent],
  template: `
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button (click)="sidebarOpen.set(true)" class="p-2 text-gray-700 hover:text-[var(--primary-color)] transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <a routerLink="/" class="flex items-center gap-2">
          @if (store.currentStore()?.branding?.logoUrl) {
            <img [src]="store.currentStore()!.branding.logoUrl" alt="Logo" class="h-8 w-auto" />
          }
          <span class="font-bold text-lg text-gray-900">{{ store.currentStore()?.name }}</span>
        </a>

        <div class="flex items-center gap-3">
          <app-language-switcher />
          @if (features.isCartPageEnabled()) {
            <a routerLink="/cart" class="relative p-2 text-gray-700 hover:text-[var(--primary-color)] transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              @if (cart.itemCount() > 0) {
                <span class="absolute -top-1 -right-1 bg-[var(--primary-color)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {{ cart.itemCount() }}
                </span>
              }
            </a>
          }
        </div>
      </div>
    </header>

    <!-- Sidebar Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity" (click)="sidebarOpen.set(false)"></div>
    }

    <!-- Sidebar -->
    <aside
      [class]="'fixed top-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 ' +
        (i18n.direction() === 'rtl' ? 'right-0 ' : 'left-0 ') +
        (sidebarOpen()
          ? 'translate-x-0'
          : (i18n.direction() === 'rtl' ? 'translate-x-full' : '-translate-x-full'))">
      <div class="h-full flex flex-col">
        <!-- Sidebar Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <a routerLink="/" (click)="sidebarOpen.set(false)" class="flex items-center gap-2">
            @if (store.currentStore()?.branding?.logoUrl) {
              <img [src]="store.currentStore()!.branding.logoUrl" alt="Logo" class="h-8 w-auto" />
            }
            <span class="font-bold text-lg text-gray-900">{{ store.currentStore()?.name }}</span>
          </a>
          <button (click)="sidebarOpen.set(false)" class="p-2 text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Sidebar Navigation -->
        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          <a routerLink="/" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]" [routerLinkActiveOptions]="{exact:true}"
            class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
            {{ t('home') }}
          </a>
          <a routerLink="/products" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
            class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
            {{ t('products') }}
          </a>
          @if (features.isAboutPageEnabled()) {
            <a routerLink="/about" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('about') }}
            </a>
          }
          @if (features.isContactPageEnabled()) {
            <a routerLink="/contact" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('contact') }}
            </a>
          }
          @if (features.isFaqPageEnabled()) {
            <a routerLink="/faq" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('faq') }}
            </a>
          }
          @if (features.isTermsPageEnabled()) {
            <a routerLink="/terms" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('terms') }}
            </a>
          }
          @if (features.isPrivacyPageEnabled()) {
            <a routerLink="/privacy" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('privacy') }}
            </a>
          }
          @if (features.isShippingReturnsPageEnabled()) {
            <a routerLink="/shipping" (click)="sidebarOpen.set(false)" routerLinkActive="bg-gray-100 text-[var(--primary-color)]"
              class="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)] transition-colors">
              {{ t('shipping') }}
            </a>
          }
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-gray-200">
          <!-- Contact info can be added when the Store model supports it -->
        </div>
      </div>
    </aside>
  `
})
export class HeaderSidebarComponent {
  store = inject(StoreService);
  cart = inject(CartService);
  features = inject(FeatureService);
  i18n = inject(I18nService);
  sidebarOpen = signal(false);

  t(key: string): string {
    const lang = this.i18n.currentLanguage();
    return TRANSLATIONS[lang]?.[key] ?? key;
  }
}
