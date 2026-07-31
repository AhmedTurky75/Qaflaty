import { Component, input, signal, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Before / after image comparison with a draggable divider. Content model:
 *   { beforeUrl, afterUrl, beforeLabel:{en,ar}, afterLabel:{en,ar} }
 */
@Component({
  selector: 'app-before-after-standard',
  standalone: true,
  template: `
    @if (beforeUrl() && afterUrl()) {
      <div class="py-10 px-4">
        <div
          class="relative max-w-3xl mx-auto select-none overflow-hidden rounded-2xl border border-gray-200 shadow-sm cursor-ew-resize"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="dragging.set(false)"
          (pointerleave)="dragging.set(false)"
        >
          <!-- After (full, underneath) -->
          <img [src]="afterUrl()" [alt]="afterLabel()" class="block w-full h-auto pointer-events-none" draggable="false" />
          @if (afterLabel()) {
            <span class="absolute bottom-3 end-3 text-xs font-medium text-white bg-black/50 rounded px-2 py-1">{{ afterLabel() }}</span>
          }

          <!-- Before (same size as After, clipped to the divider position) -->
          <div class="absolute inset-0 pointer-events-none" [style.clip-path]="clipPath()">
            <img [src]="beforeUrl()" [alt]="beforeLabel()" class="block w-full h-full object-cover" draggable="false" />
            @if (beforeLabel()) {
              <span class="absolute bottom-3 start-3 text-xs font-medium text-white bg-black/50 rounded px-2 py-1">{{ beforeLabel() }}</span>
            }
          </div>

          <!-- Divider handle -->
          <div class="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)] pointer-events-none" [style.left.%]="position()">
            <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l-4 5 4 5M16 7l4 5-4 5"/></svg>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class BeforeAfterStandardComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  position = signal(50);
  dragging = signal(false);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  private t(field: any): string {
    return (this.i18n.currentLanguage() === 'ar' ? field?.ar : field?.en) || '';
  }

  clipPath = computed(() => `inset(0 ${100 - this.position()}% 0 0)`);

  beforeUrl = computed(() => this.content().beforeUrl || '');
  afterUrl = computed(() => this.content().afterUrl || '');
  beforeLabel = computed(() => this.t(this.content().beforeLabel) || 'Before');
  afterLabel = computed(() => this.t(this.content().afterLabel) || 'After');

  onPointerDown(e: PointerEvent): void {
    this.dragging.set(true);
    this.updateFromEvent(e);
  }

  onPointerMove(e: PointerEvent): void {
    if (this.dragging()) this.updateFromEvent(e);
  }

  private updateFromEvent(e: PointerEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!rect.width) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    this.position.set(Math.min(100, Math.max(0, Math.round(pct))));
  }
}
