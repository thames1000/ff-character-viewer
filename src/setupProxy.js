const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/lodestone',
        createProxyMiddleware({
            target: 'https://na.finalfantasyxiv.com',
            changeOrigin: true,
            pathRewrite: {
                '^/lodestone': '/lodestone'
            }
        })
    );
}; 