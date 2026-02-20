import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GuestSessionService } from '../services/guest-session.service';

/**
 * Attaches the X-Guest-Id header to all /storefront/guest-cart requests.
 * A guest UUID is created on first use and persisted in localStorage.
 */
export const guestCartInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/storefront/guest-cart')) {
    return next(req);
  }

  const guestId = inject(GuestSessionService).getOrCreateGuestId();
  return next(req.clone({ setHeaders: { 'X-Guest-Id': guestId } }));
};
