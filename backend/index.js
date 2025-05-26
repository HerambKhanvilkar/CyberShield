// require('dotenv').config();
// require("./services/cronJobService");
// const { updateSearchCollection } = require("./services/searchService");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const logger = require("./logger");
const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const escapeHtml = require("escape-html");
const serverRoutes = require("./routes/server");
const authRoutes = require("./routes/authRoutes");
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
  delayMs:()=> 700,
});

app.use(helmet({contentSecurityPolicy: false}));

app.use(express.json());

app.use(express.urlencoded({extended:true}))

app.use(
  cors({
    origin: process.env.FRONTEND || "http://localhost:3000",
    // origin: "http://localhost:5173",
    // origin: "http://dccveengine-vm.eastus.cloudapp.azure.com",
  })
);

// Sanitize & Escape All Inputs Middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      req.body[key] = escapeHtml(mongoSanitize(req.body[key]));
    }
  }
  if (req.query) {
    for (let key in req.query) {
      req.query[key] = escapeHtml(mongoSanitize(req.query[key]));
    }
  }
  if (req.params) {
    for (let key in req.params) {
      req.params[key] = escapeHtml(mongoSanitize(req.params[key]));
    }
  }
  next();
});


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
  app.use("/api", serverRoutes);
  // app.use("/api/dashboard", strictLimiter, dashboardRoutes);
  // app.use("/api", strictLimiter, watchlistRoutes);
  // app.use("/api/audit", strictLimiter, auditRoutes);

  // app.use("/api", speedLimiter, looseLimiter);
})();
