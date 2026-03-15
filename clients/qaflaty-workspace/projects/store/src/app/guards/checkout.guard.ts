import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs';
import { CustomerAuthService } from '../services/customer-auth.service';
import { ConfigService } from '../services/config.service';

export const checkoutGuard: CanActivateFn = (route, state) => {
  const authService = inject(CustomerAuthService);
  const configService = inject(ConfigService);
  const router = inject(Router);

  const checkAccess = (): boolean => {
    const settings = configService.config()?.customerAuthSettings;

    // Required mode and not authenticated → must log in first
    if (settings?.mode === 'Required' && !authService.isAuthenticated()) {
      router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    return true;
  };

  if (configService.isLoaded()) return checkAccess();

  return toObservable(configService.isLoaded).pipe(
    filter(loaded => loaded),
    take(1),
    map(() => checkAccess())
  );
};
