import { Component, input, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

interface Slide {
  title: string;
  subtitle: string;
  imageUrl?: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { title: 'Welcome', subtitle: 'Discover our collection', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#1f2937' },
  { title: 'New Arrivals', subtitle: 'Check out the latest products', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#374151' },
  { title: 'Special Offers', subtitle: 'Limited time deals', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#111827' }
];

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative h-[50vh] min-h-[350px] overflow-hidden">
      @for (slide of slides(); track $index) {
        <div
          class="absolute inset-0 transition-opacity duration-700 flex items-center justify-center"
          [class.opacity-100]="currentSlide() === $index"
          [class.opacity-0]="currentSlide() !== $index"
          [style.background-image]="slide.imageUrl ? 'url(' + slide.imageUrl + ')' : null"
          [style.background-size]="slide.imageUrl ? 'cover' : null"
          [style.background-position]="slide.imageUrl ? 'center' : null"
          [style.background-color]="!slide.imageUrl ? slide.bgColor : null"
        >
          @if (slide.imageUrl) {
            <div class="absolute inset-0 bg-black/50"></div>
          }
          <div class="relative z-10 text-center px-4">
            <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">{{ slide.title }}</h2>
            <p class="text-white/80 text-lg mb-6">{{ slide.subtitle }}</p>
            <a [routerLink]="slide.buttonLink" class="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {{ slide.buttonText }}
            </a>
          </div>
        </div>
      }
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        @for (slide of slides(); track $index) {
          <button
            (click)="currentSlide.set($index)"
            class="w-3 h-3 rounded-full transition-colors"
            [class.bg-white]="currentSlide() === $index"
            [class.bg-white/50]="currentSlide() !== $index"
          ></button>
        }
      </div>
    </div>
  `
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  config = input.required<SectionConfigurationDto>();
  currentSlide = signal(0);
  private intervalId: any;
  private i18n = inject(I18nService);

  slides = computed<Slide[]>(() => {
    try {
      const content = this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
      if (Array.isArray(content.slides) && content.slides.length > 0) {
        const lang = this.i18n.currentLanguage();
        return content.slides.map((s: any) => ({
          title: (lang === 'ar' ? s.title?.ar : s.title?.en) || s.title || '',
          subtitle: (lang === 'ar' ? s.subtitle?.ar : s.subtitle?.en) || s.subtitle || '',
          imageUrl: s.imageUrl,
          buttonText: s.buttonText || 'Shop Now',
          buttonLink: s.buttonLink || '/products',
          bgColor: s.bgColor || '#1f2937'
        }));
      }
    } catch { /* ignore */ }
    return DEFAULT_SLIDES;
  });

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentSlide.update(i => (i + 1) % this.slides().length);
    }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
