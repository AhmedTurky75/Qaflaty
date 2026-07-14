import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GuestSessionService } from '../services/guest-session.service';

// Paths that need to identify/correlate an anonymous visitor server-side: guest cart CRUD,
// checkout (so a guest order can locate and clear the cart that was checked out), and presence
// heartbeats (guest "active users" counting). Harmless to attach even when the caller turns out
// to be an authenticated customer — the server prefers the JWT customer id when both are present.
const GUEST_ID_PATHS = ['/storefront/guest-cart', '/storefront/orders', '/storefront/presence'];

/**
 * Attaches the X-Guest-Id header to storefront requests that need to identify an anonymous
 * visitor. A guest UUID is created on first use and persisted in localStorage.
 */
export const guestCartInterceptor: HttpInterceptorFn = (req, next) => {
  if (!GUEST_ID_PATHS.some(path => req.url.includes(path))) {
    return next(req);
  }

  const guestId = inject(GuestSessionService).getOrCreateGuestId();
  return next(req.clone({ setHeaders: { 'X-Guest-Id': guestId } }));
};
