import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-news-inline',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-[var(--primary-color)] py-12 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-white mb-2">Stay Updated</h2>
        <p class="text-white/80 mb-6">Subscribe to get the latest deals and offers</p>
        <div class="flex gap-2 max-w-md mx-auto">
          <input type="email" [(ngModel)]="email" placeholder="Enter your email"
            class="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white" />
          <button (click)="subscribe()" class="px-6 py-3 bg-white text-[var(--primary-color)] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  `
})
export class NewsInlineComponent {
  config = input.required<SectionConfigurationDto>();
  email = '';
  subscribed = signal(false);

  subscribe() {
    if (this.email) {
      this.subscribed.set(true);
      this.email = '';
    }
  }
}
