import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PageConfigurationDto, SectionConfigurationDto } from 'shared';
import { SectionEditorComponent } from './section-editor.component';
import { createSectionInstance, findSectionType } from './section-preview/section-catalog';

/**
 * A section as an older page would have stored it: content the builder still
 * edits, plus the layout settings that used to be edited on the Design tab.
 */
function legacySection(): SectionConfigurationDto {
  return {
    id: 'sec-1',
    sectionType: 'Hero',
    variantId: 'hero-full-image',
    isEnabled: true,
    sortOrder: 1,
    contentJson: JSON.stringify({ title: { en: 'Old title', ar: 'عنوان' }, buttonText: 'Buy' }),
    settingsJson: JSON.stringify({
      backgroundColor: '#101828',
      textColor: '#ffffff',
      backgroundImageUrl: 'https://cdn.example/hero.jpg',
      paddingY: 'xl',
      paddingX: 'lg',
      maxWidth: 'wide',
      borderRadius: '2xl',
      visibility: 'desktop',
      anchorId: 'top-hero',
      animation: 'slide-up'
    })
  };
}

function pageWith(sections: SectionConfigurationDto[]): PageConfigurationDto {
  return {
    id: 'page-1',
    storeId: 'store-1',
    pageType: 'Landing',
    slug: 'landing',
    title: { english: 'Landing', arabic: 'الهبوط' },
    isEnabled: true,
    seoSettings: {
      metaTitle: { english: 'T', arabic: 'ت' },
      metaDescription: { english: 'D', arabic: 'د' },
      ogImageUrl: '',
      noIndex: false,
      noFollow: false
    },
    sections,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
}

describe('SectionEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionEditorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  function mount(sections: SectionConfigurationDto[]) {
    const fixture = TestBed.createComponent(SectionEditorComponent);
    fixture.componentInstance.page = pageWith(sections);
    fixture.componentInstance.ngOnInit();
    return fixture;
  }

  it('round-trips an existing section untouched on open-and-save', () => {
    const original = legacySection();
    const fixture = mount([original]);

    let emitted: SectionConfigurationDto[] = [];
    fixture.componentInstance.save.subscribe(payload => { emitted = payload.sections; });
    fixture.componentInstance.onSave();

    expect(emitted.length).toBe(1);
    expect(emitted[0].contentJson).toBe(original.contentJson);
    expect(emitted[0].settingsJson).toBe(original.settingsJson);
    expect(emitted[0].variantId).toBe(original.variantId);
    expect(emitted[0].isEnabled).toBe(original.isEnabled);
  });

  it('keeps every design-tab setting when a content field is edited', () => {
    const original = legacySection();
    const fixture = mount([original]);
    const editor = fixture.componentInstance;

    const section = editor.localSections()[0];
    editor.setContentBilingual(section, 'title', 'en', 'New title');

    const updated = editor.localSections()[0];
    expect(JSON.parse(updated.contentJson!).title.en).toBe('New title');
    // Layout settings are no longer exposed anywhere in the UI, so they must
    // come back out exactly as they went in.
    expect(updated.settingsJson).toBe(original.settingsJson);
  });

  it('applies content edits against the latest section when setters are chained', () => {
    const fixture = mount([legacySection()]);
    const editor = fixture.componentInstance;

    const section = editor.localSections()[0];
    editor.setContentField(section, 'videoUrl', 'https://cdn.example/v.mp4');
    editor.setContentField(section, 'source', 'upload');

    const content = JSON.parse(editor.localSections()[0].contentJson!);
    expect(content.videoUrl).toBe('https://cdn.example/v.mp4');
    expect(content.source).toBe('upload');
  });

  it('reports unsaved changes only after an edit, and clears them on save', () => {
    const fixture = mount([legacySection()]);
    const editor = fixture.componentInstance;

    expect(editor.hasUnsavedChanges()).toBe(false);

    editor.setContentBilingual(editor.localSections()[0], 'title', 'en', 'Changed');
    expect(editor.hasUnsavedChanges()).toBe(true);

    editor.markSaved();
    expect(editor.hasUnsavedChanges()).toBe(false);
  });

  it('adds a content source without disturbing the stored design settings', () => {
    const original = legacySection();
    original.sectionType = 'FeaturedProducts';
    original.variantId = 'grid-standard';

    const fixture = mount([original]);
    const editor = fixture.componentInstance;

    editor.setSourceMode(editor.localSections()[0], 'category');
    editor.setSourceField(editor.localSections()[0], 'categoryId', 'cat-9');
    editor.setSourceField(editor.localSections()[0], 'limit', 4);

    const settings = JSON.parse(editor.localSections()[0].settingsJson!);
    expect(settings.source).toEqual({ mode: 'category', categoryId: 'cat-9', limit: 4 });
    // Everything the old Design tab wrote is still there, untouched.
    expect(settings.backgroundColor).toBe('#101828');
    expect(settings.paddingY).toBe('xl');
    expect(settings.animation).toBe('slide-up');
    expect(settings.anchorId).toBe('top-hero');
  });

  it('drops the other mode\'s selection when the mode changes', () => {
    const fixture = mount([legacySection()]);
    const editor = fixture.componentInstance;

    editor.setSourceMode(editor.localSections()[0], 'category');
    editor.setSourceField(editor.localSections()[0], 'categoryId', 'cat-9');
    editor.setSourceMode(editor.localSections()[0], 'manual');
    editor.togglePickedProduct(editor.localSections()[0], 'candle');
    editor.togglePickedProduct(editor.localSections()[0], 'mug');

    const source = JSON.parse(editor.localSections()[0].settingsJson!).source;
    expect(source.categoryId).toBeUndefined();
    // Ticking order is the order they appear on the page.
    expect(source.productSlugs).toEqual(['candle', 'mug']);

    editor.togglePickedProduct(editor.localSections()[0], 'candle');
    expect(JSON.parse(editor.localSections()[0].settingsJson!).source.productSlugs).toEqual(['mug']);
  });

  it('reads the legacy pageSize as the starting item count', () => {
    const withPageSize = legacySection();
    withPageSize.settingsJson = JSON.stringify({ pageSize: 6, backgroundColor: '#fff' });

    const fixture = mount([withPageSize]);
    expect(fixture.componentInstance.sourceLimitOf(fixture.componentInstance.localSections()[0])).toBe(6);
  });

  it('only offers a content source to catalogue-driven sections', () => {
    const fixture = mount([legacySection()]);
    const editor = fixture.componentInstance;

    expect(editor.dataSourceKind({ ...legacySection(), sectionType: 'FeaturedProducts' })).toBe('products');
    expect(editor.dataSourceKind({ ...legacySection(), sectionType: 'CategoryShowcase' })).toBe('categories');
    expect(editor.dataSourceKind({ ...legacySection(), sectionType: 'Hero' })).toBeNull();
  });

  it('never renders a Design tab', () => {
    const fixture = mount([legacySection()]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Design');
  });
});

describe('section catalog', () => {
  it('creates new sections that already carry finished default content', () => {
    for (const type of ['Hero', 'FeaturedProducts', 'Faq', 'CallToAction']) {
      const created = createSectionInstance(type);
      expect(created).withContext(type).toBeTruthy();
      expect(created!.variantId).toBe(findSectionType(type)!.defaultVariantId);
      expect(created!.isEnabled).toBe(true);
      expect(created!.contentJson).withContext(type).toBeTruthy();
    }
  });

  it('leaves settingsJson unset on new sections so no defaults are persisted', () => {
    expect(createSectionInstance('Hero')!.settingsJson).toBeUndefined();
  });

  it('returns null for an unknown type instead of inventing one', () => {
    expect(createSectionInstance('NotARealSection')).toBeNull();
  });
});
