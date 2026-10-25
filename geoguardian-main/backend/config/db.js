// config/db.js
import mysql from "mysql2/promise";

let pool = null;
let isConnected = false;

export const isDbConnected = () => Boolean(isConnected && pool !== null);

export const getDb = () => {
  if (!pool || !isConnected) throw new Error("Database pool has not been initialized or is unavailable");
  return pool;
};

const initializeGeoGuardianTable = async (dbPool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS geoguardian_records (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      bounding_box JSON NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      selected_scenes JSON NULL,
      cloud_percentage DECIMAL(5,2) NULL,
      mean_ndvi DECIMAL(5,4) NULL,
      before_ndvi DECIMAL(5,4) NULL,
      after_ndvi DECIMAL(5,4) NULL,
      ndvi_change DECIMAL(5,4) NULL,
      affected_area DECIMAL(12,4) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;
  await dbPool.execute(query);
  console.log("GeoGuardian DB tables checked/created.");
};

const connectDB = async () => {
  const isDemo = String(process.env.DEMO_MODE || "").trim().toLowerCase() === "true" || process.env.DEMO_MODE === "1";
  const hasCreds = Boolean(
    process.env.DB_HOST &&
    process.env.DB_NAME &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD
  );

  if (!hasCreds) {
    if (isDemo) {
      console.warn("[DEMO MODE] MySQL credentials not provided. Database persistence disabled; client-side localStorage will be used.");
      isConnected = false;
      pool = null;
      return null;
    }
    throw new Error("Missing required database credentials: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD");
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      timezone: "Z"
    });

    const connection = await pool.getConnection();
    connection.release();
    isConnected = true;

    // Initialize GeoGuardian tables
    await initializeGeoGuardianTable(pool);

    console.log(`MySQL connected: ${process.env.DB_HOST || "127.0.0.1"}/${process.env.DB_NAME}`);
    return pool;
  } catch (error) {
    isConnected = false;
    pool = null;
    if (isDemo) {
      console.warn(`[DEMO MODE] MySQL connection failed (${error.message}). Continuing in demo mode without database.`);
      return null;
    }
    throw error;
  }
};

export default connectDB;
