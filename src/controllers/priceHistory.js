import {
  getAllProductsWithPriceHistoryModel,
  getPriceHistoryByProductModel
} from '../models/priceHistory.js';

// Get all products with price history summary
export const getAllProductsWithPriceHistory = async (req, res) => {
  try {
    const { search, categoryId, startDate, endDate } = req.query;

    const filters = {
      search: search || null,
      categoryId: categoryId || null,
      startDate: startDate || null,
      endDate: endDate || null
    };

    const data = await getAllProductsWithPriceHistoryModel(filters);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getAllProductsWithPriceHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products with price history',
      error: error.message
    });
  }
};

// Get detailed price history for specific product
export const getPriceHistoryByProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const data = await getPriceHistoryByProductModel(parseInt(id));

    if (!data.product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getPriceHistoryByProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
      error: error.message
    });
  }
};
