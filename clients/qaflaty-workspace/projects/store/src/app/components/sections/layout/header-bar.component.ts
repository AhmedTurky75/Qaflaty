import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { StoreService } from '../../../services/store.service';
import { CartService } from '../../../services/cart.service';
import { FeatureService } from '../../../services/feature.service';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { I18nService, TRANSLATIONS } from '../../../services/i18n.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher.component';
import { contentOf, listOf } from '../section-config';

interface NavLink {
  label: string;
  url: string;
}

/**
 * The header, as a section the merchant arranges.
 *
 * Navigation comes from the blocks they add; with none added it falls back to
 * the store's own pages, so a header dropped in and never opened still works.
 */
@Component({
  selector: 'app-header-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent],
  template: `
    <header class="bg-white shadow-sm" [class.sticky]="sticky()" [class.top-0]="sticky()" [class.z-50]="sticky()">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-2">
          @if (store.currentStore()?.branding?.logoUrl) {
            <img [src]="store.currentStore()!.branding.logoUrl" alt="" class="h-8 w-auto" />
          }
          @if (showName()) {
            <span class="font-bold text-lg text-gray-900">{{ store.currentStore()?.name }}</span>
          }
        </a>

        <nav class="hidden md:flex items-center gap-6">
          @for (link of links(); track $index) {
            <a [routerLink]="link.url" routerLinkActive="text-[var(--primary-color)]"
              class="text-sm text-gray-700 hover:text-[var(--primary-color)] transition-colors">{{ link.label }}</a>
          }
        </nav>

        <div class="flex items-center gap-3">
          @if (showLanguage()) {
            <app-language-switcher />
          }

          @if (showAccount() && features.authMode() === 'Required') {
            @if (customerAuth.isAuthenticated()) {
              <a routerLink="/account/profile" class="hidden md:inline-flex text-sm font-medium text-gray-700 hover:text-[var(--primary-color)]">{{ t('my_account') }}</a>
            } @else {
              <a routerLink="/account/login" class="hidden md:inline-flex text-sm font-medium text-gray-700 hover:text-[var(--primary-color)]">{{ t('login') }}</a>
            }
          }

          @if (showCart() && features.isCartPageEnabled()) {
            <a routerLink="/cart" class="relative p-2 text-gray-700 hover:text-[var(--primary-color)] transition-colors" [attr.aria-label]="t('cart')">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              @if (cart.itemCount() > 0) {
                <span class="absolute -top-1 -right-1 bg-[var(--primary-color)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {{ cart.itemCount() }}
                </span>
              }
            </a>
          }

          <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="md:hidden p-2 text-gray-700" [attr.aria-label]="t('menu')">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      @if (mobileMenuOpen()) {
        <nav class="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          @for (link of links(); track $index) {
            <a [routerLink]="link.url" (click)="mobileMenuOpen.set(false)" class="block py-2 text-gray-700">{{ link.label }}</a>
          }
        </nav>
      }
    </header>
  `
})
export class HeaderBarComponent {
  config = input.required<SectionConfigurationDto>();

  store = inject(StoreService);
  cart = inject(CartService);
  features = inject(FeatureService);
  customerAuth = inject(CustomerAuthService);
  private i18n = inject(I18nService);

  mobileMenuOpen = signal(false);

  private content = computed(() => contentOf(this.config()));

  sticky = computed(() => this.content()['sticky'] !== false);
  showName = computed(() => this.content()['showName'] !== false);
  showCart = computed(() => this.content()['showCart'] !== false);
  showLanguage = computed(() => this.content()['showLanguage'] !== false);
  showAccount = computed(() => this.content()['showAccount'] !== false);

  /** Merchant-arranged links, or the store's own pages when none are set. */
  links = computed<NavLink[]>(() => {
    const blocks = listOf(this.config(), 'blocks')
      .filter(block => block['type'] === 'link')
      .map(block => ({
        label: this.i18n.getText(block['label']),
        url: typeof block['url'] === 'string' && block['url'] ? block['url'] : '/'
      }))
      .filter(link => link.label);

    return blocks.length ? blocks : this.defaultLinks();
  });

  private defaultLinks(): NavLink[] {
    const links: NavLink[] = [
      { label: this.t('home'), url: '/' },
      { label: this.t('products'), url: '/products' }
    ];
    if (this.features.isAboutPageEnabled()) links.push({ label: this.t('about'), url: '/about' });
    if (this.features.isContactPageEnabled()) links.push({ label: this.t('contact'), url: '/contact' });
    for (const page of this.features.customPages()) {
      links.push({ label: page.title, url: `/pages/${page.slug}` });
    }
    return links;
  }

  t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
