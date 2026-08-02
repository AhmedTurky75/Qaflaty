import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StoreDto, StoreStatus } from 'shared';
import { SectionLibraryComponent } from './section-library.component';
import { SectionPreviewDataService } from '../section-preview/section-preview-data.service';
import { StoreContextService } from '../../../core/services/store-context.service';

const STORE_ID = 'store-1';

function storeDto(): StoreDto {
  return {
    id: STORE_ID,
    merchantId: 'm-1',
    slug: 'demo',
    name: 'Demo store',
    branding: { primaryColor: '#7c3aed' },
    status: StoreStatus.Active,
    isMaintenanceMode: false,
    deliverySettings: { deliveryFee: { amount: 20, currency: 'EGP' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    currency: 'EGP',
    currencySymbol: 'ج.م'
  };
}

describe('SectionLibraryComponent', () => {
  let http: HttpTestingController;
  let previewData: SectionPreviewDataService;
  let fixture: ComponentFixture<SectionLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionLibraryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    previewData = TestBed.inject(SectionPreviewDataService);
    TestBed.inject(StoreContextService).currentStore.set(storeDto());

    fixture = TestBed.createComponent(SectionLibraryComponent);
  });

  afterEach(() => http.verify());

  /** Answers the two catalogue requests the whole panel shares. */
  function respond(products: unknown[], categories: unknown[]): void {
    previewData.load(STORE_ID);
    http.expectOne(r => r.url === `/api/stores/${STORE_ID}/products`)
      .flush({ items: products, total: products.length, page: 1, limit: 12, totalPages: 1 });
    http.expectOne(`/api/stores/${STORE_ID}/categories`).flush(categories);
    fixture.detectChanges();
  }

  it('loads the catalogue once, however many cards are on screen', () => {
    respond([], []);
    // A second consumer asking for the same store must not re-request.
    previewData.load(STORE_ID);
    http.verify();
    expect(previewData.loaded()).toBe(true);
  });

  it('renders the store\'s real products inside the product cards', () => {
    respond(
      [{ id: 'p1', slug: 'p1', name: 'Hand-poured candle', price: 245, status: 'Active', quantity: 3 }],
      [{ id: 'c1', storeId: STORE_ID, name: 'Home fragrance', slug: 'home', sortOrder: 1, createdAt: '' }]
    );

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Hand-poured candle');
    expect(text).toContain('Home fragrance');
    expect(text).toContain('ج.م');
    expect(previewData.usingSampleData()).toBe(false);
  });

  it('falls back to sample data, and says so, when the store is empty', () => {
    respond([], []);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(previewData.usingSampleData()).toBe(true);
    expect(text).toContain('Sample data');
    // Still a real preview rather than an empty card.
    expect(text).toContain('Classic cotton tee');
  });

  it('groups cards by purpose and offers a keyboard path to add one', () => {
    respond([], []);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Hero & banners');
    expect(host.textContent).toContain('Trust & social proof');

    const added: string[] = [];
    fixture.componentInstance.add.subscribe(key => added.push(key));

    const addButton = host.querySelector<HTMLButtonElement>('button[aria-label^="Add "]');
    expect(addButton).toBeTruthy();
    addButton!.click();
    expect(added.length).toBe(1);
  });
});
