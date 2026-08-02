import { Component, effect, input, output, signal } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { SectionFieldControlComponent } from './section-field-control.component';
import { ContentObject, readArray, readContent, readSettings, setArray, setContentValue, setSettingsValue } from './section-content';
import { SectionField, schemaFor } from './section-schema';

/** 5x5 anchor grid ("row-col", 1-based) for text placed over an image. */
const OVERLAY_CELLS = Array.from({ length: 25 }, (_, i) => `${Math.floor(i / 5) + 1}-${(i % 5) + 1}`);
const LEGACY_ROW: Record<string, number> = { top: 1, center: 3, bottom: 5 };
const LEGACY_COL: Record<string, number> = { left: 1, center: 3, right: 5 };

/**
 * Renders a section's settings from its schema.
 *
 * There is no per-type markup here: the schema says which fields a type has,
 * `SectionFieldControlComponent` draws each one, and this component owns the
 * structure around them — repeatable rows, the specifications table, and the
 * anchor grid for text placed over an image.
 */
@Component({
  selector: 'app-section-fields',
  standalone: true,
  imports: [SectionFieldControlComponent],
  template: `
    <div class="grid grid-cols-2 gap-3">
      @for (field of visibleFields(); track field.key + $index) {
        <div [class.col-span-2]="field.full">

          @switch (field.kind) {

            @case ('list') {
              <div class="rounded-lg border border-border p-3">
                <p class="mb-2 text-xs font-semibold text-text">{{ field.label }}</p>

                <div class="space-y-3">
                  @for (item of itemsOf(field.key); track $index; let index = $index; let count = $count) {
                    <div class="rounded-md border border-border bg-surface-elevated p-3">
                      <div class="mb-2 flex items-center justify-between">
                        <span class="text-xs font-medium text-text-muted">{{ field.itemNoun || 'Item' }} {{ index + 1 }}</span>
                        <div class="flex items-center gap-1">
                          <button type="button" (click)="moveItem(field.key, index, -1)" [disabled]="index === 0"
                            class="rounded p-1 text-text-muted hover:text-primary disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            [attr.aria-label]="'Move ' + (field.itemNoun || 'item') + ' ' + (index + 1) + ' up'">↑</button>
                          <button type="button" (click)="moveItem(field.key, index, 1)" [disabled]="index === count - 1"
                            class="rounded p-1 text-text-muted hover:text-primary disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            [attr.aria-label]="'Move ' + (field.itemNoun || 'item') + ' ' + (index + 1) + ' down'">↓</button>
                          <button type="button" (click)="removeItem(field.key, index)"
                            class="rounded p-1 text-danger hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            [attr.aria-label]="'Remove ' + (field.itemNoun || 'item') + ' ' + (index + 1)">✕</button>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-3">
                        @for (itemField of visibleItemFields(field, item); track itemField.key + $index) {
                          <div [class.col-span-2]="itemField.full">
                            @if (itemField.kind === 'overlayAnchor') {
                              <p class="mb-1 text-xs font-medium text-text">{{ itemField.label }}</p>
                              <p class="mb-2 text-[11px] text-text-muted">Click a square for where the text starts, then a second for where it ends.</p>
                              <div class="grid w-40 grid-cols-5 gap-0.5">
                                @for (cell of overlayCells; track cell) {
                                  <button type="button" (click)="pickOverlayCell(field.key, index, item, cell)"
                                    class="h-6 w-6 rounded-sm border border-border transition-colors"
                                    [class.bg-primary]="isOverlayEndpoint(item, cell)"
                                    [class.bg-primary-tint]="!isOverlayEndpoint(item, cell) && isInOverlaySpan(item, cell)"
                                    [attr.aria-label]="'Text area cell ' + cell"
                                    [attr.aria-pressed]="isInOverlaySpan(item, cell)"></button>
                                }
                              </div>
                            } @else {
                              <app-section-field-control
                                [field]="itemField"
                                [value]="item[itemField.key]"
                                [storeId]="storeId()"
                                [productOptions]="productOptions()"
                                [idPrefix]="idPrefix() + '-' + field.key + '-' + index"
                                (valueChange)="setItemValue(field.key, index, itemField.key, $event)"
                              />
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @empty {
                    <p class="py-2 text-xs text-text-muted">Nothing here yet.</p>
                  }
                </div>

                <button type="button" (click)="addItem(field)"
                  class="mt-2 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary/40">
                  + {{ field.addLabel || 'Add' }}
                </button>
              </div>
            }

            @case ('specGroups') {
              <div class="rounded-lg border border-border p-3">
                <p class="mb-2 text-xs font-semibold text-text">{{ field.label }}</p>

                @for (group of specGroups(); track $index; let gi = $index) {
                  <div class="mb-3 rounded-md border border-border bg-surface-elevated p-3">
                    <div class="mb-2 flex items-end gap-2">
                      <div class="flex-1">
                        <label class="mb-1 block text-xs font-medium text-text">Group name (EN)</label>
                        <input #gEn type="text" [value]="bilingualOf(group['name'], 'en')"
                          (input)="setGroupName(gi, 'en', gEn.value)"
                          class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div class="flex-1">
                        <label class="mb-1 block text-xs font-medium text-text">Group name (AR)</label>
                        <input #gAr type="text" dir="rtl" [value]="bilingualOf(group['name'], 'ar')"
                          (input)="setGroupName(gi, 'ar', gAr.value)"
                          class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <button type="button" (click)="removeGroup(gi)"
                        class="rounded p-1.5 text-danger focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Remove this group">✕</button>
                    </div>

                    @for (row of rowsOf(group); track $index; let ri = $index) {
                      <div class="mb-1.5 grid grid-cols-9 items-center gap-2">
                        <input #rlEn type="text" placeholder="Label (EN)" [value]="bilingualOf(row['label'], 'en')"
                          (input)="setRow(gi, ri, 'label', 'en', rlEn.value)"
                          class="col-span-2 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                        <input #rlAr type="text" dir="rtl" placeholder="Label (AR)" [value]="bilingualOf(row['label'], 'ar')"
                          (input)="setRow(gi, ri, 'label', 'ar', rlAr.value)"
                          class="col-span-2 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                        <input #rvEn type="text" placeholder="Value (EN)" [value]="bilingualOf(row['value'], 'en')"
                          (input)="setRow(gi, ri, 'value', 'en', rvEn.value)"
                          class="col-span-2 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                        <input #rvAr type="text" dir="rtl" placeholder="Value (AR)" [value]="bilingualOf(row['value'], 'ar')"
                          (input)="setRow(gi, ri, 'value', 'ar', rvAr.value)"
                          class="col-span-2 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                        <button type="button" (click)="removeRow(gi, ri)"
                          class="rounded p-1 text-danger focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Remove this row">✕</button>
                      </div>
                    }

                    <button type="button" (click)="addRow(gi)"
                      class="mt-1 rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary/40">
                      + Add a row
                    </button>
                  </div>
                }

                <button type="button" (click)="addGroup()"
                  class="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary/40">
                  + Add a group
                </button>
              </div>
            }

            @default {
              <app-section-field-control
                [field]="field"
                [value]="valueOf(field)"
                [storeId]="storeId()"
                [productOptions]="productOptions()"
                [idPrefix]="idPrefix()"
                (valueChange)="setValue(field, $event)"
              />
            }
          }
        </div>
      } @empty {
        <p class="col-span-2 py-2 text-xs text-text-muted">
          There is nothing to fill in here — this section builds itself from your store's own content.
        </p>
      }
    </div>
  `
})
export class SectionFieldsComponent {
  section = input.required<SectionConfigurationDto>();
  storeId = input<string | null>(null);
  productOptions = input<{ slug: string; name: string }[]>([]);
  idPrefix = input<string>('section');

