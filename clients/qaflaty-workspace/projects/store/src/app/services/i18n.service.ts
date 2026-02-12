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

  getText(text: BilingualText | undefined | null): string {
    if (!text) return '';
    return this.currentLanguage() === 'ar' ? text.arabic : text.english;
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
