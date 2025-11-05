import {
  getSalesReportModel,
  getTopProductsModel,
  getDiscountUsageModel,
  getStockStatusModel,
  getStudentRevenueByClassModel,
  getStudentRevenueByMajorModel
} from '../models/reports.js';

// Get Sales Report
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await getSalesReportModel(startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getSalesReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales report',
      error: error.message
    });
  }
};

// Get Top Products
export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await getTopProductsModel(startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top products',
      error: error.message
    });
  }
};

// Get Discount Usage
export const getDiscountUsage = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await getDiscountUsageModel(startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getDiscountUsage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discount usage',
      error: error.message
    });
  }
};

// Get Stock Status
export const getStockStatus = async (req, res) => {
  try {
    const data = await getStockStatusModel();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getStockStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock status',
      error: error.message
    });
  }
};

// Get Student Revenue by Class
export const getStudentRevenueByClass = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await getStudentRevenueByClassModel(startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getStudentRevenueByClass:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student revenue by class',
      error: error.message
    });
  }
};

// Get Student Revenue by Major
export const getStudentRevenueByMajor = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const data = await getStudentRevenueByMajorModel(startDate, endDate);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getStudentRevenueByMajor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student revenue by major',
      error: error.message
    });
  }
};
