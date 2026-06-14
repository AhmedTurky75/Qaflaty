import { Routes } from '@angular/router';

export const STORE_BUILDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/builder-hub.component').then(m => m.BuilderHubComponent)
  },
  {
    path: 'general',
    loadComponent: () => import('./pages/general-settings.component').then(m => m.GeneralSettingsComponent)
  },
  {
    path: 'layout',
    loadComponent: () => import('./pages/layout-design.component').then(m => m.LayoutDesignComponent)
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./pages/payment-methods.component').then(m => m.PaymentMethodsComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-settings.component').then(m => m.SearchSettingsComponent)
  },
  {
    path: 'communication',
    loadComponent: () => import('./pages/communication.component').then(m => m.CommunicationComponent)
  },
  {
    path: 'social-links',
    loadComponent: () => import('./pages/social-links.component').then(m => m.SocialLinksComponent)
  },
  {
    path: 'pages',
    loadComponent: () => import('./pages/pages-manager.component').then(m => m.PagesManagerComponent)
  },
  {
    path: 'pages/:pageId',
    loadComponent: () => import('./pages/page-sections.component').then(m => m.PageSectionsComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq.component').then(m => m.FaqPageComponent)
  },
  {
    path: 'delivery-zones',
    loadComponent: () => import('./pages/delivery-zones.component').then(m => m.DeliveryZonesPageComponent)
  },
  {
    path: 'product-properties',
    loadComponent: () => import('./pages/product-properties.component').then(m => m.ProductPropertiesPageComponent)
  }
];
