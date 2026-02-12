import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(CustomerAuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users to profile
  router.navigate(['/account/profile']);
  return false;
};
