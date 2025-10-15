import dotenv from "dotenv";
import knex from "knex";
import sql from "mssql";
import { Sequelize } from "sequelize";

dotenv.config();

const sqlConfigPOS = {
  user: process.env.DB_POS_USERNAME,
  password: process.env.DB_POS_PASSWORD,
  database: process.env.DB_POS_NAME,
  server: process.env.DB_POS_SERVER,
  pool: {
    max: 100,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

export const connectDBPOS = async (sqlQuery) => {
  const cPool = new sql.ConnectionPool(sqlConfigPOS);
  cPool.on("error", (err) => console.log("---> SQL Error: ", err));

  try {
    await cPool.connect();
    try {
      let result = await cPool.request().query(sqlQuery);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  } catch (err) {
    return err;
  } finally {
    cPool.close();
  }
};

// Sequelize connection for POS
export const connectDBPOSSequelize = new Sequelize(
  process.env.DB_POS_NAME,
  process.env.DB_POS_USERNAME,
  process.env.DB_POS_PASSWORD,
  {
    host: process.env.DB_POS_SERVER,
    dialect: "mssql",
    logging: false,
    dialectOptions: {
      encrypt: false,
      trustServerCertificate: true,
      useUTC: false,
      timezone: "+07:00", // Timezone Asia/Jakarta
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
    },
    retry: {
      max: 3,
      timeout: 10000,
    },
  }
);

// Function to check database connection
export const checkDatabaseConnection = async () => {
  try {
    await connectDBPOSSequelize.authenticate();
    console.log("✅ POS Database connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to POS database:", error.message);
    return false;
  }
};

// Export SQL Server connection pool for direct queries
export const getPOSPool = () => {
  return new sql.ConnectionPool(sqlConfigPOS);
};