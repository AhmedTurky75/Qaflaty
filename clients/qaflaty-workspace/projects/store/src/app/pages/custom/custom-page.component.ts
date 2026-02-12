import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { I18nService } from '../../services/i18n.service';
import { SeoService } from '../../services/seo.service';
import { PageConfigurationDto } from 'shared';

@Component({
  selector: 'app-custom-page',
  standalone: true,
  template: `
    @if (page()) {
      <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ i18n.getText(page()!.title) }}</h1>
        @if (page()!.contentJson) {
          <div class="prose max-w-none" [innerHTML]="page()!.contentJson"></div>
        }
      </div>
    }
  `
})
export class CustomPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private configService = inject(ConfigService);
  i18n = inject(I18nService);
  private seo = inject(SeoService);
  page = signal<PageConfigurationDto | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.configService.getPageBySlug(slug).subscribe(p => {
          this.page.set(p);
          if (p?.seoSettings) this.seo.setPageSeo(p.seoSettings, p.title);
        });
      }
    });
  }
}
