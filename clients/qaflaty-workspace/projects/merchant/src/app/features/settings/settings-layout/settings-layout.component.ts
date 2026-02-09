import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './settings-layout.component.html'
})
export class SettingsLayoutComponent {
  settingsNavigation = [
    { name: 'Profile', path: '/settings/profile', icon: 'user' },
    { name: 'Password', path: '/settings/password', icon: 'lock' },
    { name: 'Stores', path: '/settings/stores', icon: 'store' },
    { name: 'Notifications', path: '/settings/notifications', icon: 'bell' }
  ];
}
