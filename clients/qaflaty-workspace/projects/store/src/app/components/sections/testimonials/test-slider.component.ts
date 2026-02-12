import { Component, input, inject, OnInit, OnDestroy } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-slider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div class="max-w-5xl mx-auto">
        <!-- Section Header -->
        @if (content?.title) {
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {{ i18n.getText(content.title) }}
            </h2>
            @if (content.subtitle) {
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                {{ i18n.getText(content.subtitle) }}
              </p>
            }
          </div>
        }

        <!-- Testimonial Slider -->
        @if (content?.testimonials && content.testimonials.length > 0) {
          <div class="relative">
            <!-- Main Testimonial Card -->
            <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 min-h-[350px] flex flex-col justify-between">
              @if (currentTestimonial) {
                <!-- Quote Icon -->
                <div class="mb-6">
                  <svg class="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                <!-- Testimonial Content -->
                <div class="flex-grow mb-8">
                  <p class="text-xl md:text-2xl text-gray-700 leading-relaxed italic mb-6">
                    {{ i18n.getText(currentTestimonial.content) }}
                  </p>
                </div>

                <!-- Customer Info -->
                <div class="flex items-center gap-4">
                  @if (currentTestimonial.avatar) {
                    <img
                      [src]="currentTestimonial.avatar.url"
                      [alt]="i18n.getText(currentTestimonial.name)"
                      class="w-16 h-16 rounded-full object-cover border-4 border-blue-100"
                    />
                  } @else {
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {{ getInitials(currentTestimonial.name) }}
                    </div>
                  }

                  <div>
                    <h4 class="text-lg font-bold text-gray-900">
                      {{ i18n.getText(currentTestimonial.name) }}
                    </h4>
                    @if (currentTestimonial.title) {
                      <p class="text-gray-600">
                        {{ i18n.getText(currentTestimonial.title) }}
                      </p>
                    }

                    <!-- Star Rating -->
                    @if (currentTestimonial.rating) {
                      <div class="flex items-center gap-1 mt-1">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg
                            [class.text-yellow-400]="star <= currentTestimonial.rating"
                            [class.text-gray-300]="star > currentTestimonial.rating"
                            class="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Navigation Arrows -->
            @if (content.testimonials.length > 1) {
              <div class="flex items-center justify-center gap-4 mt-8">
                <button
                  (click)="previousTestimonial()"
                  class="p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors duration-200"
                  type="button"
                  aria-label="Previous testimonial"
                >
                  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <!-- Dot Indicators -->
                <div class="flex gap-2">
                  @for (testimonial of content.testimonials; track $index) {
                    <button
                      (click)="goToTestimonial($index)"
                      [class.bg-blue-600]="currentIndex === $index"
                      [class.bg-gray-300]="currentIndex !== $index"
                      [class.w-8]="currentIndex === $index"
                      class="h-2 w-2 rounded-full transition-all duration-300"
                      type="button"
                      [attr.aria-label]="'Go to testimonial ' + ($index + 1)"
                    ></button>
                  }
                </div>

                <button
                  (click)="nextTestimonial()"
                  class="p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors duration-200"
                  type="button"
                  aria-label="Next testimonial"
                >
                  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-gray-600">
              {{ i18n.currentLanguage() === 'ar' ? 'لا توجد شهادات' : 'No testimonials found' }}
            </p>
          </div>
        }
      </div>
    </section>
  `
})
export class TestSliderComponent implements OnInit, OnDestroy {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);
  currentIndex = 0;
  private autoRotateInterval?: any;

  get content(): any {
    try {
      return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
    } catch {
      return {};
    }
  }

  get settings(): any {
    try {
      return this.config().settingsJson ? JSON.parse(this.config().settingsJson!) : {};
    } catch {
      return {};
    }
  }

  get currentTestimonial(): any {
    return this.content?.testimonials?.[this.currentIndex];
  }

  ngOnInit(): void {
    // Start auto-rotation if enabled in settings
    if (this.settings?.autoRotate !== false && this.content?.testimonials?.length > 1) {
      const interval = this.settings?.rotateInterval || 5000;
      this.autoRotateInterval = setInterval(() => {
        this.nextTestimonial();
      }, interval);
    }
  }

  ngOnDestroy(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
  }

  nextTestimonial(): void {
    const testimonials = this.content?.testimonials || [];
    if (testimonials.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % testimonials.length;
    }
  }

  previousTestimonial(): void {
    const testimonials = this.content?.testimonials || [];
    if (testimonials.length > 0) {
      this.currentIndex = this.currentIndex === 0 ? testimonials.length - 1 : this.currentIndex - 1;
    }
  }

  goToTestimonial(index: number): void {
    this.currentIndex = index;

    // Reset auto-rotation timer when manually navigating
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      const interval = this.settings?.rotateInterval || 5000;
      this.autoRotateInterval = setInterval(() => {
        this.nextTestimonial();
      }, interval);
    }
  }

  getInitials(name: any): string {
    const nameText = this.i18n.getText(name);
    return nameText
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
