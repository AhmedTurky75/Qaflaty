import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureService } from '../services/feature.service';

export const featurePageGuard = (pageType: string): CanActivateFn => {
  return () => {
    const featureService = inject(FeatureService);
    const router = inject(Router);

    if (featureService.isPageEnabled(pageType)) {
      return true;
    }

    router.navigate(['/not-found']);
    return false;
  };
};
