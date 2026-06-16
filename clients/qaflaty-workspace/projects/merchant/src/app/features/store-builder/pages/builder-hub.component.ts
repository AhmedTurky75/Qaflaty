import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface HubCard {
  icon: string;
  title: string;
  description: string;
  route: string;
}

interface HubSection {
  title: string;
  cards: HubCard[];
}

@Component({
  selector: 'app-builder-hub',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 class="text-2xl font-bold text-gray-900">Store Builder</h1>
          <p class="mt-1 text-sm text-gray-500">Configure your storefront appearance and functionality</p>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        @for (section of sections; track section.title) {
          <div>
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{{ section.title }}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (card of section.cards; track card.route) {
                <a
                  [routerLink]="card.route"
                  class="flex items-center gap-4 bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer no-underline"
                >
                  <span class="text-2xl flex-shrink-0">{{ card.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900">{{ card.title }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ card.description }}</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class BuilderHubComponent {
  sections: HubSection[] = [
    {
      title: 'Store Settings',
      cards: [
        { icon: '⚙️', title: 'General Settings', description: 'Page toggles, feature flags, customer auth, language', route: 'general' },
        { icon: '🎨', title: 'Layout & Design', description: 'Header, footer, product card and grid variants', route: 'layout' },
        { icon: '📱', title: 'Social Links', description: 'Facebook, Instagram, Twitter, TikTok and more', route: 'social-links' },
      ]
    },
    {
      title: 'Sales & Fulfillment',
      cards: [
        { icon: '💳', title: 'Payment Methods', description: 'Enable payment methods and configure fees', route: 'payment-methods' },
        { icon: '🗺️', title: 'Delivery Zones', description: 'Specify which areas you deliver to', route: 'delivery-zones' },
      ]
    },
    {
      title: 'Content & Support',
      cards: [
        { icon: '📄', title: 'Pages', description: 'Manage store pages and their sections', route: 'pages' },
        { icon: '❓', title: 'FAQ', description: 'Answer common customer questions', route: 'faq' },
        { icon: '💬', title: 'Communication', description: 'WhatsApp, live chat and AI chatbot settings', route: 'communication' },
        { icon: '🤖', title: 'AI Assistant', description: 'Configure the AI shopping assistant and refresh its knowledge', route: 'ai-assistant' },
      ]
    },
    {
      title: 'Advanced',
      cards: [
        { icon: '🔍', title: 'Search & Filters', description: 'Configure search and filter options', route: 'search' },
        { icon: '🏷️', title: 'Product Properties', description: 'Define custom product attributes', route: 'product-properties' },
      ]
    }
  ];
}
