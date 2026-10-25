// backend/index.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import preferenceRoutes from "./routes/preferences.js";
import nasaRoutes from "./routes/nasa.js";
import analysisRoutes from "./routes/analysis.js";
import changeDetectionRoutes from "./routes/changeDetection.js";
import timelapseRoutes from "./routes/timelapse.js";
import monitoringRoutes from "./routes/monitoring.js";
import geoguardianRoutes from "./routes/geoguardian.js"; // New GeoGuardian router
import connectDB, { isDbConnected } from "./config/db.js";
import { isSentinelConfigured } from "./services/sentinelService.js";
import { startScheduler } from "./services/schedulerService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isDemoMode = process.env.DEMO_MODE === "true";

// Enhanced CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://geoguardian-mu.vercel.app',
  'https://eco-sense-ai-beta.vercel.app',
  'https://eco-sense-ai-one.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check for API (available unconditionally)
app.get("/api/health", (req, res) => {
  const isDemo = process.env.DEMO_MODE === "true";
  const dbConnected = isDbConnected();
  const sentinelConfigured = isSentinelConfigured();

  res.status(200).json({
    status: "OK",
    mode: isDemo ? "demo" : "production",
    services: {
      database: dbConnected ? "connected" : (isDemo ? "demo_mode_unavailable" : "disconnected"),
      sentinelHub: sentinelConfigured ? "connected" : (isDemo ? "demo_mode_unavailable" : "unconfigured")
    },
    message: isDemo
      ? "GeoGuardian backend running in demo mode (browser localStorage enabled for records)"
      : "Backend is healthy",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/nasa", nasaRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/change-detection", changeDetectionRoutes);
app.use("/api/timelapse", timelapseRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/geoguardian", geoguardianRoutes);

// Serve static files from React build if available
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Fallback to React index.html for client-side routing
app.get("*any", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      error: "API Endpoint not found",
      requested: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
  const indexPath = path.join(__dirname, "../frontend/build/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: "GeoGuardian Backend API",
      status: "Running",
      mode: isDemoMode ? "demo" : "production",
      healthCheck: "/api/health"
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Validate essential environment variables
const requiredDbEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const requiredSentinelEnv = ["SENTINEL_CLIENT_ID", "SENTINEL_CLIENT_SECRET"];
const missingDbEnv = requiredDbEnv.filter(envName => !process.env[envName]);
const missingSentinelEnv = requiredSentinelEnv.filter(envName => !process.env[envName]);
const missingEnv = [...missingDbEnv, ...missingSentinelEnv];

if (missingEnv.length > 0) {
  if (!isDemoMode) {
    console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
    console.error("Please configure them in backend/.env, or enable DEMO_MODE=true for demo deployment.");
    process.exit(1);
  } else {
    console.warn(`⚠️ [DEMO MODE] Running in demo mode without credentials for: ${missingEnv.join(", ")}`);
    console.warn("Database and live satellite queries disabled; client-side localStorage persistence enabled.");
  }
}

// Function to start Express server listening
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`
==================================================
 GEOGUARDIAN API
==================================================

Application running successfully in ${isDemoMode ? "DEMO" : "PRODUCTION"} mode.

Listening on Port: ${PORT}
Frontend / API: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health
Database: ${isDbConnected() ? "Connected" : "Unavailable (Demo Mode Active)"}
Sentinel Hub: ${isSentinelConfigured() ? "Configured" : "Unavailable (Demo Mode Active)"}

==================================================
    `);
  });
};

// Connect to DB and start server conditionally
connectDB()
  .then((pool) => {
    if (pool && isDbConnected()) {
      startScheduler();
    } else {
      console.info("[SCHEDULER] Database pool not connected; automated monitoring jobs skipped.");
    }
    startServer();
  })
  .catch((err) => {
    if (isDemoMode) {
      console.warn(`[DEMO MODE] Database connection failed (${err.message}). Starting server in demo mode without DB.`);
      startServer();
    } else {
      console.error("Database connection error:", err.message);
      process.exit(1);
    }
  });
