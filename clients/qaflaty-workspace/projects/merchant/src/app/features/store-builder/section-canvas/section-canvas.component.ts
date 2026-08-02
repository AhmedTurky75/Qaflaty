import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CdkDragDrop, CdkDragStart, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { SectionConfigurationDto } from 'shared';
import {
  createSectionInstance, findSectionType, SectionTypeInfo, sectionTypeLabel
} from '../section-preview/section-catalog';
import { SectionMiniatureComponent } from '../section-preview/section-miniature.component';
import { SectionPreviewFrameComponent } from '../section-preview/section-preview-frame.component';
import { BuilderDragStateService } from './builder-drag-state.service';

interface DeletedSection {
  section: SectionConfigurationDto;
  index: number;
  label: string;
}

/**
 * The page canvas: one vertical flow of full-width blocks, ordered purely by
 * array index. There is no absolute positioning and no z-index stacking between
 * sections, so two blocks cannot overlap by construction — each one is also
 * clipped to its own wrapper so a section's internal styles cannot bleed into
 * its neighbours.
 */
@Component({
  selector: 'app-section-canvas',
  standalone: true,
  imports: [DragDropModule, CdkScrollable, SectionMiniatureComponent, SectionPreviewFrameComponent],
  template: `
    <div
      class="qf-canvas-scroll h-full overflow-y-auto rounded-xl border-2 bg-canvas p-4 transition-colors"
      [class.border-transparent]="!dragState.dragging()"
      [class.border-primary]="dragState.dragging()"
      [class.bg-primary-tint]="dragState.dragging()"
      cdkScrollable
    >
      <div
        cdkDropList
        cdkDropListOrientation="vertical"
        [cdkDropListData]="sections()"
        (cdkDropListDropped)="onDrop($event)"
        class="flex min-h-[240px] flex-col gap-6"
        [class.qf-dragging]="dragState.dragging()"
      >
        @for (section of sections(); track section.id; let index = $index; let count = $count) {
          <article
            cdkDrag
            [cdkDragData]="section"
            [cdkDragStartDelay]="dragStartDelay"
            (cdkDragStarted)="onDragStarted($event)"
            (cdkDragEnded)="dragState.end()"
            tabindex="0"
            class="qf-section group relative rounded-lg bg-surface shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            [class.qf-picked]="pickedId() === section.id"
            [class.qf-just-dropped]="justDroppedId() === section.id"
            [class.opacity-50]="!section.isEnabled"
            [attr.aria-label]="ariaLabelFor(section, index, count)"
            [attr.aria-roledescription]="'Page section. Press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.'"
            (keydown)="onSectionKeydown($event, index)"
          >
            <div *cdkDragPlaceholder class="qf-drop-indicator" [style.height.px]="placeholderHeight()">
              <span class="qf-drop-line"><i></i><i></i></span>
              <span class="qf-drop-label">Drop here</span>
            </div>

            <!-- Boundary chip: only visible while a drag is in flight. -->
            <span class="qf-boundary-chip">{{ typeLabel(section.sectionType) }}</span>

            @if (!section.isEnabled) {
              <span class="absolute bottom-2 start-2 z-20 rounded bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-text-muted">Hidden from shoppers</span>
            }

            <!--
              Floats just above the block's top edge, into the gap between
              sections, so it never covers the section's own content.
            -->
            <div class="qf-toolbar absolute end-2 -top-3 z-20 flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-md">
              <button type="button" cdkDragHandle
                class="qf-tool cursor-grab" aria-label="Drag to reorder this section" title="Drag to reorder">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z"/></svg>
              </button>
              <button type="button" (click)="editSection.emit(section)"
                class="qf-tool hover:text-primary" [attr.aria-label]="'Edit ' + typeLabel(section.sectionType)" title="Edit this section">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button type="button" (click)="duplicate(index)"
                class="qf-tool hover:text-primary" [attr.aria-label]="'Duplicate ' + typeLabel(section.sectionType)" title="Duplicate">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
              </button>
              <button type="button" (click)="move(index, -1)" [disabled]="index === 0"
                class="qf-tool hover:text-primary disabled:opacity-30" aria-label="Move section up" title="Move up">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
              </button>
              <button type="button" (click)="move(index, 1)" [disabled]="index === count - 1"
                class="qf-tool hover:text-primary disabled:opacity-30" aria-label="Move section down" title="Move down">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button type="button" (click)="toggleVisible(index)"
                class="qf-tool hover:text-primary"
                [attr.aria-label]="section.isEnabled ? 'Hide this section from shoppers' : 'Show this section to shoppers'"
                [title]="section.isEnabled ? 'Hide from shoppers' : 'Show to shoppers'">
                @if (section.isEnabled) {
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                } @else {
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                }
              </button>
              <button type="button" (click)="remove(index)"
                class="qf-tool text-danger hover:text-danger" [attr.aria-label]="'Delete ' + typeLabel(section.sectionType)" title="Delete">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>

            <!-- The block itself: clipped, non-interactive, full width. -->
            <div class="overflow-hidden rounded-lg">
              <app-section-preview-frame [aspect]="aspectFor(section.sectionType)" [maxHeight]="320">
                <app-section-miniature
                  [variantId]="section.variantId"
                  [typeLabel]="typeLabel(section.sectionType)"
                  [section]="section" />
              </app-section-preview-frame>
            </div>
          </article>
        } @empty {
          <div class="flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 text-center">
            <svg class="mb-3 h-10 w-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
            </svg>
            <p class="text-sm font-medium text-text">Drag a section here to start building your page.</p>
            <p class="mt-1 text-xs text-text-muted">Pick one from the Sections panel — it arrives ready, with your own products in it.</p>
          </div>
        }
      </div>
    </div>

    <!-- Undo toast, preferred over a blocking confirm dialog. -->
    @if (lastDeleted(); as deleted) {
      <div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-text px-4 py-3 shadow-xl">
        <span class="text-sm text-surface">{{ deleted.label }} removed.</span>
        <button type="button" (click)="undoDelete()"
          class="rounded px-2 py-1 text-sm font-semibold text-surface underline focus:outline-none focus:ring-2 focus:ring-primary">
          Undo
        </button>
      </div>
    }

    <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .qf-section { border: 1px solid transparent; }

    /* Every block shows its boundary while a drag is in flight, so the seller
       can tell exactly where one section ends and the next begins. */
    .qf-dragging .qf-section {
      outline: 1px dashed rgb(var(--c-primary) / .7);
      outline-offset: 2px;
    }
    .qf-boundary-chip {
      position: absolute;
      top: -.55rem;
      inset-inline-start: .5rem;
      z-index: 20;
      display: none;
      border-radius: .25rem;
      background: rgb(var(--c-primary));
      padding: .05rem .35rem;
      font-size: 10px;
      font-weight: 500;
      color: #fff;
    }
    .qf-dragging .qf-boundary-chip { display: block; }

    .qf-toolbar {
      opacity: 0;
      transition: opacity .12s ease;
    }
    .qf-section:hover .qf-toolbar,
    .qf-section:focus-within .qf-toolbar,
    .qf-section:focus-visible .qf-toolbar { opacity: 1; }

    .qf-tool {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: .25rem;
      padding: .25rem;
      color: rgb(var(--c-muted));
    }
    .qf-tool:focus-visible {
      outline: 2px solid rgb(var(--c-primary));
      outline-offset: 1px;
    }

    /* Single insertion indicator: dashed block at the height the section will
       occupy, with an accent line and a caret at each end. */
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
    .qf-drop-label {
      font-size: 11px;
      font-weight: 600;
      color: rgb(var(--c-primary));
    }

    .qf-picked {
      outline: 2px solid rgb(var(--c-primary));
      outline-offset: 2px;
      box-shadow: 0 8px 20px rgb(0 0 0 / .18);
    }

    .qf-just-dropped { animation: qf-drop-in .18s ease-out, qf-pulse .6s ease-out .18s; }

    @keyframes qf-drop-in {
      from { opacity: 0; transform: scale(.98); }
      to { opacity: 1; transform: none; }
    }
    @keyframes qf-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgb(var(--c-primary) / 0); }
      35% { box-shadow: 0 0 0 4px rgb(var(--c-primary) / .35); }
    }
    @keyframes qf-indicator-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cdk-drag-preview {
      border-radius: .5rem;
      box-shadow: 0 12px 28px rgb(0 0 0 / .22);
      opacity: .9;
    }
    .cdk-drag-animating { transition: transform .2s cubic-bezier(0, 0, .2, 1); }

    @media (prefers-reduced-motion: reduce) {
      .qf-just-dropped,
      .qf-drop-indicator { animation: none; }
      .qf-toolbar,
      .cdk-drag-animating,
      .qf-canvas-scroll { transition: none !important; }
    }
  `]
})
export class SectionCanvasComponent {
  sections = input.required<SectionConfigurationDto[]>();
  sectionsChange = output<SectionConfigurationDto[]>();
  /** Asks the host to open the settings modal for this section. */
  editSection = output<SectionConfigurationDto>();

