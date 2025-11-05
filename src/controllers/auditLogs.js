import { getAllAuditLogsModel } from "../models/auditLogs.js";

/**
 * Get all audit logs with filters and pagination
 */
export const getAllAuditLogs = async (req, res) => {
  try {
    const filters = {
      userType: req.query.userType,
      entityType: req.query.entityType,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    const result = await getAllAuditLogsModel(filters);

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil audit logs",
      error: error.message,
    });
  }
};
