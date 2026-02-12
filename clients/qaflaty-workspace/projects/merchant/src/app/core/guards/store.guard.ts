import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { StoreContextService } from '../services/store-context.service';

export const storeGuard: CanActivateFn = () => {
  const storeContext = inject(StoreContextService);
  const router = inject(Router);

  storeContext.initialize();

  if (storeContext.initialized()) {
    return checkStores(storeContext, router);
  }

  return toObservable(storeContext.initialized).pipe(
    filter(initialized => initialized),
    take(1),
    map(() => checkStores(storeContext, router))
  );
};

function checkStores(storeContext: StoreContextService, router: Router): boolean {
  if (storeContext.currentStoreId()) {
    return true;
  }

  if (storeContext.stores().length > 0) {
    storeContext.selectStore(storeContext.stores()[0].id);
    return true;
  }

  router.navigate(['/stores/create']);
  return false;
}