  protected readonly dragState = inject(BuilderDragStateService);

  protected readonly dragStartDelay =
    typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 150 : 0;

  protected justDroppedId = signal<string | null>(null);
  protected lastDeleted = signal<DeletedSection | null>(null);
  protected announcement = signal('');
  private draggedHeight = signal(120);
  /** Index of the section currently "picked up" with the keyboard. */
  private pickedIndex = signal<number | null>(null);
  private pickedOriginIndex: number | null = null;
  /** Blocks a second insertion while the drop animation is still running. */
  private inserting = false;
  private undoTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * The list we just handed to the host, held until the input reflects it.
   * Two actions in the same tick (delete then undo) would otherwise both read
   * the pre-change input and clobber each other.
   */
  private pending: SectionConfigurationDto[] | null = null;

  constructor() {
    effect(() => {
      this.sections();
      this.pending = null;
    });
  }

  /** Current working list: our own pending copy, or the input once it lands. */
  private list(): SectionConfigurationDto[] {
    return this.pending ?? this.sections();
  }

  protected pickedId = computed(() => {
    const index = this.pickedIndex();
    return index === null ? null : this.sections()[index]?.id ?? null;
  });

  protected typeLabel(sectionType: string): string {
    return sectionTypeLabel(sectionType);
  }

