// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { getDb, isDbConnected } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const isDemo = String(process.env.DEMO_MODE || "").trim().toLowerCase() === "true" || process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production";

    // ─── Authenticated flow ─────────────────────────────────────────────────────────────
    // If a Bearer token is present, verify it and load the user.
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "geoguardian-jwt-secret");
      } catch {
        // Fall through to unauthenticated path below if token verification fails
      }

      if (decoded) {
        const userId = Number(decoded.id);
        if (isDbConnected() && userId && !isNaN(userId)) {
          const [rows] = await getDb().execute(
            "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
            [userId]
          );
          const user = rows[0];
          if (user) {
            req.user = {
              _id: String(user.id),
              id: user.id,
              name: user.name,
              email: user.email,
            };
            return next();
          }
        } else if (!isDbConnected()) {
          // When database is unavailable in demo mode, use decoded token payload
          req.user = {
            _id: String(decoded.id || "1"),
            id: decoded.id || 1,
            name: decoded.name || "Demo User",
            email: decoded.email || "demo@geoguardian.local",
          };
          return next();
        }
      }
    }

    // ─── Unauthenticated / no-login-UI fallback ──────────────────────────────────────
    if (isDbConnected()) {
      const [rows] = await getDb().execute(
        "SELECT id, name, email FROM users ORDER BY id ASC LIMIT 1"
      );
      const defaultUser = rows[0];

      if (!defaultUser) {
        return res.status(401).json({
          error: "No user account found in the database. Please create a user account first.",
        });
      }

      req.user = {
        _id: String(defaultUser.id),
        id: defaultUser.id,
        name: defaultUser.name,
        email: defaultUser.email,
      };

      return next();
    } else {
      if (isDemo) {
        req.user = {
          _id: "demo-user-1",
          id: 1,
          name: "Demo User",
          email: "demo@geoguardian.local",
        };
        return next();
      }

      return res.status(503).json({
        error: "Database unavailable and demo mode is not enabled.",
      });
    }
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    res.status(500).json({ error: "Server error in auth middleware" });
  }
};

export default authMiddleware;
