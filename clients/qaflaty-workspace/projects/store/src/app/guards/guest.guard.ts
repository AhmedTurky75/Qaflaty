import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs';
import { CustomerAuthService } from '../services/customer-auth.service';
import { ConfigService } from '../services/config.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(CustomerAuthService);
  const configService = inject(ConfigService);
  const router = inject(Router);

  const checkAccess = (): boolean => {
    const mode = configService.config()?.customerAuthSettings?.mode ?? 'Optional';

    // GuestOnly: login/register pages are disabled — redirect home
    if (mode === 'GuestOnly') {
      router.navigate(['/']);
      return false;
    }

    // Already authenticated — redirect to profile
    if (authService.isAuthenticated()) {
      router.navigate(['/account/profile']);
      return false;
    }

    return true;
  };

  // Config already loaded — check synchronously
  if (configService.isLoaded()) return checkAccess();

  // Wait for config to finish loading, then check
  return toObservable(configService.isLoaded).pipe(
    filter(loaded => loaded),
    take(1),
    map(() => checkAccess())
  );
};
