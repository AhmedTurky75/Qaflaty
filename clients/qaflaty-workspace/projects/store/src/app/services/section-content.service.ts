import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { SectionConfigurationDto, SectionContentSource, SectionSettings } from 'shared';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';

const DEFAULT_LIMIT = 8;

/**
 * Resolves what a data-bound section actually shows.
 *
 * Every product grid, carousel and category showcase asks here instead of
 * fetching "the newest N products" itself, so a merchant can point two sections
 * on the same page at different things.
 *
 * Sections saved before `settings.source` existed resolve to the previous
 * behaviour — newest products, honouring the legacy `pageSize` setting.
 */
@Injectable({ providedIn: 'root' })
export class SectionContentService {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  /**
   * `defaultLimit` is the variant's own idea of how many items look right
   * (a large grid wants fewer than a compact one) and is used only when the
   * merchant has not chosen a number.
   */
  products(config: SectionConfigurationDto, defaultLimit = DEFAULT_LIMIT): Observable<Product[]> {
    const settings = this.settingsOf(config);
    const source = settings.source ?? {};
    const limit = this.limitOf(settings, source, defaultLimit);

    if (source.mode === 'manual') {
      const slugs = source.productSlugs ?? [];
      if (slugs.length === 0) return of([]);
      return this.productService
        .getProducts({ slugs, pageSize: slugs.length })
        .pipe(map(res => res.items ?? []));
    }

    return this.productService
      .getProducts({
        categoryId: source.mode === 'category' ? source.categoryId : undefined,
        sortBy: this.sortOf(source),
        page: 1,
        pageSize: limit
      })
      .pipe(map(res => (res.items ?? []).slice(0, limit)));
  }

  categories(config: SectionConfigurationDto, defaultLimit = DEFAULT_LIMIT): Observable<Category[]> {
    const settings = this.settingsOf(config);
    const source = settings.source ?? {};
    const limit = this.limitOf(settings, source, defaultLimit);

    return this.categoryService.getCategories().pipe(
      map(all => this.pickCategories(all, source.categoryIds ?? [], limit))
    );
  }

  /** Chosen categories keep the merchant's order; an empty choice means all. */
  private pickCategories(all: Category[], chosen: string[], limit: number): Category[] {
    if (chosen.length === 0) return all.slice(0, limit);

    const byId = new Map(all.map(c => [c.id, c]));
    return chosen
      .map(id => byId.get(id))
      .filter((c): c is Category => c !== undefined)
      .slice(0, limit);
  }

  private sortOf(source: SectionContentSource): string | undefined {
    switch (source.mode) {
      case 'priceAsc': return 'PriceAsc';
      case 'priceDesc': return 'PriceDesc';
      case 'nameAsc': return 'NameAsc';
      default: return 'Newest';
    }
  }

  private limitOf(settings: SectionSettings, source: SectionContentSource, defaultLimit: number): number {
    const legacyPageSize = typeof settings['pageSize'] === 'number' ? settings['pageSize'] as number : undefined;
    const limit = source.limit ?? legacyPageSize ?? defaultLimit;
    return limit > 0 ? limit : defaultLimit;
  }

  private settingsOf(config: SectionConfigurationDto): SectionSettings {
    try {
      return config.settingsJson ? JSON.parse(config.settingsJson) as SectionSettings : {};
    } catch {
      return {};
    }
  }
}
