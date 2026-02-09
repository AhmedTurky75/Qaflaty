import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductListComponent } from './pages/products/product-list.component';
import { ProductDetailComponent } from './pages/products/product-detail.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderConfirmationComponent } from './pages/orders/order-confirmation.component';
import { TrackOrderComponent } from './pages/orders/track-order.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:slug', component: ProductDetailComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-confirmation/:orderNumber', component: OrderConfirmationComponent },
  { path: 'track-order', component: TrackOrderComponent },
  { path: '**', redirectTo: '' }
];
