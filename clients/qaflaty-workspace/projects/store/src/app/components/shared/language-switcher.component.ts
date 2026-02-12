import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    @if (i18n.isBilingualEnabled()) {
      <button
        (click)="toggle()"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
        {{ i18n.currentLanguage() === 'ar' ? 'EN' : 'عربي' }}
      </button>
    }
  `
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);

  toggle(): void {
    const newLang = this.i18n.currentLanguage() === 'ar' ? 'en' : 'ar';
    this.i18n.switchLanguage(newLang);
  }
}
