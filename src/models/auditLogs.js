import { poolPromise } from "../config/dbConnection.js";

/**
 * Get all audit logs with filters and pagination
 * @param {Object} filters - Filter options
 * @param {string} filters.userType - Filter by user type (admin/student)
 * @param {string} filters.entityType - Filter by entity type
 * @param {string} filters.action - Filter by action (CREATE/UPDATE/DELETE)
 * @param {string} filters.startDate - Filter by start date
 * @param {string} filters.endDate - Filter by end date
 * @param {string} filters.search - Search by user name or description
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 50)
 */
export const getAllAuditLogsModel = async (filters = {}) => {
  try {
    const pool = await poolPromise;
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let parameters = {};

    // Build WHERE conditions
    if (filters.userType) {
      whereConditions.push("user_type = @userType");
      parameters.userType = filters.userType;
    }

    if (filters.entityType) {
      whereConditions.push("entity_type = @entityType");
      parameters.entityType = filters.entityType;
    }

    if (filters.action) {
      whereConditions.push("action = @action");
      parameters.action = filters.action;
    }

    if (filters.startDate) {
      whereConditions.push("CAST(created_at AS DATE) >= @startDate");
      parameters.startDate = filters.startDate;
    }

    if (filters.endDate) {
      whereConditions.push("CAST(created_at AS DATE) <= @endDate");
      parameters.endDate = filters.endDate;
    }

    if (filters.search) {
      whereConditions.push("(user_name LIKE @search OR description LIKE @search)");
      parameters.search = `%${filters.search}%`;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `;

    let countRequest = pool.request();
    Object.keys(parameters).forEach((key) => {
      countRequest.input(key, parameters[key]);
    });
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        id,
        user_id,
        user_type,
        user_name,
        entity_type,
        entity_id,
        action,
        description,
        old_value,
        new_value,
        ip_address,
        created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    let dataRequest = pool.request();
    Object.keys(parameters).forEach((key) => {
      dataRequest.input(key, parameters[key]);
    });
    dataRequest.input("offset", offset);
    dataRequest.input("limit", limit);

    const dataResult = await dataRequest.query(dataQuery);

    return {
      logs: dataResult.recordset,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};
