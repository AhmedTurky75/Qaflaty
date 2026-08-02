import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ConfigService } from './config.service';
import { BilingualText } from 'shared';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private configService = inject(ConfigService);

  currentLanguage = signal<string>('ar');
  direction = computed(() => this.currentLanguage() === 'ar' ? 'rtl' : 'ltr');
  isBilingualEnabled = computed(() => this.configService.config()?.localizationSettings?.enableBilingual ?? true);

  constructor() {
    effect(() => {
      const config = this.configService.config();
      if (config) {
        const savedLang = localStorage.getItem('store-language');
        this.currentLanguage.set(savedLang || config.localizationSettings.defaultLanguage);
      }
    });

    effect(() => {
      const lang = this.currentLanguage();
      const dir = this.direction();
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
    });
  }

  switchLanguage(lang: string): void {
    this.currentLanguage.set(lang);
    localStorage.setItem('store-language', lang);
  }

  /**
   * Resolves a bilingual value in either shape the platform stores:
   * `{ english, arabic }` on DTOs, and `{ en, ar }` inside a section's
   * `contentJson` (what the page builder writes). A plain string is returned
   * as-is, and a missing translation falls back to the other language rather
   * than rendering an empty element.
   */
  getText(text: BilingualText | { en?: string; ar?: string } | string | undefined | null): string {
    if (!text) return '';
    if (typeof text === 'string') return text;

    const isArabic = this.currentLanguage() === 'ar';
    const value = text as { english?: string; arabic?: string; en?: string; ar?: string };
    const arabic = value.arabic ?? value.ar ?? '';
    const english = value.english ?? value.en ?? '';

    const preferred = isArabic ? arabic : english;
    return preferred || (isArabic ? english : arabic) || '';
  }

  /**
   * Picks the language-appropriate name for entities that carry an English `name`
   * plus an optional Arabic `nameAr` (products, categories). Falls back to English
   * when Arabic is missing so the storefront never shows a blank name.
   */
  nameFor(name: string | undefined | null, nameAr?: string | null): string {
    if (this.currentLanguage() === 'ar' && nameAr && nameAr.trim().length > 0) {
      return nameAr;
    }
    return name ?? '';
  }

  isRtl(): boolean {
    return this.currentLanguage() === 'ar';
  }
}

// Static translations for UI elements
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    'home': 'الرئيسية',
    'products': 'المنتجات',
    'about': 'من نحن',
    'contact': 'اتصل بنا',
    'faq': 'الأسئلة الشائعة',
    'terms': 'الشروط والأحكام',
    'privacy': 'سياسة الخصوصية',
    'shipping': 'الشحن والإرجاع',
    'cart': 'سلة التسوق',
    'search': 'بحث',
    'add_to_cart': 'أضف إلى السلة',
    'ai_suggested_products': 'منتجات مقترحة',
    'buy_now': 'اشتر الآن',
    'checkout': 'إتمام الشراء',
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'my_account': 'حسابي',
    'wishlist': 'المفضلة',
    'no_products': 'لا توجد منتجات',
    'loading': 'جاري التحميل...',
    'page_not_found': 'الصفحة غير موجودة',
    'back_to_home': 'العودة للرئيسية',
    'all_categories': 'جميع الفئات',
    'sort_by': 'ترتيب حسب',
    'filter': 'تصفية',
    'price': 'السعر',
    'quantity': 'الكمية',
    'total': 'المجموع',
    'subtotal': 'المجموع الفرعي',
    'delivery': 'التوصيل',
    'free_delivery': 'توصيل مجاني',
    'continue_shopping': 'متابعة التسوق',
    'empty_cart': 'سلة التسوق فارغة',
    'subscribe': 'اشترك',
    'newsletter_title': 'اشترك في نشرتنا البريدية',
    'newsletter_desc': 'احصل على آخر العروض والأخبار',
    'follow_us': 'تابعنا',
    'all_rights_reserved': 'جميع الحقوق محفوظة',
    'powered_by': 'مدعوم من قافلاتي',
  },
  en: {
    'home': 'Home',
    'products': 'Products',
    'about': 'About Us',
    'contact': 'Contact Us',
    'faq': 'FAQ',
    'terms': 'Terms & Conditions',
    'privacy': 'Privacy Policy',
    'shipping': 'Shipping & Returns',
    'cart': 'Cart',
    'search': 'Search',
    'add_to_cart': 'Add to Cart',
    'ai_suggested_products': 'Suggested products',
    'buy_now': 'Buy Now',
    'checkout': 'Checkout',
    'login': 'Login',
    'register': 'Register',
    'my_account': 'My Account',
    'wishlist': 'Wishlist',
    'no_products': 'No products found',
    'loading': 'Loading...',
    'page_not_found': 'Page Not Found',
    'back_to_home': 'Back to Home',
    'all_categories': 'All Categories',
    'sort_by': 'Sort By',
    'filter': 'Filter',
    'price': 'Price',
    'quantity': 'Quantity',
    'total': 'Total',
    'subtotal': 'Subtotal',
    'delivery': 'Delivery',
    'free_delivery': 'Free Delivery',
    'continue_shopping': 'Continue Shopping',
    'empty_cart': 'Your cart is empty',
    'subscribe': 'Subscribe',
    'newsletter_title': 'Subscribe to our newsletter',
    'newsletter_desc': 'Get the latest offers and news',
    'follow_us': 'Follow Us',
    'all_rights_reserved': 'All rights reserved',
    'powered_by': 'Powered by Qaflaty',
  }
};
