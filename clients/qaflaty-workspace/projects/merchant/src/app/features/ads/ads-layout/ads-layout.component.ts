import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-ads-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive, IconComponent],
  templateUrl: './ads-layout.component.html',
  styleUrl: './ads-layout.component.scss'
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
