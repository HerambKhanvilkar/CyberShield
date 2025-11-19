// Security headers middleware
// Adds a set of response headers to improve security score (CSP intentionally omitted)
module.exports = function securityHeaders(req, res, next) {
  try {
    // HSTS - enforce HTTPS for 2 years and include subdomains
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Basic XSS protection for older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Control what is sent as referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy (formerly Feature-Policy) - restrict powerful features
    // Adjust as appropriate for your app; interest-cohort=() opts out of FLoC.
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    // Prevent framing by unauthorized sites (additional safeguard)
    // Note: X-Frame-Options already set above; some scanners look for both.

  } catch (e) {
    // ignore header-setting errors
  }
  return next();
};
