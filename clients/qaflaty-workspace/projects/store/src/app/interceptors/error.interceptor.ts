import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

const AUTH_PATHS = ['/storefront/auth/refresh', '/storefront/auth/login', '/storefront/auth/verify-otp'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(CustomerAuthService);
  const router = inject(Router);

  const isAuthRequest = AUTH_PATHS.some(p => req.url.includes(p));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            return next(req.clone({ withCredentials: true })).pipe(
              catchError((retryError: HttpErrorResponse) => {
                if (retryError.status === 401) {
                  router.navigate(['/access-denied'], {
                    queryParams: { endpoint: req.url }
                  });
                }
                return throwError(() => retryError);
              })
            );
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      const errorMessage =
        error.error?.message || error.error?.title || error.message || 'An error occurred';

      console.error('HTTP Error:', { status: error.status, message: errorMessage, error: error.error });

      return throwError(() => ({ status: error.status, message: errorMessage, error: error.error }));
    })
  );
};
