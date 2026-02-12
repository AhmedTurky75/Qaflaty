import { Routes } from '@angular/router';
import { featurePageGuard } from './guards/feature-page.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./pages/products/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    canActivate: [featurePageGuard('Cart')],
    loadComponent: () => import('./pages/cart/cart-page.component').then(m => m.CartPageComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'order-confirmation/:orderNumber',
    loadComponent: () => import('./pages/orders/order-confirmation.component').then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'track-order',
    loadComponent: () => import('./pages/orders/track-order.component').then(m => m.TrackOrderComponent)
  },
  {
    path: 'about',
    canActivate: [featurePageGuard('About')],
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    canActivate: [featurePageGuard('Contact')],
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'faq',
    canActivate: [featurePageGuard('FAQ')],
    loadComponent: () => import('./pages/faq/faq.component').then(m => m.FaqComponent)
  },
  {
    path: 'terms',
    canActivate: [featurePageGuard('Terms')],
    loadComponent: () => import('./pages/legal/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'privacy',
    canActivate: [featurePageGuard('Privacy')],
    loadComponent: () => import('./pages/legal/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'shipping-returns',
    canActivate: [featurePageGuard('ShippingReturns')],
    loadComponent: () => import('./pages/legal/shipping-returns.component').then(m => m.ShippingReturnsComponent)
  },
  {
    path: 'pages/:slug',
    loadComponent: () => import('./pages/custom/custom-page.component').then(m => m.CustomPageComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'offline',
    loadComponent: () => import('./pages/store-offline/store-offline.component').then(m => m.StoreOfflineComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
