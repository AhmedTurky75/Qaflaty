import { Routes } from '@angular/router';

export const STORE_BUILDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./builder-layout.component').then(m => m.BuilderLayoutComponent)
  }
];