  /** The section with the edit applied; the host swaps it into the page. */
  sectionChange = output<SectionConfigurationDto>();

  protected readonly overlayCells = OVERLAY_CELLS;

  /** List rows waiting for the second click that sets the end of the text area. */
  private awaitingOverlayEnd = signal<Set<string>>(new Set());

  /**
   * The section we last handed up, held until the input reflects it. Two edits
   * in the same turn (adding a row, then filling it in) would otherwise both
   * start from the pre-edit section and the first one would be lost.
   */
  private pending: SectionConfigurationDto | null = null;

  constructor() {
    effect(() => {
      this.section();
      this.pending = null;
    });
  }

  /** The section as it stands right now, edits included. */
  private current(): SectionConfigurationDto {
    return this.pending ?? this.section();
  }

  private emit(next: SectionConfigurationDto): void {
    this.pending = next;
    this.sectionChange.emit(next);
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  protected visibleFields(): SectionField[] {
    const content = readContent(this.current());
    const settings = readSettings(this.current());
    return schemaFor(this.current().sectionType)
      .filter(field => this.isVisible(field, field.target === 'settings' ? settings : content));
  }

  protected visibleItemFields(listField: SectionField, item: ContentObject): SectionField[] {
    return (listField.itemFields ?? []).filter(field => this.isVisible(field, item));
  }

  private isVisible(field: SectionField, container: ContentObject): boolean {
    const rule = field.showWhen;
    if (!rule) return true;

    const raw = container[rule.key];
    const current = typeof raw === 'string' && raw ? raw : rule.fallback ?? '';
    return rule.equals.includes(current);
  }

  protected valueOf(field: SectionField): unknown {
    const container = field.target === 'settings' ? readSettings(this.current()) : readContent(this.current());
    return container[field.key];
  }

  protected itemsOf(key: string): ContentObject[] {
    return readArray(this.current(), key);
  }

  protected specGroups(): ContentObject[] {
    return readArray(this.current(), 'groups');
  }

  protected rowsOf(group: ContentObject): ContentObject[] {
    return Array.isArray(group['rows']) ? group['rows'] as ContentObject[] : [];
  }

  protected bilingualOf(value: unknown, lang: 'en' | 'ar'): string {
    if (!value || typeof value !== 'object') return '';
    const text = (value as Record<string, unknown>)[lang];
    return typeof text === 'string' ? text : '';
  }

  // ── Writing ──────────────────────────────────────────────────────────────

  protected setValue(field: SectionField, value: unknown): void {
    this.emit(field.target === 'settings'
      ? setSettingsValue(this.current(), field.key, value)
      : setContentValue(this.current(), field.key, value));
  }

  protected setItemValue(listKey: string, index: number, key: string, value: unknown): void {
    this.patchItem(listKey, index, { [key]: value });
  }

  private patchItem(listKey: string, index: number, patch: ContentObject): void {
    const items = this.itemsOf(listKey).map((item, i) => i === index ? { ...item, ...patch } : item);
    this.emit(setArray(this.current(), listKey, items));
  }

  protected addItem(field: SectionField): void {
    const template = field.newItem ? { ...field.newItem } : {};
    this.emit(setArray(this.current(), field.key, [...this.itemsOf(field.key), template]));
  }

  protected removeItem(listKey: string, index: number): void {
    this.emit(setArray(this.current(), listKey, this.itemsOf(listKey).filter((_, i) => i !== index)));
  }

  protected moveItem(listKey: string, index: number, delta: number): void {
    const items = [...this.itemsOf(listKey)];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(target, 0, moved);
    this.emit(setArray(this.current(), listKey, items));
  }

  // ── Specifications table ─────────────────────────────────────────────────

  private setGroups(groups: ContentObject[]): void {
    this.emit(setContentValue(this.current(), 'groups', groups));
  }

  protected addGroup(): void {
    this.setGroups([...this.specGroups(), { name: { en: '', ar: '' }, rows: [] }]);
  }

  protected removeGroup(gi: number): void {
    this.setGroups(this.specGroups().filter((_, i) => i !== gi));
  }

  protected setGroupName(gi: number, lang: 'en' | 'ar', value: string): void {
    this.setGroups(this.specGroups().map((group, i) => i === gi
      ? { ...group, name: { ...(group['name'] as ContentObject ?? {}), [lang]: value } }
      : group));
  }

  protected addRow(gi: number): void {
    this.setGroups(this.specGroups().map((group, i) => i === gi
      ? { ...group, rows: [...this.rowsOf(group), { label: { en: '', ar: '' }, value: { en: '', ar: '' } }] }
      : group));
  }

  protected removeRow(gi: number, ri: number): void {
    this.setGroups(this.specGroups().map((group, i) => i === gi
      ? { ...group, rows: this.rowsOf(group).filter((_, r) => r !== ri) }
      : group));
  }

  protected setRow(gi: number, ri: number, key: 'label' | 'value', lang: 'en' | 'ar', value: string): void {
    this.setGroups(this.specGroups().map((group, i) => {
      if (i !== gi) return group;
      const rows = this.rowsOf(group).map((row, r) => r === ri
        ? { ...row, [key]: { ...(row[key] as ContentObject ?? {}), [lang]: value } }
        : row);
      return { ...group, rows };
    }));
  }

  // ── Text-over-image anchor grid ──────────────────────────────────────────

  /**
   * First click sets a single-cell area and arms the row; the second click
   * stretches it to the cell clicked. Clicking again starts a fresh selection.
   */
  protected pickOverlayCell(listKey: string, index: number, item: ContentObject, cell: string): void {
    const rowKey = `${listKey}:${index}`;
    const awaiting = new Set(this.awaitingOverlayEnd());

    if (awaiting.has(rowKey)) {
      this.patchItem(listKey, index, { overlayEndPosition: cell });
      awaiting.delete(rowKey);
    } else {
      this.patchItem(listKey, index, { overlayPosition: cell, overlayEndPosition: cell });
      awaiting.add(rowKey);
    }

    this.awaitingOverlayEnd.set(awaiting);
  }

  protected isOverlayEndpoint(item: ContentObject, cell: string): boolean {
    const start = this.splitCell(this.overlayStart(item));
    const end = this.splitCell(this.overlayEnd(item));
    const current = this.splitCell(cell);
    return (current.row === start.row && current.col === start.col)
      || (current.row === end.row && current.col === end.col);
  }

  protected isInOverlaySpan(item: ContentObject, cell: string): boolean {
    const start = this.splitCell(this.overlayStart(item));
    const end = this.splitCell(this.overlayEnd(item));
    const current = this.splitCell(cell);

    return current.row >= Math.min(start.row, end.row)
      && current.row <= Math.max(start.row, end.row)
      && current.col >= Math.min(start.col, end.col)
      && current.col <= Math.max(start.col, end.col);
  }

  private overlayStart(item: ContentObject): string {
    return typeof item['overlayPosition'] === 'string' ? item['overlayPosition'] : 'bottom-left';
  }

  private overlayEnd(item: ContentObject): string {
    return typeof item['overlayEndPosition'] === 'string' ? item['overlayEndPosition'] : this.overlayStart(item);
  }

  /** Reads "row-col", falling back to legacy names like "bottom-left". */
  private splitCell(cell: string): { row: number; col: number } {
    const [a, b] = (cell || '').split('-');
    const row = Number(a);
    const col = Number(b);
    if (!isNaN(row) && !isNaN(col)) return { row, col };
    return { row: LEGACY_ROW[a] ?? 3, col: LEGACY_COL[b || 'center'] ?? 3 };
  }
}
