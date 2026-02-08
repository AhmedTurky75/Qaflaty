import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-main/settings-main.component').then(m => m.SettingsMainComponent)
  }
];
