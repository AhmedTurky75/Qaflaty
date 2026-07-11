import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-ads-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './ads-layout.component.html'
})
export class AdsLayoutComponent {
  navigation = [
    { name: 'Dashboard', path: '/ads/dashboard', icon: '📊' },
    { name: 'Integrations', path: '/ads/integrations', icon: '🔌' },
    { name: 'Diagnostics', path: '/ads/diagnostics', icon: '🩺' },
    { name: 'Event Timeline', path: '/ads/timeline', icon: '🧭' },
    { name: 'Test Center', path: '/ads/test-center', icon: '🧪' },
    { name: 'Logs', path: '/ads/logs', icon: '📜' },
    { name: 'Monitoring', path: '/ads/monitoring', icon: '📈' }
  ];
}
