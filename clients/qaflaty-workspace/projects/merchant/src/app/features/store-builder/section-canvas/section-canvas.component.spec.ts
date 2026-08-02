import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { SectionConfigurationDto } from 'shared';
import { SectionCanvasComponent } from './section-canvas.component';
import { SECTION_TYPES, SectionTypeInfo } from '../section-preview/section-catalog';

@Component({
  standalone: true,
  imports: [SectionCanvasComponent],
  template: `<app-section-canvas [sections]="sections()" (sectionsChange)="sections.set($event)" />`
})
class HostComponent {
  sections = signal<SectionConfigurationDto[]>([]);
}

function section(id: string, sortOrder: number): SectionConfigurationDto {
  return {
    id,
    sectionType: 'Hero',
    variantId: 'hero-full-image',
    isEnabled: true,
    sortOrder,
    contentJson: JSON.stringify({ title: { en: id, ar: id } }),
    settingsJson: JSON.stringify({ paddingY: 'lg' })
  };
}

/** Minimal stand-in for the CDK event; the handler only reads these fields. */
function dropEvent(options: {
  sameContainer: boolean;
  previousIndex: number;
  currentIndex: number;
  data?: SectionTypeInfo;
}): CdkDragDrop<SectionConfigurationDto[]> {
  const container = { id: 'canvas' };
  return {
    previousIndex: options.previousIndex,
    currentIndex: options.currentIndex,
    container,
    previousContainer: options.sameContainer ? container : { id: 'library' },
    item: { data: options.data }
  } as unknown as CdkDragDrop<SectionConfigurationDto[]>;
}

describe('SectionCanvasComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  function mount(initial: SectionConfigurationDto[]) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.sections.set(initial);
    fixture.detectChanges();
    const canvas = fixture.debugElement.children[0].componentInstance as SectionCanvasComponent;
    return { fixture, canvas, host: fixture.componentInstance };
  }

  it('builds a new section on a library drop instead of moving the dragged item', () => {
    const heroType = SECTION_TYPES.find(t => t.key === 'FeaturedProducts')!;
    const { canvas, host } = mount([section('a', 1), section('b', 2)]);

    canvas.onDrop(dropEvent({ sameContainer: false, previousIndex: 0, currentIndex: 1, data: heroType }));

    const result = host.sections();
    expect(result.length).toBe(3);
    expect(result[1].sectionType).toBe('FeaturedProducts');
    expect(result[1].id).not.toBe('a');
    expect(result.map(s => s.sortOrder)).toEqual([1, 2, 3]);
  });

  it('ignores a second drop while the first insert is still settling', () => {
    const type = SECTION_TYPES[0];
    const { canvas, host } = mount([]);

    canvas.onDrop(dropEvent({ sameContainer: false, previousIndex: 0, currentIndex: 0, data: type }));
    canvas.onDrop(dropEvent({ sameContainer: false, previousIndex: 0, currentIndex: 0, data: type }));

    expect(host.sections().length).toBe(1);
  });

  it('reorders within the canvas and renumbers sortOrder', () => {
    const { canvas, host } = mount([section('a', 1), section('b', 2), section('c', 3)]);

    canvas.onDrop(dropEvent({ sameContainer: true, previousIndex: 0, currentIndex: 2 }));

    expect(host.sections().map(s => s.id)).toEqual(['b', 'c', 'a']);
    expect(host.sections().map(s => s.sortOrder)).toEqual([1, 2, 3]);
  });

  it('restores a deleted section, with its content, when undo is used', () => {
    const { canvas, host } = mount([section('a', 1), section('b', 2)]);
    const original = host.sections()[0];

    canvas['remove'](0);
    expect(host.sections().map(s => s.id)).toEqual(['b']);

    canvas['undoDelete']();
    expect(host.sections().map(s => s.id)).toEqual(['a', 'b']);
    expect(host.sections()[0].contentJson).toBe(original.contentJson);
    expect(host.sections()[0].settingsJson).toBe(original.settingsJson);
  });

  it('duplicates a section without touching its stored content or settings', () => {
    const { canvas, host } = mount([section('a', 1)]);

    canvas['duplicate'](0);

    const [first, copy] = host.sections();
    expect(copy.id).not.toBe(first.id);
    expect(copy.contentJson).toBe(first.contentJson);
    expect(copy.settingsJson).toBe(first.settingsJson);
  });

  it('toggles visibility without rewriting anything else on the section', () => {
    const { canvas, host } = mount([section('a', 1)]);

    canvas['toggleVisible'](0);

    expect(host.sections()[0].isEnabled).toBe(false);
    expect(host.sections()[0].settingsJson).toBe(JSON.stringify({ paddingY: 'lg' }));
  });
});
