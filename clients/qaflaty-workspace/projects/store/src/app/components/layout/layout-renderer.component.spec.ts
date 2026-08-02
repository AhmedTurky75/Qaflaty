import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PageConfigurationDto, SectionConfigurationDto } from 'shared';
import { LayoutRendererComponent } from './layout-renderer.component';
import { ConfigService } from '../../services/config.service';

function layoutPage(
  pageType: 'Header' | 'Footer',
  sections: SectionConfigurationDto[],
  isEnabled = true
): PageConfigurationDto {
  return {
    id: `${pageType}-1`,
    storeId: 'store-1',
    pageType,
    slug: pageType.toLowerCase(),
    title: { english: pageType, arabic: pageType },
    isEnabled,
    seoSettings: {
      metaTitle: { english: '', arabic: '' },
      metaDescription: { english: '', arabic: '' },
      ogImageUrl: '',
      noIndex: false,
      noFollow: false
    },
    sections,
    createdAt: '',
    updatedAt: ''
  };
}

function section(id: string, variantId: string, sortOrder: number, isEnabled = true): SectionConfigurationDto {
  return { id, sectionType: 'HeaderBar', variantId, isEnabled, sortOrder };
}

describe('LayoutRendererComponent', () => {
  let config: ConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutRendererComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    config = TestBed.inject(ConfigService);
  });

  function mount() {
    const fixture = TestBed.createComponent(LayoutRendererComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('uses no layout sections when the store has never built a header', () => {
    config.pages.set([]);
    const component = mount();

    expect(component.headerSections()).toEqual([]);
    expect(component.footerSections()).toEqual([]);
  });

  it('returns the header group\'s enabled sections in order', () => {
    config.pages.set([
      layoutPage('Header', [
        section('b', 'header-bar', 2),
        section('a', 'announcement-bar', 1),
        section('hidden', 'header-bar', 3, false)
      ])
    ]);
    const component = mount();

    expect(component.headerSections().map(s => s.id)).toEqual(['a', 'b']);
  });

  it('ignores a layout group the merchant has switched off', () => {
    config.pages.set([layoutPage('Footer', [section('a', 'footer-columns', 1)], false)]);
    const component = mount();

    expect(component.footerSections()).toEqual([]);
  });

  it('keeps header and footer groups separate', () => {
    config.pages.set([
      layoutPage('Header', [section('h', 'header-bar', 1)]),
      layoutPage('Footer', [section('f', 'footer-columns', 1)])
    ]);
    const component = mount();

    expect(component.headerSections().map(s => s.id)).toEqual(['h']);
    expect(component.footerSections().map(s => s.id)).toEqual(['f']);
  });
});
