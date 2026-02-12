import { Component, inject, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { I18nService } from '../../services/i18n.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ i18n.getText(page?.title) || 'About Us' }}</h1>
      @if (page?.contentJson) {
        <div class="prose max-w-none" [innerHTML]="page!.contentJson"></div>
      } @else {
        <p class="text-gray-600">This is the about page. Content can be customized in the store builder.</p>
      }
    </div>
  `
})
export class AboutComponent implements OnInit {
  configService = inject(ConfigService);
  i18n = inject(I18nService);
  seo = inject(SeoService);
  page: any;

  ngOnInit() {
    this.configService.getPageBySlug('about').subscribe(p => {
      this.page = p;
      if (p?.seoSettings) this.seo.setPageSeo(p.seoSettings, p.title);
    });
  }
}
