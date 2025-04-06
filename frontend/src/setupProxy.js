const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',  // Your API endpoint prefix
    createProxyMiddleware({
      target: 'http://localhost:5000',  // Your backend server
      changeOrigin: true,
      secure: false,  // For development with HTTP
      pathRewrite: {
        '^/api': '',  // Remove /api prefix when forwarding
      },
      onProxyReq: (proxyReq) => {
        // Optional: log the proxied request
        console.log('Proxying request to:', proxyReq.path);
      },
      onError: (err) => {
        console.error('Proxy error:', err);
      }
    })
  );
};