  protected aspectFor(sectionType: string): number {
    return findSectionType(sectionType)?.aspect ?? 16 / 9;
  }

  /** Measured from the block being dragged, so the gap is its true height. */
  protected placeholderHeight(): number {
    return this.draggedHeight();
  }

  protected onDragStarted(event: CdkDragStart): void {
    const height = event.source.element.nativeElement.getBoundingClientRect().height;
    if (height > 0) this.draggedHeight.set(Math.round(height));
    this.dragState.start();
  }

  protected ariaLabelFor(section: SectionConfigurationDto, index: number, count: number): string {
    const state = section.isEnabled ? '' : ', hidden';
    return `${this.typeLabel(section.sectionType)}, position ${index + 1} of ${count}${state}`;
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────

  onDrop(event: CdkDragDrop<SectionConfigurationDto[]>): void {
    this.dragState.end();

    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      const next = [...this.list()];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      this.commit(next);
      const moved = next[event.currentIndex];
      this.announce(`${this.typeLabel(moved.sectionType)} moved to position ${event.currentIndex + 1} of ${next.length}`);
      return;
    }

    // Copy-on-drop from the library: never take the item out of the source list.
    if (this.inserting) return;
    const typeInfo = event.item.data as SectionTypeInfo | undefined;
    if (!typeInfo?.key) return;

    this.insertNewSection(typeInfo.key, event.currentIndex);
  }

  /** Appends a section — used by the library's keyboard/click "Add" button. */
  addSection(typeKey: string): void {
    this.insertNewSection(typeKey, this.list().length);
  }

  private insertNewSection(typeKey: string, index: number): void {
    const created = createSectionInstance(typeKey);
    if (!created) return;

    this.inserting = true;
    const next = [...this.list()];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, created);
    this.commit(next);

