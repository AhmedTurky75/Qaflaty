import { HttpInterceptorFn } from '@angular/common/http';

// Cookies sent automatically via withCredentials; no Bearer header needed.
export const customerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
