import { poolPromise } from "../config/dbConnection.js";

/**
 * Create audit log entry
 * @param {Object} logData - Audit log data
 * @param {number} logData.userId - ID of user performing action
 * @param {string} logData.userType - Type of user ('admin' or 'student')
 * @param {string} logData.userName - Name of user for display
 * @param {string} logData.entityType - Type of entity (product, category, discount, student, order, invoice)
 * @param {string|number} logData.entityId - ID of the entity being modified
 * @param {string} logData.action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} logData.description - Description of the action
 * @param {Object} logData.oldValue - Old value (for UPDATE) - will be JSON stringified
 * @param {Object} logData.newValue - New value (for CREATE/UPDATE) - will be JSON stringified
 * @param {string} logData.ipAddress - IP address of user (optional)
 */
export const createAuditLog = async (logData) => {
  try {
    const pool = await poolPromise;
    
    const query = `
      INSERT INTO audit_logs (
        user_id, 
        user_type, 
        user_name, 
        entity_type, 
        entity_id, 
        action, 
        description, 
        old_value, 
        new_value, 
        ip_address
      )
      VALUES (
        @userId, 
        @userType, 
        @userName, 
        @entityType, 
        @entityId, 
        @action, 
        @description, 
        @oldValue, 
        @newValue, 
        @ipAddress
      )
    `;

    await pool
      .request()
      .input("userId", logData.userId)
      .input("userType", logData.userType)
      .input("userName", logData.userName)
      .input("entityType", logData.entityType)
      .input("entityId", logData.entityId ? String(logData.entityId) : null)
      .input("action", logData.action)
      .input("description", logData.description)
      .input("oldValue", logData.oldValue ? JSON.stringify(logData.oldValue) : null)
      .input("newValue", logData.newValue ? JSON.stringify(logData.newValue) : null)
      .input("ipAddress", logData.ipAddress || null)
      .query(query);

    return { success: true };
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw error - audit log shouldn't break main operation
    return { success: false, error: error.message };
  }
};
