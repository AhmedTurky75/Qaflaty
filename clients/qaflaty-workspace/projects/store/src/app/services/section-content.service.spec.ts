import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { SectionConfigurationDto, SectionContentSource } from 'shared';
import { SectionContentService } from './section-content.service';

function section(settings?: Record<string, unknown>): SectionConfigurationDto {
  return {
    id: 's1',
    sectionType: 'FeaturedProducts',
    variantId: 'grid-standard',
    isEnabled: true,
    sortOrder: 1,
    settingsJson: settings ? JSON.stringify(settings) : undefined
  };
}

function withSource(source: SectionContentSource): SectionConfigurationDto {
  return section({ source });
}

describe('SectionContentService', () => {
  let service: SectionContentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SectionContentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectProductRequest(): TestRequest {
    return http.expectOne(r => r.url.endsWith('/storefront/products'));
  }

  it('keeps the old behaviour for a section saved before sources existed', () => {
    service.products(section(), 8).subscribe();

    const req = expectProductRequest();
    expect(req.request.params.get('sortBy')).toBe('Newest');
    expect(req.request.params.get('pageSize')).toBe('8');
    expect(req.request.params.get('categoryId')).toBeNull();
    req.flush({ items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 });
  });

  it('still honours a legacy pageSize setting', () => {
    service.products(section({ pageSize: 4 }), 8).subscribe();

    const req = expectProductRequest();
    expect(req.request.params.get('pageSize')).toBe('4');
    req.flush({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 0 });
  });

  it('asks for one category when the merchant chose one', () => {
    service.products(withSource({ mode: 'category', categoryId: 'cat-7', limit: 6 }), 8).subscribe();

    const req = expectProductRequest();
    expect(req.request.params.get('categoryId')).toBe('cat-7');
    expect(req.request.params.get('pageSize')).toBe('6');
    req.flush({ items: [], total: 0, page: 1, pageSize: 6, totalPages: 0 });
  });

  it('requests hand-picked products by slug', () => {
    service.products(withSource({ mode: 'manual', productSlugs: ['b', 'a'] }), 8).subscribe();

    const req = expectProductRequest();
    expect(req.request.params.getAll('slugs')).toEqual(['b', 'a']);
    req.flush({ items: [], total: 0, page: 1, pageSize: 2, totalPages: 0 });
  });

  it('does not call the API at all for an empty hand-picked list', () => {
    const received: unknown[][] = [];
    service.products(withSource({ mode: 'manual', productSlugs: [] }), 8)
      .subscribe(products => received.push(products));

    expect(received).toEqual([[]]);
    http.verify();
  });

  it('maps sort modes onto the API sort options', () => {
    service.products(withSource({ mode: 'priceDesc' }), 8).subscribe();

    const req = expectProductRequest();
    expect(req.request.params.get('sortBy')).toBe('PriceDesc');
    req.flush({ items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 });
  });

  it('returns every category, capped, when none are chosen', () => {
    let received: { id: string }[] = [];
    service.categories(section(), 2).subscribe(categories => { received = categories; });

    http.expectOne(r => r.url.endsWith('/storefront/categories'))
      .flush([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

    expect(received.map(c => c.id)).toEqual(['a', 'b']);
  });

  it('returns chosen categories in the merchant\'s order, skipping deleted ones', () => {
    let received: { id: string }[] = [];
    service.categories(withSource({ categoryIds: ['c', 'gone', 'a'] }), 8)
      .subscribe(categories => { received = categories; });

    http.expectOne(r => r.url.endsWith('/storefront/categories'))
      .flush([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

    expect(received.map(c => c.id)).toEqual(['c', 'a']);
  });
});
