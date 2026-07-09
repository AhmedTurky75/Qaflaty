import { Component, input, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Continuously scrolling "running text" bar. Content model:
 *   { messages: [{ text: {en,ar} }], speed: 'slow'|'normal'|'fast',
 *     separator, bg, textColor }
 *
 * Scrolls forever (CSS animation, no JS ticking). Direction follows the store
 * language: leftward for LTR, rightward for RTL. Pauses on hover and respects
 * prefers-reduced-motion.
 */
@Component({
  selector: 'app-marquee-bar',
  standalone: true,
  template: `
    @if (messages().length) {
      <div class="qf-marquee w-full overflow-hidden" [style.background-color]="bg()" [style.color]="textColor()">
        <div class="qf-track" [class.qf-rtl]="isRtl()" [style.animation-duration]="duration()">
          <!-- Two copies for a seamless loop (translateX -50% = exactly one copy) -->
          @for (copy of [0, 1]; track copy) {
            @for (m of messages(); track $index) {
              <span class="qf-item">{{ m }}</span>
              <span class="qf-sep" aria-hidden="true">{{ separator() }}</span>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .qf-track {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      will-change: transform;
      animation-name: qf-marquee;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    .qf-track.qf-rtl { animation-direction: reverse; }
    .qf-marquee:hover .qf-track { animation-play-state: paused; }
    .qf-item { padding: .5rem 0; font-size: .875rem; font-weight: 500; }
    .qf-sep { padding: 0 1.25rem; opacity: .55; }
    @keyframes qf-marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .qf-track { animation: none; }
    }
  `]
})
export class MarqueeBarComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  isRtl = computed(() => this.i18n.currentLanguage() === 'ar');

  messages = computed<string[]>(() => {
    const lang = this.i18n.currentLanguage();
    const raw: any[] = Array.isArray(this.content().messages) ? this.content().messages : [];
    return raw
      .map(m => (lang === 'ar' ? m.text?.ar : m.text?.en) || '')
      .filter((t: string) => t.trim().length > 0);
  });

  separator = computed(() => this.content().separator || '•');
  bg = computed(() => this.content().bg || '#111827');
  textColor = computed(() => this.content().textColor || '#ffffff');

  private readonly speeds: Record<string, string> = {
    slow: '32s',
    normal: '20s',
    fast: '12s'
  };
  duration = computed(() => this.speeds[this.content().speed as string] || this.speeds['normal']);
}
