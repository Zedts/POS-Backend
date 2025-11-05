import { poolPromise } from '../config/dbConnection.js';
import sql from 'mssql';

// Get Sales Report (Daily/Weekly/Monthly)
export const getSalesReportModel = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT 
          COUNT(DISTINCT order_number) as total_transactions,
          SUM(order_total) as total_revenue,
          AVG(order_total) as average_order_value
        FROM orders
        WHERE order_date BETWEEN @startDate AND @endDate
          AND status = 'complete'
      `);

    // Get daily trend data for chart
    const trendResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT 
          CAST(order_date AS DATE) as date,
          COUNT(DISTINCT order_number) as transactions,
          SUM(order_total) as revenue
        FROM orders
        WHERE order_date BETWEEN @startDate AND @endDate
          AND status = 'complete'
        GROUP BY CAST(order_date AS DATE)
        ORDER BY CAST(order_date AS DATE)
      `);

    return {
      summary: result.recordset[0],
      trend: trendResult.recordset
    };
  } catch (error) {
    throw error;
  }
};

// Get Top 5 Products by Quantity Sold
export const getTopProductsModel = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT TOP 5
          p.id,
          p.product_name,
          p.picture_url as product_picture,
          p.price as product_price,
          SUM(od.qty_product) as total_qty_sold,
          SUM(od.qty_product * od.price_product) as total_revenue
        FROM order_details od
        JOIN products p ON od.product_id = p.id
        JOIN orders o ON od.order_number = o.order_number
        WHERE o.order_date BETWEEN @startDate AND @endDate
          AND o.status = 'complete'
        GROUP BY p.id, p.product_name, p.picture_url, p.price
        ORDER BY total_qty_sold DESC
      `);

    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get Discount Usage Report
export const getDiscountUsageModel = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT 
          d.discount_code,
          CAST(d.description AS VARCHAR(MAX)) as discount_description,
          d.discount_type,
          d.discount_percent,
          COUNT(o.order_number) as usage_count,
          SUM(o.order_total - o.balance) as total_discount_amount,
          SUM(o.order_total) as total_revenue_with_discount
        FROM discount d
        LEFT JOIN orders o ON d.discount_code = o.discount_code
          AND o.order_date BETWEEN @startDate AND @endDate
          AND o.status = 'complete'
        WHERE d.discount_code IN (
          SELECT DISTINCT discount_code 
          FROM orders 
          WHERE discount_code IS NOT NULL
            AND order_date BETWEEN @startDate AND @endDate
            AND status = 'complete'
        )
        GROUP BY d.discount_code, d.discount_type, d.discount_percent, CAST(d.description AS VARCHAR(MAX))
        ORDER BY usage_count DESC
      `);

    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get Stock Status (Low Stock & Expired Products)
export const getStockStatusModel = async () => {
  try {
    const pool = await poolPromise;
    
    // Get low stock products (stock < 10)
    const lowStockResult = await pool.request()
      .query(`
        SELECT 
          id,
          product_name,
          picture_url as product_picture,
          qty as product_stock,
          price as product_price,
          category_id
        FROM products
        WHERE qty < 10
          AND qty > 0
        ORDER BY qty ASC
      `);

    // Get expired products
    const expiredResult = await pool.request()
      .query(`
        SELECT 
          id,
          product_name,
          picture_url as product_picture,
          qty as product_stock,
          exp_date as expired_date,
          price as product_price,
          category_id
        FROM products
        WHERE exp_date < GETDATE()
          AND qty > 0
        ORDER BY exp_date DESC
      `);

    // Get out of stock products
    const outOfStockResult = await pool.request()
      .query(`
        SELECT 
          id,
          product_name,
          picture_url as product_picture,
          qty as product_stock,
          price as product_price,
          category_id
        FROM products
        WHERE qty = 0
        ORDER BY product_name
      `);

    return {
      low_stock: lowStockResult.recordset,
      expired: expiredResult.recordset,
      out_of_stock: outOfStockResult.recordset
    };
  } catch (error) {
    throw error;
  }
};

// Get Student Revenue by Class
export const getStudentRevenueByClassModel = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT 
          s.class,
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT o.order_number) as total_transactions,
          SUM(o.order_total) as total_revenue,
          AVG(o.order_total) as average_order_value
        FROM student s
        LEFT JOIN orders o ON s.id = o.employee_id
          AND o.order_date BETWEEN @startDate AND @endDate
          AND o.status = 'complete'
        WHERE s.is_active = 1
        GROUP BY s.class
        ORDER BY 
          CASE s.class
            WHEN 'X' THEN 1
            WHEN 'XI' THEN 2
            WHEN 'XII' THEN 3
          END
      `);

    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get Student Revenue by Major
export const getStudentRevenueByMajorModel = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT 
          s.major,
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT o.order_number) as total_transactions,
          SUM(o.order_total) as total_revenue,
          AVG(o.order_total) as average_order_value
        FROM student s
        LEFT JOIN orders o ON s.id = o.employee_id
          AND o.order_date BETWEEN @startDate AND @endDate
          AND o.status = 'complete'
        WHERE s.is_active = 1
        GROUP BY s.major
        ORDER BY total_revenue DESC
      `);

    return result.recordset;
  } catch (error) {
    throw error;
  }
};
