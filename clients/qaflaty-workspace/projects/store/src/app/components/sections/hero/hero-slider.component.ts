import { Component, input, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative h-[50vh] min-h-[350px] overflow-hidden">
      @for (slide of slides; track $index) {
        <div
          class="absolute inset-0 transition-opacity duration-700"
          [class.opacity-100]="currentSlide() === $index"
          [class.opacity-0]="currentSlide() !== $index"
          [style.background-color]="slide.bgColor">
          <div class="flex items-center justify-center h-full">
            <div class="text-center px-4">
              <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">{{ slide.title }}</h2>
              <p class="text-white/80 text-lg mb-6">{{ slide.subtitle }}</p>
              <a routerLink="/products" class="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Shop Now
              </a>
            </div>
          </div>
        </div>
      }
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        @for (slide of slides; track $index) {
          <button
            (click)="currentSlide.set($index)"
            class="w-3 h-3 rounded-full transition-colors"
            [class.bg-white]="currentSlide() === $index"
            [class.bg-white/50]="currentSlide() !== $index">
          </button>
        }
      </div>
    </div>
  `
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  config = input.required<SectionConfigurationDto>();
  currentSlide = signal(0);
  private intervalId: any;

  slides = [
    { title: 'Welcome', subtitle: 'Discover our collection', bgColor: '#1f2937' },
    { title: 'New Arrivals', subtitle: 'Check out the latest products', bgColor: '#374151' },
    { title: 'Special Offers', subtitle: 'Limited time deals', bgColor: '#111827' }
  ];

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentSlide.update(i => (i + 1) % this.slides.length);
    }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
