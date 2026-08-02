import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SECTION_GROUPS, SECTION_TYPES, SectionGroup, SectionTypeInfo } from '../section-preview/section-catalog';
import { SectionMiniatureComponent } from '../section-preview/section-miniature.component';
import { SectionPreviewFrameComponent } from '../section-preview/section-preview-frame.component';
import { SectionPreviewDataService } from '../section-preview/section-preview-data.service';
import { BuilderDragStateService } from '../section-canvas/builder-drag-state.service';

/**
 * The drag source. Every entry is a live miniature of the real section drawn
 * with the store's own products and categories, so a seller picks a block by
 * recognising it rather than by reading a type name.
 *
 * The list is copy-on-drop: `cdkDropListSortingDisabled` keeps the panel from
 * re-sorting itself, and the canvas builds a fresh section from the dragged
 * type instead of taking the item out of here.
 */
@Component({
  selector: 'app-section-library',
  standalone: true,
  imports: [DragDropModule, SectionMiniatureComponent, SectionPreviewFrameComponent],
  template: `
    <div class="flex h-full flex-col">
      <div class="border-b border-border px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-text">Sections</h3>
          @if (previewData.usingSampleData()) {
            <span class="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-text-muted"
              title="Your store has no products or categories yet, so these previews use sample data.">
              Sample data
            </span>
          }
        </div>
        <p class="mt-0.5 text-xs text-text-muted">Drag one onto your page</p>
        <label class="sr-only" for="section-search">Search sections</label>
        <input
          id="section-search"
          type="search"
          [value]="query()"
          (input)="onSearch($event)"
          placeholder="Search sections"
          class="mt-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div
        class="flex-1 overflow-y-auto px-3 py-3"
        cdkDropList
        [cdkDropListData]="allTypes"
        cdkDropListSortingDisabled
        [id]="dropListId()"
      >
        @if (previewData.loading()) {
          <!-- Skeletons keep the panel from jumping when the catalogue lands. -->
          @for (i of skeletons; track i) {
            <div class="mb-3 overflow-hidden rounded-lg border border-border">
              <div class="h-4 w-24 animate-pulse rounded bg-surface-elevated m-3"></div>
              <div class="aspect-video animate-pulse bg-surface-elevated"></div>
            </div>
          }
        } @else {
          @for (group of visibleGroups(); track group.key) {
            <section class="mb-5">
              <h4 class="mb-0.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{{ group.label }}</h4>
              <p class="mb-2 px-1 text-[11px] text-text-muted/80">{{ group.hint }}</p>

              <div class="space-y-3">
                @for (type of typesIn(group.key); track type.key) {
                  <div
                    cdkDrag
                    [cdkDragData]="type"
                    [cdkDragStartDelay]="dragStartDelay"
                    (cdkDragStarted)="dragState.start()"
                    (cdkDragEnded)="dragState.end()"
                    class="group relative overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:border-primary hover:shadow-md"
                  >
                    <!-- Compact card that follows the cursor, so the canvas stays visible. -->
                    <div *cdkDragPreview class="qf-drag-preview flex items-center gap-2 rounded-lg border border-primary bg-surface px-3 py-2 shadow-xl">
                      <span class="flex h-8 w-12 items-center justify-center rounded bg-primary-tint text-[10px] font-semibold text-primary">Drop</span>
                      <span class="text-sm font-medium text-text">{{ type.label }}</span>
                    </div>

                    <!--
                      CDK moves this element into whichever list the pointer is
                      over, so it doubles as the canvas insertion indicator:
                      one accent line with caret ends over a dashed block the
                      size of the space the section will take.
                    -->
                    <div *cdkDragPlaceholder class="qf-drop-indicator" [style.height.px]="140">
                      <span class="qf-drop-line"><i></i><i></i></span>
                      <span class="qf-drop-label">Drop here</span>
                    </div>

                    <div class="flex items-start justify-between gap-2 px-3 pt-2.5">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-text">{{ type.label }}</p>
                        <p class="truncate text-xs text-text-muted">{{ type.description }}</p>
                      </div>
                      <button
                        type="button"
                        (click)="add.emit(type.key)"
                        class="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        [attr.aria-label]="'Add ' + type.label + ' to the end of the page'"
                      >Add</button>
                    </div>

                    <app-section-preview-frame class="mt-2 block" [aspect]="type.aspect" [maxHeight]="180">
                      <app-section-miniature [variantId]="type.defaultVariantId" [typeLabel]="type.label" />
                    </app-section-preview-frame>

                    <span class="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-primary/90 py-1 text-center text-[11px] font-medium text-white group-hover:block">
                      Drag onto the page
                    </span>
                  </div>
                }
              </div>
            </section>
          } @empty {
            <div class="px-2 py-8 text-center">
              <p class="text-sm text-text">No section matches "{{ query() }}".</p>
              <p class="mt-1 text-xs text-text-muted">Try a shorter word, like "product" or "review".</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .qf-drag-preview { opacity: .9; }
    .cdk-drag-preview { box-shadow: 0 12px 28px rgb(0 0 0 / .22); }

    .qf-drop-indicator {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed rgb(var(--c-primary) / .6);
      border-radius: .5rem;
      background: rgb(var(--c-primary) / .06);
      animation: qf-indicator-in .12s ease-out;
    }
    .qf-drop-line {
      position: absolute;
      top: -2px;
      inset-inline: 0;
      height: 3px;
      border-radius: 999px;
      background: rgb(var(--c-primary));
    }
    .qf-drop-line i {
      position: absolute;
      top: 50%;
      width: 9px;
      height: 9px;
      border-radius: 2px;
      background: rgb(var(--c-primary));
      transform: translateY(-50%) rotate(45deg);
    }
    .qf-drop-line i:first-child { inset-inline-start: -4px; }
    .qf-drop-line i:last-child { inset-inline-end: -4px; }
    .qf-drop-label { font-size: 11px; font-weight: 600; color: rgb(var(--c-primary)); }

    @keyframes qf-indicator-in { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .qf-drop-indicator { animation: none; }
      .cdk-drag-animating, .cdk-drag-placeholder { transition: none !important; }
    }
  `]
})
export class SectionLibraryComponent {
  /** Shared id so the canvas can name this list as a connected drop target. */
  dropListId = input<string>('section-library-list');
  /** Emitted by the keyboard/click "Add" affordance — appends to the page end. */
  add = output<string>();

  protected readonly previewData = inject(SectionPreviewDataService);
  protected readonly dragState = inject(BuilderDragStateService);
  protected readonly allTypes = SECTION_TYPES;
  protected readonly skeletons = [1, 2, 3, 4];

  protected query = signal('');

  /** Touch needs a short hold so scrolling the panel doesn't start a drag. */
  protected readonly dragStartDelay =
    typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 150 : 0;

  private matches = computed<SectionTypeInfo[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return SECTION_TYPES;
    return SECTION_TYPES.filter(t =>
      t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  });

  protected visibleGroups = computed<SectionGroup[]>(() => {
    const present = new Set(this.matches().map(t => t.group));
    return SECTION_GROUPS.filter(g => present.has(g.key));
  });

  protected typesIn(groupKey: string): SectionTypeInfo[] {
    return this.matches().filter(t => t.group === groupKey);
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
