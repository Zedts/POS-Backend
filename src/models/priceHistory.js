import sql from 'mssql';
import { poolPromise } from '../config/dbConnection.js';

// Get all products with price history summary
export const getAllProductsWithPriceHistoryModel = async (filters) => {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        p.id,
        p.product_name,
        p.picture_url,
        p.price as current_price,
        p.category_id,
        c.category_name,
        (SELECT TOP 1 changed_at FROM product_price_history WHERE product_id = p.id ORDER BY changed_at DESC) as last_updated,
        (SELECT COUNT(*) FROM product_price_history WHERE product_id = p.id) as total_changes
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE 1=1
    `;

    const request = pool.request();

    // Filter by search (product name)
    if (filters.search) {
      query += ` AND p.product_name LIKE @search`;
      request.input('search', sql.VarChar, `%${filters.search}%`);
    }

    // Filter by category
    if (filters.categoryId) {
      query += ` AND p.category_id = @categoryId`;
      request.input('categoryId', sql.Int, parseInt(filters.categoryId));
    }

    // Filter by date range (last updated)
    if (filters.startDate && filters.endDate) {
      query += ` AND p.id IN (
        SELECT DISTINCT product_id 
        FROM product_price_history 
        WHERE changed_at BETWEEN @startDate AND @endDate
      )`;
      request.input('startDate', sql.DateTime, filters.startDate);
      request.input('endDate', sql.DateTime, filters.endDate);
    }

    query += ` ORDER BY p.product_name`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get detailed price history for specific product
export const getPriceHistoryByProductModel = async (productId) => {
  try {
    const pool = await poolPromise;
    
    // Get product info
    const productResult = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT 
          p.id,
          p.product_name,
          p.picture_url,
          p.price as current_price,
          c.category_name
        FROM products p
        LEFT JOIN category c ON p.category_id = c.id
        WHERE p.id = @productId
      `);

    // Get price history
    const historyResult = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT 
          ph.id,
          ph.product_id,
          ph.old_price,
          ph.new_price,
          CAST(ph.change_reason AS VARCHAR(MAX)) as change_reason,
          ph.changed_at,
          ph.changed_by,
          a.full_name as changed_by_name
        FROM product_price_history ph
        LEFT JOIN admin a ON ph.changed_by = a.id
        WHERE ph.product_id = @productId
        ORDER BY ph.changed_at DESC
      `);

    return {
      product: productResult.recordset[0] || null,
      history: historyResult.recordset
    };
  } catch (error) {
    throw error;
  }
};
