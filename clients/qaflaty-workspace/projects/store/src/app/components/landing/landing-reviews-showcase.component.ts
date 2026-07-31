import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';
import { FeatureService } from '../../services/feature.service';
import { Product } from '../../models/product.model';
import { ProductReviewsComponent } from '../reviews/product-reviews.component';

@Component({
  selector: 'app-landing-reviews-showcase',
  standalone: true,
  imports: [CommonModule, ProductReviewsComponent],
  template: `
    @if (product() && reviewsEnabled()) {
      <section id="reviews" class="py-12 max-w-3xl mx-auto">
        @if (title()) {
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">{{ title() }}</h2>
        }
        <app-product-reviews [productId]="product()!.id" />
      </section>
    }
  `
})
export class LandingReviewsShowcaseComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);
  private i18n = inject(I18nService);
  private features = inject(FeatureService);

  /**
   * The reviews feature toggle is the master switch (see FeatureToggles.Reviews), so it wins over a
   * reviews section the merchant placed on a landing page — otherwise disabling reviews would still
   * leave them rendered here.
   */
  reviewsEnabled = this.features.isReviewsEnabled;

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'What Customers Say';
  });
}
