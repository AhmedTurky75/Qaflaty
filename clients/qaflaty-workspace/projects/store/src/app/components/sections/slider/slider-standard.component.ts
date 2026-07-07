import { Component, input, signal, computed, effect, inject, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

interface Slide {
  imageUrl: string;
  link: string;
  alt: string;
}

/**
 * Image slider / gallery. Content model:
 *   { slides: [{ imageUrl, link, alt }], autoplay, interval }
 * Slides are plain images (optionally linked); autoplay + interval are optional.
 */
@Component({
  selector: 'app-slider-standard',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (slides().length) {
      <div class="relative w-full overflow-hidden">
        @for (slide of slides(); track $index) {
          <div
            class="absolute inset-0 transition-opacity duration-700"
            [class.opacity-100]="current() === $index"
            [class.opacity-0]="current() !== $index"
            [class.pointer-events-none]="current() !== $index"
          >
            @if (slide.link) {
              <a [routerLink]="slide.link" class="block w-full h-full">
                <img [src]="slide.imageUrl" [alt]="slide.alt" class="w-full h-full object-cover" />
              </a>
            } @else {
              <img [src]="slide.imageUrl" [alt]="slide.alt" class="w-full h-full object-cover" />
            }
          </div>
        }
        <!-- Spacer keeps the section height equal to the first slide's natural ratio -->
        <img [src]="slides()[0].imageUrl" [alt]="slides()[0].alt" class="w-full h-auto invisible" />

        @if (slides().length > 1) {
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            @for (slide of slides(); track $index) {
              <button type="button" (click)="current.set($index)"
                class="w-2.5 h-2.5 rounded-full transition-colors"
                [class.bg-white]="current() === $index"
                [class.bg-white/50]="current() !== $index"
                [attr.aria-label]="'Go to slide ' + ($index + 1)"
              ></button>
            }
          </div>
        }
      </div>
    }
  `
})
export class SliderStandardComponent implements OnDestroy {
  config = input.required<SectionConfigurationDto>();
  current = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  slides = computed<Slide[]>(() => {
    const raw: any[] = Array.isArray(this.content().slides) ? this.content().slides : [];
    return raw
      .filter(s => s?.imageUrl)
      .map(s => ({ imageUrl: s.imageUrl, link: s.link || '', alt: s.alt || '' }));
  });

  autoplay = computed(() => this.content().autoplay !== false);
  interval = computed(() => Math.max(1500, Number(this.content().interval) || 5000));

  constructor() {
    // (Re)arm autoplay whenever the slides / settings change.
    effect(() => {
      const count = this.slides().length;
      const play = this.autoplay();
      const ms = this.interval();
      this.stop();
      if (play && count > 1) {
        this.intervalId = setInterval(() => {
          this.current.update(i => (i + 1) % count);
        }, ms);
      }
    });
  }

  private stop(): void {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  ngOnDestroy(): void { this.stop(); }
}
