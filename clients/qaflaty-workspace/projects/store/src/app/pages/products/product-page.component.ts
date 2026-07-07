import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { PageConfigurationDto } from 'shared';
import { ProductDetailComponent } from './product-detail.component';
import { ProductLandingComponent } from './product-landing.component';

/**
 * Routes a product URL to either the classic product-detail page or the merchant-configured
 * professional landing-page layout, based on whether the product has an enabled landing page.
 */
@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [ProductDetailComponent, ProductLandingComponent],
  template: `
    @if (checked()) {
      @if (pageConfig(); as config) {
        <app-product-landing [pageConfig]="config" [productSlug]="slug()" />
      } @else {
        <app-product-detail />
      }
    }
  `
})
export class ProductPageComponent {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  slug = signal('');
  checked = signal(false);
  pageConfig = signal<PageConfigurationDto | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) return;

      this.slug.set(slug);
      this.checked.set(false);
      this.productService.getLandingPage(slug).subscribe({
        next: (config) => {
          this.pageConfig.set(config);
          this.checked.set(true);
        },
        error: () => {
          this.pageConfig.set(null);
          this.checked.set(true);
        }
      });
    });
  }
}
