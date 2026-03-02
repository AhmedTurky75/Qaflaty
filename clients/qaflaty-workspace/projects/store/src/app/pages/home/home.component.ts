import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ConfigService } from '../../services/config.service';
import { SeoService } from '../../services/seo.service';
import { Category } from '../../models/category.model';
import { SectionConfigurationDto } from 'shared';
import { ProductCardComponent } from '../../components/products/product-card.component';
import { SectionRendererComponent } from '../../components/sections/section-renderer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SectionRendererComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private configService = inject(ConfigService);
  private seoService = inject(SeoService);

  store = this.storeService.currentStore;
  products = signal<any[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);
  homePageSections = signal<SectionConfigurationDto[]>([]);
  pageConfigLoaded = signal(false);

  ngOnInit() {
    this.loadHomePageConfig();
    this.loadFeaturedProducts();
    this.loadCategories();
  }

  loadHomePageConfig() {
    this.configService.getPageBySlug('home').subscribe({
      next: (page) => {
        if (page?.sections?.length) {
          this.homePageSections.set(page.sections.filter(s => s.isEnabled));
        }
        if (page?.seoSettings) {
          this.seoService.setPageSeo(page.seoSettings, page.title);
        }
        this.pageConfigLoaded.set(true);
      },
      error: () => {
        this.pageConfigLoaded.set(true);
      }
    });
  }

  loadFeaturedProducts() {
    this.loading.set(true);
    this.productService.getFeaturedProducts(8).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.loading.set(false);
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });
  }
}