    this.flashDropped(created.id);
    this.announce(`${this.typeLabel(created.sectionType)} added, position ${next.indexOf(created) + 1} of ${next.length}`);
    setTimeout(() => { this.inserting = false; }, 200);
  }

  // ── Toolbar actions ──────────────────────────────────────────────────────

  protected duplicate(index: number): void {
    const source = this.list()[index];
    if (!source) return;

    // Deep clone with a fresh id — the backend recreates every section on save,
    // so this persists as a new row with identical content and settings.
    const clone: SectionConfigurationDto = {
      ...JSON.parse(JSON.stringify(source)) as SectionConfigurationDto,
      id: crypto.randomUUID()
    };

    const next = [...this.list()];
    next.splice(index + 1, 0, clone);
    this.commit(next);
    this.flashDropped(clone.id);
    this.announce(`${this.typeLabel(clone.sectionType)} duplicated, position ${index + 2} of ${next.length}`);
  }

  protected move(index: number, delta: number): void {
    const target = index + delta;
    const next = [...this.list()];
    if (target < 0 || target >= next.length) return;

    moveItemInArray(next, index, target);
    this.commit(next);
    this.announce(`${this.typeLabel(next[target].sectionType)} moved to position ${target + 1} of ${next.length}`);
  }

  protected toggleVisible(index: number): void {
    const next = this.list().map((s, i) => i === index ? { ...s, isEnabled: !s.isEnabled } : s);
    this.commit(next);
    const changed = next[index];
    this.announce(`${this.typeLabel(changed.sectionType)} ${changed.isEnabled ? 'shown' : 'hidden'}`);
  }

  protected remove(index: number): void {
    const section = this.list()[index];
    if (!section) return;

    const label = this.typeLabel(section.sectionType);
    this.commit(this.list().filter((_, i) => i !== index));
    this.announce(`${label} removed`);

    this.lastDeleted.set({ section, index, label });
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => this.lastDeleted.set(null), 6000);
  }

  protected undoDelete(): void {
    const deleted = this.lastDeleted();
    if (!deleted) return;

    const next = [...this.list()];
    next.splice(Math.min(deleted.index, next.length), 0, deleted.section);
    this.commit(next);
    this.lastDeleted.set(null);
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.announce(`${deleted.label} restored to position ${deleted.index + 1} of ${next.length}`);
  }

  // ── Keyboard reordering ──────────────────────────────────────────────────

  protected onSectionKeydown(event: KeyboardEvent, index: number): void {
    // Let the toolbar buttons keep their own key handling.
    if (event.target !== event.currentTarget) return;

    const picked = this.pickedIndex();

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (picked === null) {
        this.pickedIndex.set(index);
        this.pickedOriginIndex = index;
        this.announce(`${this.typeLabel(this.list()[index].sectionType)} picked up. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      } else {
        this.pickedIndex.set(null);
        this.pickedOriginIndex = null;
        this.announce(`Dropped at position ${index + 1} of ${this.list().length}`);
      }
      return;
    }

    if (event.key === 'Escape' && picked !== null) {
      event.preventDefault();
      if (this.pickedOriginIndex !== null && this.pickedOriginIndex !== picked) {
        const next = [...this.list()];
        moveItemInArray(next, picked, this.pickedOriginIndex);
        this.commit(next);
      }
      this.pickedIndex.set(null);
      this.pickedOriginIndex = null;
      this.announce('Move cancelled');
      return;
    }

    if (picked === null || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;

    event.preventDefault();
    const target = picked + (event.key === 'ArrowUp' ? -1 : 1);
    if (target < 0 || target >= this.list().length) return;

    const next = [...this.list()];
    moveItemInArray(next, picked, target);
    this.commit(next);
    this.pickedIndex.set(target);
    this.announce(`Position ${target + 1} of ${next.length}`);

    // Keep focus on the block that moved, now at its new position.
    const list = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() => {
      const moved = list?.children.item(target);
      if (moved instanceof HTMLElement) moved.focus();
    });
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  /** Renumbers `sortOrder` from the array order and hands the list back up. */
  private commit(sections: SectionConfigurationDto[]): void {
    sections.forEach((section, index) => { section.sortOrder = index + 1; });
    this.pending = sections;
    this.sectionsChange.emit(sections);
  }

  private flashDropped(id: string): void {
    this.justDroppedId.set(id);
    setTimeout(() => {
      if (this.justDroppedId() === id) this.justDroppedId.set(null);
    }, 800);
  }

  private announce(message: string): void {
    this.announcement.set(message);
  }
}
