import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// When opened as a live preview from the merchant builder (dev), the tenant
// slug arrives as a query param. Persist it before Angular bootstraps so the
// initial store/config load resolves the correct tenant (the store-header
// interceptor reads `dev-store-slug` from localStorage).
try {
  const params = new URLSearchParams(window.location.search);
  const previewSlug = params.get('slug');
  if (window.location.pathname.includes('__preview') && previewSlug) {
    localStorage.setItem('dev-store-slug', previewSlug);
  }
} catch { /* non-browser / storage disabled — ignore */ }

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
