import { Routes } from '@angular/router';

export const ADS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./ads-layout/ads-layout.component').then(m => m.AdsLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/ads-dashboard.component').then(m => m.AdsDashboardComponent)
      },
      {
        path: 'integrations',
        loadComponent: () => import('./integrations/ads-integrations.component').then(m => m.AdsIntegrationsComponent)
      },
      {
        path: 'diagnostics',
        loadComponent: () => import('./diagnostics/ads-diagnostics.component').then(m => m.AdsDiagnosticsComponent)
      },
      {
        path: 'timeline',
        loadComponent: () => import('./timeline/ads-event-timeline.component').then(m => m.AdsEventTimelineComponent)
      },
      {
        path: 'test-center',
        loadComponent: () => import('./test-center/ads-test-center.component').then(m => m.AdsTestCenterComponent)
      },
      {
        path: 'logs',
        loadComponent: () => import('./logs/ads-logs.component').then(m => m.AdsLogsComponent)
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./monitoring/ads-monitoring.component').then(m => m.AdsMonitoringComponent)
      }
    ]
  }
];
