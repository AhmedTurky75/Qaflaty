import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';
import { Product } from '../../models/product.model';

type MediaTextLayout = 'side' | 'below' | 'overlay';
type AnchorPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface MediaTextItem {
  imageUrl: string;
  title: string;
  text: string;
  reverse?: boolean;
  layout: MediaTextLayout;
  scrim: 'none' | 'dark' | 'light';
  overlayPosition: AnchorPosition;
  textColor: string;
  /** Caps the text column to roughly a third of the image width so long copy wraps instead of stretching wide. */
  wrapText: boolean;
}

/**
 * Alternating image/text rows. Each row picks a layout:
 *  - side: image and text side by side (optionally reversed)
 *  - below: image on top, text stacked underneath, full width
 *  - overlay: text laid over the image, anchored to one of 9 fixed grid
 *    positions (never free-dragged) so it stays legible at every breakpoint —
 *    object-fit: cover crops the image differently per viewport width, so
 *    pixel coordinates chosen in the editor wouldn't line up on other screens.
 *
 *    The grid is responsive: below `md` only the 4 corners are used (center
 *    rows collapse to bottom, center columns collapse to start) so the box
 *    has more breathing room on a small screen; `md` and up uses the full
 *    9-position grid. Done with paired literal Tailwind classes (unprefixed
 *    for the mobile/collapsed anchor, `md:`-prefixed for the true desktop
 *    anchor) — pure CSS, no JS resize listeners.
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
              <div class="absolute inset-0 flex p-6 md:p-10 overflow-hidden" [class]="anchorClasses(item.overlayPosition)">
                <div class="max-h-full overflow-hidden" [class]="wrapWidthClass(item.wrapText) + ' ' + textAlignClass(item.overlayPosition)" [style.color]="item.textColor">
                  <h3 class="font-bold mb-3" [style.font-size]="overlayTitleFontSize(item.title, item.wrapText)">{{ item.title }}</h3>
                  <p class="leading-relaxed whitespace-pre-line opacity-90" [style.font-size]="overlayBodyFontSize(item.text, item.wrapText)">{{ item.text }}</p>
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
  `
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
      // Brief multi-box period: fall back to the first saved box so nothing entered then is lost.
      const legacyBox = Array.isArray(item.boxes) && item.boxes.length ? item.boxes[0] : null;

      return {
        imageUrl: item.imageUrl || productImages[index]?.url || productImages[0]?.url || '',
        title: t(item.title) || t(legacyBox?.title),
        text: t(item.text) || t(legacyBox?.text),
        reverse: !!item.reverse,
        layout,
        scrim: item.scrim === 'light' || item.scrim === 'none' ? item.scrim : 'dark',
        overlayPosition: item.overlayPosition || legacyBox?.anchor || 'bottom-left',
        textColor: item.textColor || legacyBox?.textColor || '#ffffff',
        wrapText: typeof item.wrapText === 'boolean' ? item.wrapText : legacyBox?.maxWidth === 'narrow'
      };
    });
  });

  // Unprefixed = collapsed mobile anchor (4 corners only); md: = true desktop anchor (9-grid).
  private readonly vAnchor: Record<string, string> = {
    top: 'items-start', center: 'items-center', bottom: 'items-end'
  };
  private readonly hAnchor: Record<string, string> = {
    left: 'justify-start', center: 'justify-center', right: 'justify-end'
  };
  private readonly hAlign: Record<string, string> = {
    left: 'text-start', center: 'text-center', right: 'text-end'
  };
  private readonly vAnchorMd: Record<string, string> = {
    top: 'md:items-start', center: 'md:items-center', bottom: 'md:items-end'
  };
  private readonly hAnchorMd: Record<string, string> = {
    left: 'md:justify-start', center: 'md:justify-center', right: 'md:justify-end'
  };
  private readonly hAlignMd: Record<string, string> = {
    left: 'md:text-start', center: 'md:text-center', right: 'md:text-end'
  };

  private splitPosition(position: AnchorPosition): { v: string; h: string } {
    const [v, h] = position.split('-');
    return { v, h: h || 'center' };
  }

  /** Below `md`, only the 4 corners are used: center rows collapse to bottom, center columns to left. */
  private collapseToCorner(v: string, h: string): { v: string; h: string } {
    return { v: v === 'center' ? 'bottom' : v, h: h === 'center' ? 'left' : h };
  }

  anchorClasses(position: AnchorPosition): string {
    const { v, h } = this.splitPosition(position);
    const corner = this.collapseToCorner(v, h);
    return [
      this.vAnchor[corner.v] || 'items-end',
      this.hAnchor[corner.h] || 'justify-start',
      this.vAnchorMd[v] || 'md:items-end',
      this.hAnchorMd[h] || 'md:justify-start'
    ].join(' ');
  }

  textAlignClass(position: AnchorPosition): string {
    const { h } = this.splitPosition(position);
    const corner = this.collapseToCorner('top', h); // only h matters here
    return `${this.hAlign[corner.h] || 'text-start'} ${this.hAlignMd[h] || 'md:text-start'}`;
  }

  wrapWidthClass(wrapText: boolean): string {
    return wrapText ? 'max-w-[33%]' : 'max-w-[65%]';
  }

  scrimClass(scrim: string): string {
    return scrim === 'light' ? 'bg-white/40' : 'bg-black/40';
  }

  // ── Auto-shrinking overlay text ──
  // The overlay box has a fixed aspect ratio, so unbounded text can exceed it.
  // Font size is picked from the text length (longer copy → smaller ceiling)
  // and whether "wrap text" narrows the column, then wrapped in a fluid
  // clamp() so it shrinks further on narrow (mobile) viewports too — no JS
  // measurement, no layout thrash, works before first paint.
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

  overlayTitleFontSize(title: string, wrapText: boolean): string {
    const factor = wrapText ? 0.82 : 1.1;
    const len = title.length;
    const base = len <= 20 ? 2.25 : len <= 40 ? 1.875 : len <= 70 ? 1.5 : len <= 110 ? 1.25 : 1.05;
    const max = Math.max(1.05, base * factor);
    const min = Math.max(1, max * 0.75);
    return this.fluidFontSize(min, max);
  }

  overlayBodyFontSize(text: string, wrapText: boolean): string {
    const factor = wrapText ? 0.82 : 1.1;
    const len = text.length;
    const base = len <= 80 ? 1.125 : len <= 160 ? 1.0625 : len <= 260 ? 1 : 0.9375;
    const max = Math.max(0.9, base * factor);
    const min = Math.max(0.85, max * 0.8);
    return this.fluidFontSize(min, max);
  }
}
