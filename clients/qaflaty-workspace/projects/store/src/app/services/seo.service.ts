import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18nService } from './i18n.service';
import { PageSeoSettings, BilingualText } from 'shared';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private i18n = inject(I18nService);

  setPageSeo(seo: PageSeoSettings, pageTitle?: BilingualText): void {
    const lang = this.i18n.currentLanguage();
    const titleText = lang === 'ar' ? seo.metaTitle.arabic : seo.metaTitle.english;
    const descText = lang === 'ar' ? seo.metaDescription.arabic : seo.metaDescription.english;

    if (titleText) this.title.setTitle(titleText);
    if (descText) this.meta.updateTag({ name: 'description', content: descText });
    if (seo.ogImageUrl) this.meta.updateTag({ property: 'og:image', content: seo.ogImageUrl });

    if (seo.noIndex || seo.noFollow) {
      const content = [seo.noIndex ? 'noindex' : '', seo.noFollow ? 'nofollow' : ''].filter(Boolean).join(', ');
      this.meta.updateTag({ name: 'robots', content });
    }
  }

  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  setMetaDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  setOgTags(title: string, description: string, imageUrl?: string, url?: string): void {
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    if (imageUrl) this.meta.updateTag({ property: 'og:image', content: imageUrl });
    if (url) this.meta.updateTag({ property: 'og:url', content: url });
  }
}
