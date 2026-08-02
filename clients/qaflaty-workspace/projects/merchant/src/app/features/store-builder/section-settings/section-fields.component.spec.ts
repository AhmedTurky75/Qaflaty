import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SectionConfigurationDto } from 'shared';
import { SectionFieldsComponent } from './section-fields.component';
import { SECTION_SCHEMAS, schemaFor } from './section-schema';
import { SECTION_TYPES, sectionTypesFor } from '../section-preview/section-catalog';
import { readContent, readSettings } from './section-content';

@Component({
  standalone: true,
  imports: [SectionFieldsComponent],
  template: `<app-section-fields [section]="section()" (sectionChange)="section.set($event)" />`
})
class HostComponent {
  section = signal<SectionConfigurationDto>({
    id: 's1',
    sectionType: 'Hero',
    variantId: 'hero-full-image',
    isEnabled: true,
    sortOrder: 1
  });
}

describe('SectionFieldsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  function mount(section: Partial<SectionConfigurationDto>) {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.section.set({ ...host.section(), ...section });
    fixture.detectChanges();
    const fields = fixture.debugElement.children[0].componentInstance as SectionFieldsComponent;
    return { fixture, host, fields };
  }

  it('renders a control for each field the schema declares', () => {
    const { fixture } = mount({ sectionType: 'Hero' });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Heading');
    expect(text).toContain('Button text');
    expect(text).toContain('Background image');
  });

  it('writes an edited value into contentJson and leaves settings alone', () => {
    const { host, fields } = mount({
      sectionType: 'Hero',
      settingsJson: JSON.stringify({ paddingY: 'lg', backgroundColor: '#000' })
    });

    fields['setValue'](schemaFor('Hero')[2], 'Order now');

    expect(readContent(host.section())['buttonText']).toBe('Order now');
    expect(host.section().settingsJson).toBe(JSON.stringify({ paddingY: 'lg', backgroundColor: '#000' }));
  });

  it('keeps the untouched half of a bilingual value', () => {
    const { host, fields } = mount({
      sectionType: 'Hero',
      contentJson: JSON.stringify({ title: { en: 'Hello', ar: 'مرحبا' } })
    });

    fields['setValue'](schemaFor('Hero')[0], { en: 'Hello there', ar: 'مرحبا' });

    expect(readContent(host.section())['title']).toEqual({ en: 'Hello there', ar: 'مرحبا' });
  });

  it('adds, edits, reorders and removes list rows', () => {
    const { host, fields } = mount({ sectionType: 'Faq' });
    const list = schemaFor('Faq').find(f => f.kind === 'list')!;

    fields['addItem'](list);
    fields['addItem'](list);
    expect(readContent(host.section())['items'] as unknown[]).toHaveSize(2);

    fields['setItemValue']('items', 0, 'question', { en: 'First', ar: '' });
    fields['setItemValue']('items', 1, 'question', { en: 'Second', ar: '' });

    fields['moveItem']('items', 0, 1);
    let items = readContent(host.section())['items'] as { question: { en: string } }[];
    expect(items.map(i => i.question.en)).toEqual(['Second', 'First']);

    fields['removeItem']('items', 0);
    items = readContent(host.section())['items'] as { question: { en: string } }[];
    expect(items.map(i => i.question.en)).toEqual(['First']);
  });

  it('hides fields that belong to another mode', () => {
    const { fixture, host, fields } = mount({
      sectionType: 'Video',
      contentJson: JSON.stringify({ source: 'youtube' })
    });

    expect(fields['visibleFields']().map(f => f.key)).toContain('videoId');
    expect(fields['visibleFields']().map(f => f.key)).not.toContain('videoUrl');

    host.section.set({ ...host.section(), contentJson: JSON.stringify({ source: 'upload' }) });
    fixture.detectChanges();

    expect(fields['visibleFields']().map(f => f.key)).toContain('videoUrl');
    expect(fields['visibleFields']().map(f => f.key)).not.toContain('videoId');
  });

  it('assumes the fallback when the deciding field was never set', () => {
    const { fields } = mount({ sectionType: 'Countdown' });

    // No mode stored yet: a fixed-date timer is the default, so it asks for a date.
    expect(fields['visibleFields']().map(f => f.key)).toContain('endsAt');
    expect(fields['visibleFields']().map(f => f.key)).not.toContain('durationMinutes');
  });

  it('spans a text area over the image from two clicks on the anchor grid', () => {
    const { host, fields } = mount({
      sectionType: 'MediaText',
      contentJson: JSON.stringify({ items: [{ layout: 'overlay' }] })
    });

    fields['pickOverlayCell']('items', 0, {}, '2-2');
    let item = (readContent(host.section())['items'] as Record<string, unknown>[])[0];
    expect(item['overlayPosition']).toBe('2-2');
    expect(item['overlayEndPosition']).toBe('2-2');

    fields['pickOverlayCell']('items', 0, item, '4-5');
    item = (readContent(host.section())['items'] as Record<string, unknown>[])[0];
    expect(item['overlayPosition']).toBe('2-2');
    expect(item['overlayEndPosition']).toBe('4-5');

    expect(fields['isInOverlaySpan'](item, '3-3')).toBe(true);
    expect(fields['isInOverlaySpan'](item, '5-1')).toBe(false);
  });

  it('builds the specifications table as nested groups and rows', () => {
    const { host, fields } = mount({ sectionType: 'Specs' });

    fields['addGroup']();
    fields['setGroupName'](0, 'en', 'General');
    fields['addRow'](0);
    fields['setRow'](0, 0, 'label', 'en', 'Material');
    fields['setRow'](0, 0, 'value', 'en', 'Cotton');

    const groups = readContent(host.section())['groups'] as Record<string, unknown>[];
    expect(groups).toHaveSize(1);
    expect(groups[0]['name']).toEqual({ en: 'General', ar: '' });
    expect(groups[0]['rows']).toEqual([
      { label: { en: 'Material', ar: '' }, value: { en: 'Cotton', ar: '' } }
    ]);
  });

  it('adds blocks of the chosen type and keeps their order', () => {
    const { host, fields } = mount({ sectionType: 'FooterColumns' });
    const blocks = schemaFor('FooterColumns').find(f => f.kind === 'blocks')!;
    const [linksType, textType] = blocks.blockTypes!;

    fields['addBlock'](blocks, linksType);
    fields['addBlock'](blocks, textType);

    let stored = readContent(host.section())['blocks'] as Record<string, unknown>[];
    expect(stored.map(b => b['type'])).toEqual(['links', 'text']);

    fields['moveItem']('blocks', 0, 1);
    stored = readContent(host.section())['blocks'] as Record<string, unknown>[];
    expect(stored.map(b => b['type'])).toEqual(['text', 'links']);
  });

  it('shows each block only the fields of its own type', () => {
    const { fields } = mount({ sectionType: 'FooterColumns' });
    const blocks = schemaFor('FooterColumns').find(f => f.kind === 'blocks')!;

    const linkColumn = fields['blockFields'](blocks, { type: 'links' });
    const textColumn = fields['blockFields'](blocks, { type: 'text' });

    expect(linkColumn.map(f => f.key)).toEqual(['title', 'links']);
    expect(textColumn.map(f => f.key)).toEqual(['title', 'text']);
  });

  it('edits a list nested inside a block', () => {
    const { host, fields } = mount({
      sectionType: 'FooterColumns',
      contentJson: JSON.stringify({ blocks: [{ type: 'links', title: { en: 'Shop' }, links: [] }] })
    });
    const blocks = schemaFor('FooterColumns').find(f => f.kind === 'blocks')!;
    const linksField = blocks.blockTypes![0].fields.find(f => f.kind === 'list')!;

    fields['addNestedRow']('blocks', 0, linksField);
    fields['setNestedRowValue']('blocks', 0, 'links', 0, 'label', { en: 'All products', ar: '' });
    fields['setNestedRowValue']('blocks', 0, 'links', 0, 'url', '/products');

    const stored = (readContent(host.section())['blocks'] as Record<string, unknown>[])[0];
    expect(stored['links']).toEqual([{ label: { en: 'All products', ar: '' }, url: '/products' }]);
    // The block's own fields are untouched by edits to its list.
    expect(stored['title']).toEqual({ en: 'Shop' });

    fields['removeNestedRow']('blocks', 0, 'links', 0);
    expect((readContent(host.section())['blocks'] as Record<string, unknown>[])[0]['links']).toEqual([]);
  });

  it('writes a settings-targeted field to settingsJson, not content', () => {
    const settingsField = { key: 'pageSize', label: 'How many', kind: 'number' as const, target: 'settings' as const };
    const { host, fields } = mount({ sectionType: 'Hero' });

    fields['setValue'](settingsField, 12);

    expect(readSettings(host.section())['pageSize']).toBe(12);
    expect(readContent(host.section())['pageSize']).toBeUndefined();
  });
});

