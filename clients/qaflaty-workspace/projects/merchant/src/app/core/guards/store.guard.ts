import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { StoreContextService } from '../services/store-context.service';

export const storeGuard: CanActivateFn = () => {
  const storeContext = inject(StoreContextService);
  const router = inject(Router);

  if (storeContext.currentStoreId()) {
    return true;
  }

  // If stores exist but none selected, auto-select first
  if (storeContext.stores().length > 0) {
    storeContext.selectStore(storeContext.stores()[0].id);
    return true;
  }

  // No stores at all — redirect to store creation
  router.navigate(['/stores/create']);
  return false;
};
