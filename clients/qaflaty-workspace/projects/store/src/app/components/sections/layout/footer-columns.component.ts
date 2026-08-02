import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { StoreService } from '../../../services/store.service';
import { FeatureService } from '../../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../../services/i18n.service';
import { contentOf, listOf } from '../section-config';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterColumn {
  kind: 'links' | 'text';
  title: string;
  text: string;
  links: FooterLink[];
}

/**
 * Footer columns, built from blocks: each block is either a column of links or
 * a column of text. With no blocks it falls back to the store's own pages, so
 * the footer is never empty.
 */
@Component({
  selector: 'app-footer-columns',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-gray-900 text-white pt-12 pb-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          @if (showStoreBlurb()) {
            <div>
              <h3 class="font-bold text-lg mb-4">{{ store.currentStore()?.name }}</h3>
              <p class="text-gray-400 text-sm">{{ store.currentStore()?.description || '' }}</p>
            </div>
          }

          @for (column of columns(); track $index) {
            <div>
              @if (column.title) {
                <h4 class="font-semibold mb-4">{{ column.title }}</h4>
              }
              @if (column.kind === 'text') {
                <p class="text-gray-400 text-sm">{{ column.text }}</p>
              } @else {
                <ul class="space-y-2 text-sm text-gray-400">
                  @for (link of column.links; track $index) {
                    <li><a [routerLink]="link.url" class="hover:text-white transition-colors">{{ link.label }}</a></li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class FooterColumnsComponent {
  config = input.required<SectionConfigurationDto>();

  store = inject(StoreService);
  private features = inject(FeatureService);
  private i18n = inject(I18nService);

  private content = computed(() => contentOf(this.config()));

  showStoreBlurb = computed(() => this.content()['showStoreBlurb'] !== false);

  columns = computed<FooterColumn[]>(() => {
    const blocks = listOf(this.config(), 'blocks').map(block => ({
      kind: block['type'] === 'text' ? 'text' as const : 'links' as const,
      title: this.i18n.getText(block['title']),
      text: this.i18n.getText(block['text']),
      links: (Array.isArray(block['links']) ? block['links'] as Record<string, unknown>[] : [])
        .map(link => ({
          label: this.i18n.getText(link['label']),
          url: typeof link['url'] === 'string' && link['url'] ? link['url'] : '/'
        }))
        .filter(link => link.label)
    })).filter(column => column.title || column.text || column.links.length);

    return blocks.length ? blocks : this.defaultColumns();
  });

  /** The store's own pages, so an untouched footer still helps shoppers. */
  private defaultColumns(): FooterColumn[] {
    const links: FooterLink[] = [{ label: this.t('products'), url: '/products' }];
    if (this.features.isAboutPageEnabled()) links.push({ label: this.t('about'), url: '/about' });
    if (this.features.isContactPageEnabled()) links.push({ label: this.t('contact'), url: '/contact' });
    if (this.features.isFaqPageEnabled()) links.push({ label: this.t('faq'), url: '/faq' });
    if (this.features.isTermsPageEnabled()) links.push({ label: this.t('terms'), url: '/terms' });
    if (this.features.isPrivacyPageEnabled()) links.push({ label: this.t('privacy'), url: '/privacy' });

    return [{ kind: 'links', title: this.t('links'), text: '', links }];
  }

  private t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
