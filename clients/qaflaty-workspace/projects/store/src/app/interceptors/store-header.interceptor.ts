import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const storeHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${environment.apiUrl}/storefront`)) {
    return next(req);
  }

  const slug = !environment.production
    ? (localStorage.getItem('dev-store-slug') || 'demo-store')
    : null;

  if (slug) {
    req = req.clone({
      setHeaders: { 'X-Store-Slug': slug }
    });
  }

  return next(req);
};
