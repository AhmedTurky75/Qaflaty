export const environment = {
  production: false,
  apiUrl: 'https://localhost:5000/api',
  appName: 'Qaflaty Merchant Dashboard',
  // Origin where the STORE app is served, used for the live section preview
  // iframe. Must point at the storefront (which serves the /__preview route),
  // NOT the merchant app. In dev this is the store dev server
  // (npm run start:store → port 4201). Leave empty to derive it from the
  // store's slug / custom domain instead.
  storeBaseUrl: 'http://localhost:4202'
};
