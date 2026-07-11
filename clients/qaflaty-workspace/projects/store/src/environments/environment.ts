export const environment = {
  production: false,
  // Relative so requests go through the dev-server proxy (proxy.conf.json) to
  // the backend — keeps the API same-origin, avoiding cross-site cookie warnings.
  apiUrl: '/api',
  appName: 'Qaflaty Store'
};
