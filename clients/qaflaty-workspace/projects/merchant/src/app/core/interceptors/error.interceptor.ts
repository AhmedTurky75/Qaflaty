import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Token expired — refresh via cookie (no token in body needed)
        return authService.refreshToken().pipe(
          switchMap(() => next(req.clone({ withCredentials: true }))),
          catchError(refreshError => {
            //authService.logout();
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
