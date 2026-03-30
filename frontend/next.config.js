module.exports = {
  experimental: {},
  turbopack: {},
    images: {
      localPatterns: [
        {
          // existing assets folder pattern
          pathname: '/assets/images/**',
          search: '',
        },
        {
          // allow images located in public root (e.g. /dclogoUK.png)
          pathname: '/**/*',
          // you can restrict to specific extensions if desired: '/**/*.{png,jpg,jpeg,svg}'
          search: '',
        },
      ],
    },
    reactStrictMode: true,
    env: {
      SERVER_URL: process.env.SERVER_URL,
    },
  async headers() {
    return [
      {
        // Apply these headers to all routes in the application
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' }
        ],
      },
    ];
  },
}
