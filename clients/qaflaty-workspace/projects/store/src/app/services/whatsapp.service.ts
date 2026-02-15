import { Injectable, inject, computed } from '@angular/core';
import { ConfigService } from './config.service';
import { I18nService } from './i18n.service';

export interface WhatsAppLinkOptions {
  /** Custom message to pre-fill (overrides default message) */
  message?: string;
  /** Product name for product inquiries */
  productName?: string;
  /** Product URL for product inquiries */
  productUrl?: string;
  /** Order number for order support */
  orderNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private configService = inject(ConfigService);
  private i18nService = inject(I18nService);

  /**
   * Check if WhatsApp is enabled for the store
   */
  isEnabled = computed(() => {
    const config = this.configService.config();
    return config?.communicationSettings?.whatsAppEnabled ?? false;
  });

  /**
   * Get the WhatsApp phone number (cleaned)
   */
  phoneNumber = computed(() => {
    const config = this.configService.config();
    const number = config?.communicationSettings?.whatsAppNumber;
    if (!number) return null;
    // Remove any non-digit characters except leading +
    return number.replace(/[^\d+]/g, '').replace(/^\+/, '');
  });

  /**
   * Get the default message configured by the store
   */
  defaultMessage = computed(() => {
    const config = this.configService.config();
    return config?.communicationSettings?.whatsAppDefaultMessage ?? '';
  });

  /**
   * Generate a WhatsApp link (wa.me URL)
   */
  generateLink(options: WhatsAppLinkOptions = {}): string | null {
    const phone = this.phoneNumber();
    if (!phone) return null;

    let message = options.message || this.defaultMessage();

    // Build contextual messages
    if (options.productName && options.productUrl) {
      message = this.buildProductInquiryMessage(options.productName, options.productUrl);
    } else if (options.orderNumber) {
      message = this.buildOrderSupportMessage(options.orderNumber);
    }

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${phone}${message ? `?text=${encodedMessage}` : ''}`;
  }

  /**
   * Open WhatsApp with a pre-filled message
   */
  openChat(options: WhatsAppLinkOptions = {}): void {
    const link = this.generateLink(options);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Build a product inquiry message
   */
  private buildProductInquiryMessage(productName: string, productUrl: string): string {
    const lang = this.i18nService.currentLanguage();
    const storeName = this.configService.config()?.name || '';

    if (lang === 'ar') {
      return `مرحباً ${storeName}،\n\nأرغب بالاستفسار عن المنتج:\n${productName}\n${productUrl}`;
    }

    return `Hello ${storeName},\n\nI would like to inquire about:\n${productName}\n${productUrl}`;
  }

  /**
   * Build an order support message
   */
  private buildOrderSupportMessage(orderNumber: string): string {
    const lang = this.i18nService.currentLanguage();
    const storeName = this.configService.config()?.name || '';

    if (lang === 'ar') {
      return `مرحباً ${storeName}،\n\nأحتاج مساعدة بخصوص الطلب رقم: ${orderNumber}`;
    }

    return `Hello ${storeName},\n\nI need help with order #${orderNumber}`;
  }

  /**
   * Build a general inquiry message
   */
  getGeneralInquiryMessage(): string {
    const defaultMsg = this.defaultMessage();
    if (defaultMsg) return defaultMsg;

    const lang = this.i18nService.currentLanguage();
    const storeName = this.configService.config()?.name || '';

    if (lang === 'ar') {
      return `مرحباً ${storeName}، لدي استفسار.`;
    }

    return `Hello ${storeName}, I have a question.`;
  }
}
