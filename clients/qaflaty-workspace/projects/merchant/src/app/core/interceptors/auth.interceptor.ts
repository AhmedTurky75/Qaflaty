import { HttpInterceptorFn } from '@angular/common/http';

// Cookies are sent automatically by the browser (withCredentials).
// This interceptor is kept for any future needs but no longer injects Bearer headers.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Ensure credentials (cookies) are sent on all API requests
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
