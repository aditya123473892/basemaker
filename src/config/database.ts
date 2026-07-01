import * as sql from "mssql";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create connection pool
const pool = new sql.ConnectionPool(config);

// Global error handler for database connection
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

const connectDB = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log("✅ Connected to SQL Server -", process.env.DB_NAME);

    // Verify database connection with test query
    const result = await pool.request().query("SELECT 1");
    if (result) {
      console.log("Database query test successful");
    }
  } catch (err) {
    console.error("❌ Database connection error:", {
      message: (err as Error).message,
      code: (err as any).code,
      state: (err as any).state,
    });
    process.exit(1); // Exit if database connection fails
  }
};

export { pool, sql, connectDB };
