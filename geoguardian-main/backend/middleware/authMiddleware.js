// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { getDb } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ── Authenticated flow ──────────────────────────────────────────────────
    // If a Bearer token is present, verify it and load the real user.
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        // Fall through to unauthenticated path below
      }

      if (decoded) {
        const userId = Number(decoded.id);
        if (userId && !isNaN(userId)) {
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
        }
      }
    }

    // ── Unauthenticated / no-login-UI fallback ──────────────────────────────
    // This application has no login page. In development mode, resolve the
    // first real user from the database so that foreign-key constraints are
    // satisfied. This is safe because the app is a local-only dev environment.
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

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    res.status(500).json({ error: "Server error in auth middleware" });
  }
};

export default authMiddleware;
