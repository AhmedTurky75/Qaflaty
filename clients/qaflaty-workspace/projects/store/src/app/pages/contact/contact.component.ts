import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { WhatsAppButtonComponent } from '../../components/shared/whatsapp-button.component';
import { WhatsAppService } from '../../services/whatsapp.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, WhatsAppButtonComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ t('contact') }}</h1>

      <!-- WhatsApp Quick Contact -->
      @if (whatsAppService.isEnabled()) {
        <div class="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ whatsAppTitle() }}</h3>
              <p class="text-sm text-gray-600">{{ whatsAppSubtitle() }}</p>
            </div>
            <app-whatsapp-button variant="inline" />
          </div>
        </div>
      }

      <!-- Contact Form -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ formTitle() }}</h2>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ nameLabel() }}</label>
            <input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ emailLabel() }}</label>
            <input type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ messageLabel() }}</label>
            <textarea rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"></textarea>
          </div>
          <button type="submit" class="px-8 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            {{ sendButton() }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ContactComponent {
  private i18n = inject(I18nService);
  whatsAppService = inject(WhatsAppService);

  t(key: string): string { return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key; }

  whatsAppTitle(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'تواصل سريع عبر واتساب' : 'Quick Contact via WhatsApp';
  }

  whatsAppSubtitle(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'احصل على رد فوري' : 'Get an instant response';
  }

  formTitle(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'أرسل رسالة' : 'Send a Message';
  }

  nameLabel(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'الاسم' : 'Name';
  }

  emailLabel(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'البريد الإلكتروني' : 'Email';
  }

  messageLabel(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'الرسالة' : 'Message';
  }

  sendButton(): string {
    return this.i18n.currentLanguage() === 'ar' ? 'إرسال الرسالة' : 'Send Message';
  }
}
