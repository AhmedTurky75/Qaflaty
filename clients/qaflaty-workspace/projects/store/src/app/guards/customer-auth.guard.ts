import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

export const customerAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(CustomerAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  router.navigate(['/account/login'], { queryParams: { returnUrl } });
  return false;
};
