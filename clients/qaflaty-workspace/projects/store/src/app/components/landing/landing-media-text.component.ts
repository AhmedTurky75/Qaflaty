import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';
import { Product } from '../../models/product.model';

type MediaTextLayout = 'side' | 'below' | 'overlay';

interface MediaTextItem {
  imageUrl: string;
  title: string;
  text: string;
  reverse?: boolean;
  layout: MediaTextLayout;
  scrim: 'none' | 'dark' | 'light';
  /** Start cell of the text area on the 5x5 grid, as "row-col" (1-based). */
  overlayPosition: string;
  /** End cell; equal to overlayPosition (or unset) means a single cell. */
  overlayEndPosition: string;
  textColor: string;
}

/**
 * Alternating image/text rows. Each row picks a layout:
 *  - side: image and text side by side (optionally reversed)
 *  - below: image on top, text stacked underneath, full width
 *  - overlay: text laid over the image, spanning a rectangle of cells on a
 *    fixed 5x5 grid — chosen as a start cell + end cell, both snapped to grid
 *    lines (never free pixels), so the box is always a CSS
 *    `grid-column`/`grid-row` range: proportional to the container and
 *    identical in shape at every viewport width. object-fit: cover crops the
 *    image differently per breakpoint, so pixel/percent coordinates chosen in
 *    the editor wouldn't line up on other screen sizes — a grid-line range
 *    doesn't have that problem.
 *
 *    The grid itself is responsive: below `md` it collapses to 2x2 (the two
 *    inner rows/columns collapse toward the far edge) so a box keeps
 *    proportionally the same footprint with less crowding on a small screen;
 *    `md` and up uses the full 5x5 grid. Implemented with CSS custom
 *    properties consumed by a plain media query in this component's
 *    stylesheet — no JS resize listeners.
 */
