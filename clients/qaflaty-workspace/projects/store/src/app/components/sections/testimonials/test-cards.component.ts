import { Component, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-test-cards',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
      <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">What Our Customers Say</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (testimonial of testimonials; track testimonial.name) {
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <div class="flex gap-1 mb-3">
              @for (star of [1,2,3,4,5]; track star) {
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              }
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ testimonial.text }}</p>
            <p class="font-medium text-gray-900 text-sm">{{ testimonial.name }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class TestCardsComponent {
  config = input.required<SectionConfigurationDto>();
  testimonials = [
    { name: 'Ahmed', text: 'Great quality products and fast delivery. Highly recommended!' },
    { name: 'Sarah', text: 'Love the variety of products. Customer service is excellent.' },
    { name: 'Mohammed', text: 'Best online store I have ever shopped from. Will come back again!' }
  ];
}
