export const environment = {
  production: false,
  // Relative so requests go through the dev-server proxy (proxy.conf.json) to
  // the backend — keeps the API same-origin, avoiding cross-site cookie warnings.
  apiUrl: '/api',
  appName: 'Qaflaty Merchant Dashboard',
  // Origin where the STORE app is served, used for the live section preview
  // iframe. Must point at the storefront (which serves the /__preview route),
  // NOT the merchant app. In dev this is the store dev server
  // (npm run start:store → port 4201). Leave empty to derive it from the
  // store's slug / custom domain instead.
  storeBaseUrl: 'http://localhost:4202'
};