@Component({
  selector: 'app-landing-media-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 space-y-16">
      @for (item of items(); track $index) {
        @switch (item.layout) {
          @case ('below') {
            <div class="space-y-5" [class.flex]="item.reverse" [class.flex-col-reverse]="item.reverse">
              <div class="rounded-xl overflow-hidden bg-gray-50 aspect-[16/9]">
                <img [src]="item.imageUrl" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="max-w-2xl mx-auto text-center">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ item.title }}</h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-line">{{ item.text }}</p>
              </div>
            </div>
          }
          @case ('overlay') {
            <div class="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3] md:aspect-[16/9]">
              <img [src]="item.imageUrl" [alt]="item.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              @if (item.scrim !== 'none') {
                <div class="absolute inset-0" [class]="scrimClass(item.scrim)"></div>
              }
              <div dir="ltr" class="absolute inset-0 grid grid-cols-2 grid-rows-2 md:grid-cols-5 md:grid-rows-5 gap-2 p-6 md:p-10">
                <div class="qf-overlay-box flex overflow-hidden" [class]="cellAlignClasses(item)"
                  [style.--qf-gc-m]="gridSpan(item).mobileCol" [style.--qf-gr-m]="gridSpan(item).mobileRow"
                  [style.--qf-gc-d]="gridSpan(item).desktopCol" [style.--qf-gr-d]="gridSpan(item).desktopRow">
                  <div class="max-h-full overflow-hidden" [attr.dir]="textDir()" [style.color]="item.textColor">
                    <h3 class="font-bold mb-3" [style.font-size]="overlayTitleFontSize(item.title, item)">{{ item.title }}</h3>
                    <p class="leading-relaxed whitespace-pre-line opacity-90" [style.font-size]="overlayBodyFontSize(item.text, item)">{{ item.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          }
          @default {
            <div class="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div class="rounded-xl overflow-hidden bg-gray-50 aspect-[4/3]" [class.md:order-2]="item.reverse">
                <img [src]="item.imageUrl" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div [class.md:order-1]="item.reverse">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ item.title }}</h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-line">{{ item.text }}</p>
              </div>
            </div>
          }
        }
      }
    </section>
  `,
  styles: [`
    .qf-overlay-box {
      grid-column: var(--qf-gc-m);
      grid-row: var(--qf-gr-m);
    }
    @media (min-width: 768px) {
      .qf-overlay-box {
        grid-column: var(--qf-gc-d);
        grid-row: var(--qf-gr-d);
      }
    }
  `]
})
export class LandingMediaTextComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  items = computed<MediaTextItem[]>(() => {
    const lang = this.i18n.currentLanguage();
    const rawItems: any[] = Array.isArray(this.content().items) ? this.content().items : [];
    const productImages = this.product()?.images ?? [];
    const t = (field: any) => (lang === 'ar' ? field?.ar : field?.en) || '';

    return rawItems.map((item, index) => {
      const layout: MediaTextLayout = (item.layout === 'below' || item.layout === 'overlay') ? item.layout : 'side';
      const legacyBox = Array.isArray(item.boxes) && item.boxes.length ? item.boxes[0] : null; // brief multi-box period

      return {
        imageUrl: item.imageUrl || productImages[index]?.url || productImages[0]?.url || '',
        title: t(item.title) || t(legacyBox?.title),
        text: t(item.text) || t(legacyBox?.text),
        reverse: !!item.reverse,
        layout,
        scrim: item.scrim === 'light' || item.scrim === 'none' ? item.scrim : 'dark',
        overlayPosition: item.overlayPosition || legacyBox?.anchor || 'bottom-left',
        overlayEndPosition: item.overlayEndPosition || item.overlayPosition || legacyBox?.anchor || 'bottom-left',
        textColor: item.textColor || legacyBox?.textColor || '#ffffff'
      };
    });
  });

  private readonly GRID = 5;
  private readonly MID = 3; // Math.ceil(GRID / 2) — the true-center track

  // Positions predate the 5x5 grid as named corners/edges ("bottom-left", "center", ...);
  // these map exactly onto the 9 landmark cells of the 5x5 grid, so old saved rows keep
  // their exact spot with no migration needed.
  private readonly legacyRow: Record<string, number> = { top: 1, center: 3, bottom: 5 };
  private readonly legacyCol: Record<string, number> = { left: 1, center: 3, right: 5 };

  private splitPosition(position: string): { row: number; col: number } {
    const [a, b] = (position || '').split('-');
    const row = Number(a), col = Number(b);
    if (!isNaN(row) && !isNaN(col)) return { row, col };
    return { row: this.legacyRow[a] ?? this.MID, col: this.legacyCol[b || 'center'] ?? this.MID };
  }

  /** Below `md` only 2 tracks exist per axis: the near half maps to track 1, the far half (including the true center) to track 2. */
  private collapseRowToMobile(row: number): number { return row <= this.MID ? (row < this.MID ? 1 : 2) : 2; }
  private collapseColToMobile(col: number): number { return col <= this.MID ? (col < this.MID ? 1 : 1) : 2; }

  /** CSS grid-column/grid-row values (as "<start-line> / <end-line>") for both breakpoints. */
  gridSpan(item: MediaTextItem): { desktopCol: string; desktopRow: string; mobileCol: string; mobileRow: string } {
    const a = this.splitPosition(item.overlayPosition);
    const b = this.splitPosition(item.overlayEndPosition);

    const rowStart = Math.min(a.row, b.row);
    const rowEnd = Math.max(a.row, b.row);
    const colStart = Math.min(a.col, b.col);
    const colEnd = Math.max(a.col, b.col);

    const rowStartM = Math.min(this.collapseRowToMobile(a.row), this.collapseRowToMobile(b.row));
    const rowEndM = Math.max(this.collapseRowToMobile(a.row), this.collapseRowToMobile(b.row));
    const colStartM = Math.min(this.collapseColToMobile(a.col), this.collapseColToMobile(b.col));
    const colEndM = Math.max(this.collapseColToMobile(a.col), this.collapseColToMobile(b.col));

    return {
      desktopCol: `${colStart} / ${colEnd + 1}`,
      desktopRow: `${rowStart} / ${rowEnd + 1}`,
      mobileCol: `${colStartM} / ${colEndM + 1}`,
      mobileRow: `${rowStartM} / ${rowEndM + 1}`
    };
  }

  private spanIncludesRow(item: MediaTextItem, targetRow: number): boolean {
    const a = this.splitPosition(item.overlayPosition).row;
    const b = this.splitPosition(item.overlayEndPosition).row;
    return targetRow >= Math.min(a, b) && targetRow <= Math.max(a, b);
  }

  private spanIncludesCol(item: MediaTextItem, targetCol: number): boolean {
    const a = this.splitPosition(item.overlayPosition).col;
    const b = this.splitPosition(item.overlayEndPosition).col;
    return targetCol >= Math.min(a, b) && targetCol <= Math.max(a, b);
  }

  /**
   * The merchant is anchoring the box to a spot on the photo (e.g. "away from
   * the product, which sits on the right"), not describing reading order — so
   * "left" must render on the physical left no matter the storefront
   * language. The grid/flex container is forced `dir="ltr"` in the template
   * for exactly this reason; `text-left`/`text-right` (physical) are used
   * here instead of `text-start`/`text-end` (logical) because the innermost
   * text wrapper gets its own `dir="rtl"` for correct Arabic glyph shaping,
   * which would otherwise re-flip a logical start/end value back to the
   * opposite physical side.
   */
  cellAlignClasses(item: MediaTextItem): string {
    const top = this.spanIncludesRow(item, 1);
    const bottom = this.spanIncludesRow(item, this.GRID);
    const vClass = top && !bottom ? 'items-start' : bottom && !top ? 'items-end' : 'items-center';

    const left = this.spanIncludesCol(item, 1);
    const right = this.spanIncludesCol(item, this.GRID);
    const hClass = left && !right ? 'justify-start text-left' : right && !left ? 'justify-end text-right' : 'justify-center text-center';

    return `${vClass} ${hClass}`;
  }

  private colSpanCount(item: MediaTextItem): number {
    const a = this.splitPosition(item.overlayPosition).col;
    const b = this.splitPosition(item.overlayEndPosition).col;
    return Math.abs(a - b) + 1;
  }

  scrimClass(scrim: string): string {
    return scrim === 'light' ? 'bg-white/40' : 'bg-black/40';
  }

  /** Direction for the innermost text node only — glyph shaping/line-wrap for Arabic, independent of the box's fixed physical position. */
  textDir(): 'rtl' | 'ltr' {
    return this.i18n.currentLanguage() === 'ar' ? 'rtl' : 'ltr';
  }

  // ── Auto-shrinking overlay text ──
  // The box's footprint is now the actual selected grid span, so the font
  // ceiling scales with how many columns it spans (wider box -> can hold
  // bigger text), then wrapped in a fluid clamp() so it shrinks further on
  // narrow (mobile) viewports too — no JS measurement, no layout thrash,
  // works before first paint.
  private fluidFontSize(minRem: number, maxRem: number): string {
    if (maxRem <= minRem) return `${maxRem}rem`;
    const minPx = 360, maxPx = 768; // interpolate between small and large phones
    const rootPx = 16;
    const minFontPx = minRem * rootPx;
    const maxFontPx = maxRem * rootPx;
    const slopePxPerPx = (maxFontPx - minFontPx) / (maxPx - minPx);
    const vwCoefficient = slopePxPerPx * 100;
    const interceptRem = (minFontPx - slopePxPerPx * minPx) / rootPx;
    return `clamp(${minRem}rem, ${interceptRem.toFixed(4)}rem + ${vwCoefficient.toFixed(4)}vw, ${maxRem}rem)`;
  }

  /** Scales continuously with how much of the grid's width the span covers (1..5 of 5 columns). */
  private spanFactor(item: MediaTextItem): number {
    const cols = this.colSpanCount(item);
    const fraction = cols / this.GRID;
    return 0.7 + fraction * 0.6; // 1 col -> 0.82, 5 cols (full width) -> 1.3
  }

  overlayTitleFontSize(title: string, item: MediaTextItem): string {
    const factor = this.spanFactor(item);
    const len = title.length;
    const base = len <= 20 ? 2.25 : len <= 40 ? 1.875 : len <= 70 ? 1.5 : len <= 110 ? 1.25 : 1.05;
    const max = Math.max(1.05, base * factor);
    const min = Math.max(1, max * 0.75);
    return this.fluidFontSize(min, max);
  }

  overlayBodyFontSize(text: string, item: MediaTextItem): string {
    const factor = this.spanFactor(item);
    const len = text.length;
    const base = len <= 80 ? 1.125 : len <= 160 ? 1.0625 : len <= 260 ? 1 : 0.9375;
    const max = Math.max(0.9, base * factor);
    const min = Math.max(0.85, max * 0.8);
    return this.fluidFontSize(min, max);
  }
}
