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
  templateUrl: './builder-hub.component.html',
  styleUrl: './builder-hub.component.scss'
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
