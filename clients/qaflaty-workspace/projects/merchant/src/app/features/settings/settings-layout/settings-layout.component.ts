import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive, TranslocoPipe, IconComponent],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.scss',
})
export class SettingsLayoutComponent {
  settingsNavigation = [
    { labelKey: 'settings.profile', path: '/settings/profile', icon: 'user' },
    { labelKey: 'settings.appearance', path: '/settings/appearance', icon: 'palette' },
    { labelKey: 'settings.password', path: '/settings/password', icon: 'lock' },
    { labelKey: 'settings.stores', path: '/settings/stores', icon: 'stores' },
    { labelKey: 'settings.notifications', path: '/settings/notifications', icon: 'bell' },
  ];
}
