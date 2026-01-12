// require('dotenv').config();
// require("./services/cronJobService");
// const { updateSearchCollection } = require("./services/searchService");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const logger = require("./logger");
const helmet = require("helmet");
const securityHeaders = require("./middleware/securityHeaders");
const mongoSanitize = require("mongo-sanitize");
const escapeHtml = require("escape-html");
const serverRoutes = require("./routes/server");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const jobRoutes = require("./routes/jobStatus");
const slowDown = require('express-slow-down');
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

console.log("PORT", PORT);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many attempts, please try again after 15 minutes.",
});

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, try again later.",
});

const looseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1050,
  message: "Too many requests from this IP, try again later.",
});

const speedLimiter = slowDown({
  windowMs: 5 * 60 * 1000,
  delayAfter: 100,
  delayMs: () => 700,
});

app.use(helmet({ contentSecurityPolicy: false }));

// Add additional security headers (CSP intentionally disabled per request)
app.use(securityHeaders);

app.use(express.json());

app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'));


// Configure CORS more explicitly to avoid common CORS errors
const frontendOrigin = process.env.FRONTEND || "http://localhost:3000";
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Always allow localhost during local development (covers http://localhost:3000)
    try {
      const low = String(origin).toLowerCase();
      if (low.includes('localhost') || low.includes('127.0.0.1') || low.includes('[::1]')) {
        //console.log(`CORS allowed for local origin: ${origin}`);
        return callback(null, true);
      }
    } catch (e) {
      // ignore parsing errors and continue with normal checks
    }
    // If frontendOrigin is a comma-separated list, support that
    if (String(frontendOrigin).includes(',')) {
      const allowed = String(frontendOrigin).split(',').map(s => s.trim());
      const ok = allowed.indexOf(origin) !== -1;
      //if (ok) console.log(`CORS allowed for origin: ${origin}`); else console.warn(`CORS denied for origin: ${origin}`);
      return callback(null, ok);
    }
    const ok = origin === frontendOrigin;
    //if (ok) console.log(`CORS allowed for origin: ${origin}`); else console.warn(`CORS denied for origin: ${origin}`);
    return callback(null, ok);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Generic error handler to avoid leaking stack traces and to return proper status codes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: 'CORS Forbidden' });
  }
  res.status(500).json({ message: 'Internal Server Error' });
});

// Sanitize & Escape All Inputs Middleware
// app.use((req, res, next) => {
//   if (req.body) {
//     for (let key in req.body) {
//       req.body[key] = escapeHtml(mongoSanitize(req.body[key]));
//     }
//   }
//   if (req.query) {
//     for (let key in req.query) {
//       req.query[key] = escapeHtml(mongoSanitize(req.query[key]));
//     }
//   }
//   if (req.params) {
//     for (let key in req.params) {
//       req.params[key] = escapeHtml(mongoSanitize(req.params[key]));
//     }
//   }
//   next();
// });


(async () => {
  try {
    // Connect to MongoDB Atlas
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
      .then(() => console.log("MongoDB Atlas Connected"))
      .catch(err => console.error("MongoDB Connection Error:", err));

    app.listen(PORT, () => {
      logger.info(`Application initialized successfully on port ${PORT}`);
    });

  } catch (error) {
    logger.error("Error initializing the application:");
    logger.error(error);
  }

  // API

  app.set("server.timeout", 300000);
  app.use("/api/auth", authRoutes);
  app.use("/api", jobRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", serverRoutes);

  // New Routes for Portal and Application
  const portalRoutes = require("./routes/portalRoutes");
  const applicationRoutes = require("./routes/applicationRoutes");
  const fellowshipRoutes = require("./routes/fellowshipRoutes");
  const otpRoutes = require("./routes/otpRoutes"); // NEW
  const testRoutes = require("./routes/testRoutes"); // NEW

  app.use("/api/portal", portalRoutes);
  app.use("/api/application", applicationRoutes);
  app.use("/api/fellowship", fellowshipRoutes);
  app.use("/api/auth", otpRoutes); // Resend/Change email routes
  app.use("/api/test", testRoutes); // PDF generation testing
  // app.use("/api/dashboard", strictLimiter, dashboardRoutes);
  // app.use("/api", strictLimiter, watchlistRoutes);
  // app.use("/api/audit", strictLimiter, auditRoutes);

  // app.use("/api", speedLimiter, looseLimiter);
})();
