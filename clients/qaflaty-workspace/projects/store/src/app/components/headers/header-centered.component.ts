import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { CartService } from '../../services/cart.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';

@Component({
  selector: 'app-header-centered',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent],
  template: `
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <!-- Top Section: Logo Centered -->
      <div class="border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <app-language-switcher />
            </div>

            <a routerLink="/" class="flex flex-col items-center gap-2">
              @if (store.currentStore()?.branding?.logoUrl) {
                <img [src]="store.currentStore()!.branding.logoUrl" alt="Logo" class="h-12 w-auto" />
              }
              <span class="font-bold text-xl text-gray-900">{{ store.currentStore()?.name }}</span>
            </a>

            <div class="flex items-center gap-3">
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
              <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="md:hidden p-2 text-gray-700">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Bar: Centered -->
      <div class="hidden md:block bg-white">
        <div class="max-w-7xl mx-auto px-4">
          <nav class="flex items-center justify-center gap-8 h-14">
            <a routerLink="/" routerLinkActive="text-[var(--primary-color)]" [routerLinkActiveOptions]="{exact:true}"
              class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('home') }}</a>
            <a routerLink="/products" routerLinkActive="text-[var(--primary-color)]"
              class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('products') }}</a>
            @if (features.isAboutPageEnabled()) {
              <a routerLink="/about" routerLinkActive="text-[var(--primary-color)]"
                class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('about') }}</a>
            }
            @if (features.isContactPageEnabled()) {
              <a routerLink="/contact" routerLinkActive="text-[var(--primary-color)]"
                class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('contact') }}</a>
            }
            @if (features.isFaqPageEnabled()) {
              <a routerLink="/faq" routerLinkActive="text-[var(--primary-color)]"
                class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('faq') }}</a>
            }
            @if (features.isTermsPageEnabled()) {
              <a routerLink="/terms" routerLinkActive="text-[var(--primary-color)]"
                class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('terms') }}</a>
            }
            @if (features.isPrivacyPageEnabled()) {
              <a routerLink="/privacy" routerLinkActive="text-[var(--primary-color)]"
                class="text-sm font-medium text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ t('privacy') }}</a>
            }
          </nav>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <nav class="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <a routerLink="/" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('home') }}</a>
          <a routerLink="/products" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('products') }}</a>
          @if (features.isAboutPageEnabled()) {
            <a routerLink="/about" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('about') }}</a>
          }
          @if (features.isContactPageEnabled()) {
            <a routerLink="/contact" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('contact') }}</a>
          }
          @if (features.isFaqPageEnabled()) {
            <a routerLink="/faq" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('faq') }}</a>
          }
          @if (features.isTermsPageEnabled()) {
            <a routerLink="/terms" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('terms') }}</a>
          }
          @if (features.isPrivacyPageEnabled()) {
            <a routerLink="/privacy" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ t('privacy') }}</a>
          }
        </nav>
      }
    </header>
  `
})
export class HeaderCenteredComponent {
  store = inject(StoreService);
  cart = inject(CartService);
  features = inject(FeatureService);
  private i18n = inject(I18nService);
  mobileMenuOpen = signal(false);

  t(key: string): string {
    const lang = this.i18n.currentLanguage();
    return TRANSLATIONS[lang]?.[key] ?? key;
  }
}