describe('section schemas', () => {
  it('covers every section type in the library', () => {
    const missing = SECTION_TYPES
      .filter(type => !(type.key in SECTION_SCHEMAS))
      .map(type => type.key);

    // CustomHtml aside, a type with no fields is fine — but it must be deliberate,
    // so every type still needs an entry here.
    expect(missing).toEqual([]);
  });

  it('gives every field a key, a label and a kind', () => {
    for (const [type, fields] of Object.entries(SECTION_SCHEMAS)) {
      for (const field of fields) {
        expect(field.key).withContext(`${type} field key`).toBeTruthy();
        expect(field.label).withContext(`${type}.${field.key} label`).toBeTruthy();
        expect(field.kind).withContext(`${type}.${field.key} kind`).toBeTruthy();

        if (field.kind === 'list') {
          expect(field.itemFields?.length).withContext(`${type}.${field.key} itemFields`).toBeGreaterThan(0);
        }
        if (field.kind === 'select') {
          expect(field.options?.length).withContext(`${type}.${field.key} options`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps page sections and layout sections apart', () => {
    const pageKeys = sectionTypesFor('page').map(t => t.key);
    const layoutKeys = sectionTypesFor('layout').map(t => t.key);

    expect(layoutKeys).toContain('HeaderBar');
    expect(layoutKeys).toContain('FooterColumns');
    expect(pageKeys).not.toContain('HeaderBar');
    expect(pageKeys).not.toContain('FooterColumns');

    // A promo strip belongs in both places.
    expect(pageKeys).toContain('AnnouncementBar');
    expect(layoutKeys).toContain('AnnouncementBar');

    // Page blocks stay off the header.
    expect(layoutKeys).not.toContain('FeaturedProducts');
  });

  it('gives every block type a label and at least one field', () => {
    for (const [type, fields] of Object.entries(SECTION_SCHEMAS)) {
      for (const field of fields.filter(f => f.kind === 'blocks')) {
        expect(field.blockTypes?.length).withContext(`${type}.${field.key}`).toBeGreaterThan(0);
        for (const blockType of field.blockTypes ?? []) {
          expect(blockType.type).withContext(`${type}.${field.key} block type`).toBeTruthy();
          expect(blockType.label).withContext(`${type}.${field.key} block label`).toBeTruthy();
          expect(blockType.fields.length).withContext(`${type}.${field.key} block fields`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('points every showWhen rule at a field that exists beside it', () => {
    for (const [type, fields] of Object.entries(SECTION_SCHEMAS)) {
      const check = (list: typeof fields) => {
        const keys = new Set(list.map(f => f.key));
        for (const field of list) {
          if (field.showWhen) {
            expect(keys.has(field.showWhen.key))
              .withContext(`${type}.${field.key} depends on missing ${field.showWhen.key}`)
              .toBe(true);
          }
          if (field.itemFields) check(field.itemFields);
        }
      };
      check(fields);
    }
  });
});
