import { poolPromise } from "../config/dbConnection.js";
import sql from "mssql";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Admin Profile by ID
export const getAdminProfileModel = async (adminId) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('adminId', sql.Int, adminId)
      .query(`
        SELECT id, username, full_name, created_date, updated_date
        FROM admin
        WHERE id = @adminId
      `);
    
    return result.recordset[0] || null;
  } catch (error) {
    throw error;
  }
};

// Update Admin Profile
export const updateAdminProfileModel = async (adminId, profileData) => {
  try {
    const pool = await poolPromise;
    const { username, fullName, currentPassword, newPassword } = profileData;
    
    // If password change requested, verify current password
    if (newPassword) {
      const currentPasswordHash = crypto.createHash('md5').update(currentPassword).digest('hex');
      
      const verifyResult = await pool.request()
        .input('adminId', sql.Int, adminId)
        .input('passwordHash', sql.VarChar, currentPasswordHash)
        .query(`
          SELECT id FROM admin
          WHERE id = @adminId AND password_hash = @passwordHash
        `);
      
      if (verifyResult.recordset.length === 0) {
        return { success: false, message: "Password lama tidak sesuai" };
      }
      
      // Hash new password
      const newPasswordHash = crypto.createHash('md5').update(newPassword).digest('hex');
      
      // Update with new password
      await pool.request()
        .input('adminId', sql.Int, adminId)
        .input('username', sql.VarChar, username)
        .input('fullName', sql.VarChar, fullName)
        .input('passwordHash', sql.VarChar, newPasswordHash)
        .query(`
          UPDATE admin
          SET username = @username, full_name = @fullName, password_hash = @passwordHash, updated_date = GETDATE()
          WHERE id = @adminId
        `);
    } else {
      // Update without password change
      await pool.request()
        .input('adminId', sql.Int, adminId)
        .input('username', sql.VarChar, username)
        .input('fullName', sql.VarChar, fullName)
        .query(`
          UPDATE admin
          SET username = @username, full_name = @fullName, updated_date = GETDATE()
          WHERE id = @adminId
        `);
    }
    
    return { success: true, message: "Profile berhasil diupdate" };
  } catch (error) {
    throw error;
  }
};

// Get Backup Script (script.sql file)
export const getBackupScriptModel = async () => {
  try {
    const scriptPath = path.join(__dirname, '../database/script.sql');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error("File script.sql tidak ditemukan");
    }
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    return scriptContent;
  } catch (error) {
    throw error;
  }
};

// Reset Database to Default (from script.sql)
export const resetDatabaseModel = async () => {
  try {
    const pool = await poolPromise;
    const scriptPath = path.join(__dirname, '../database/script.sql');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error("File script.sql tidak ditemukan");
    }
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Drop all tables in correct order (reverse of foreign key dependencies)
    await pool.request().query(`
      -- Drop tables in reverse order of dependencies
      IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
      IF OBJECT_ID('invoices', 'U') IS NOT NULL DROP TABLE invoices;
      IF OBJECT_ID('order_details', 'U') IS NOT NULL DROP TABLE order_details;
      IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
      IF OBJECT_ID('discount', 'U') IS NOT NULL DROP TABLE discount;
      IF OBJECT_ID('product_price_history', 'U') IS NOT NULL DROP TABLE product_price_history;
      IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;
      IF OBJECT_ID('category', 'U') IS NOT NULL DROP TABLE category;
      IF OBJECT_ID('student', 'U') IS NOT NULL DROP TABLE student;
      IF OBJECT_ID('admin', 'U') IS NOT NULL DROP TABLE admin;
    `);
    
    // Split script by GO statements and execute each batch
    const batches = scriptContent.split(/\bGO\b/gi).filter(batch => batch.trim());
    
    for (const batch of batches) {
      if (batch.trim()) {
        await pool.request().query(batch);
      }
    }
    
    return { success: true, message: "Database berhasil di-reset ke kondisi default" };
  } catch (error) {
    throw error;
  }
};

// Restore Database from Uploaded SQL File
export const restoreDatabaseModel = async (sqlContent) => {
  try {
    const pool = await poolPromise;
    
    // Drop all tables in correct order
    await pool.request().query(`
      -- Drop tables in reverse order of dependencies
      IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
      IF OBJECT_ID('invoices', 'U') IS NOT NULL DROP TABLE invoices;
      IF OBJECT_ID('order_details', 'U') IS NOT NULL DROP TABLE order_details;
      IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
      IF OBJECT_ID('discount', 'U') IS NOT NULL DROP TABLE discount;
      IF OBJECT_ID('product_price_history', 'U') IS NOT NULL DROP TABLE product_price_history;
      IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;
      IF OBJECT_ID('category', 'U') IS NOT NULL DROP TABLE category;
      IF OBJECT_ID('student', 'U') IS NOT NULL DROP TABLE student;
      IF OBJECT_ID('admin', 'U') IS NOT NULL DROP TABLE admin;
    `);
    
    // Split script by GO statements and execute each batch
    const batches = sqlContent.split(/\bGO\b/gi).filter(batch => batch.trim());
    
    for (const batch of batches) {
      if (batch.trim()) {
        await pool.request().query(batch);
      }
    }
    
    return { success: true, message: "Database berhasil di-restore dari file backup" };
  } catch (error) {
    throw error;
  }
};
