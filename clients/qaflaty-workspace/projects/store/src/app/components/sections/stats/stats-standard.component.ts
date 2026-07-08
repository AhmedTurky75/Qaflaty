import { Component, input, signal, computed, inject, ElementRef, effect, OnDestroy } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

interface StatItem {
  value: number;
  suffix: string;
  prefix: string;
  label: string;
}

/**
 * Stats / counters strip. Content model:
 *   { title:{en,ar}, items:[{ value, prefix, suffix, label:{en,ar} }] }
 * Numbers count up once the section scrolls into view (social proof).
 */
@Component({
  selector: 'app-stats-standard',
  standalone: true,
  template: `
    <div class="py-12 px-4">
      @if (title()) {
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">{{ title() }}</h2>
      }
      <div class="grid gap-8 grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto text-center">
        @for (stat of items(); track $index; let i = $index) {
          <div>
            <div class="text-3xl md:text-4xl font-extrabold text-[var(--primary-color)] tabular-nums">
              {{ stat.prefix }}{{ display()[i] }}{{ stat.suffix }}
            </div>
            <div class="mt-2 text-sm text-gray-500">{{ stat.label }}</div>
          </div>
        }
      </div>
    </div>
  `
})
export class StatsStandardComponent implements OnDestroy {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);
  private host = inject(ElementRef<HTMLElement>);

  display = signal<number[]>([]);
  private observer: IntersectionObserver | null = null;
  private rafId: number | null = null;

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || '';
  });

  items = computed<StatItem[]>(() => {
    const lang = this.i18n.currentLanguage();
    const raw: any[] = Array.isArray(this.content().items) ? this.content().items : [];
    return raw.map(s => ({
      value: Number(s.value) || 0,
      prefix: s.prefix || '',
      suffix: s.suffix || '',
      label: (lang === 'ar' ? s.label?.ar : s.label?.en) || ''
    }));
  });

  constructor() {
    // Reset display to zeros whenever the item set changes, then animate on view.
    effect(() => {
      const count = this.items().length;
      this.display.set(new Array(count).fill(0));
      this.setupObserver();
    });
  }

  private setupObserver(): void {
    this.observer?.disconnect();
    const el = this.host.nativeElement;
    if (typeof IntersectionObserver === 'undefined') { this.animate(); return; }
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this.animate();
        this.observer?.disconnect();
        this.observer = null;
      }
    }, { threshold: 0.2 });
    this.observer.observe(el);
  }

  private animate(): void {
    const targets = this.items().map(s => s.value);
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.display.set(targets.map(v => Math.round(v * eased)));
      if (t < 1) this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
