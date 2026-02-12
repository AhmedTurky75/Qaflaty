import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CustomerAuthService } from '../services/customer-auth.service';

export const customerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(CustomerAuthService);
  const token = authService.getAccessToken();

  // Only add token to storefront API requests
  if (token && req.url.includes('/storefront/')) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
