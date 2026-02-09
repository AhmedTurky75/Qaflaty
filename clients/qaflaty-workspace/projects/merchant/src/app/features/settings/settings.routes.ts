import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-layout/settings-layout.component').then(m => m.SettingsLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent)
      },
      {
        path: 'password',
        loadComponent: () => import('./password-settings/password-settings.component').then(m => m.PasswordSettingsComponent)
      },
      {
        path: 'stores',
        loadComponent: () => import('./store-settings/store-settings.component').then(m => m.StoreSettingsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notification-preferences/notification-preferences.component').then(m => m.NotificationPreferencesComponent)
      }
    ]
  }
];
