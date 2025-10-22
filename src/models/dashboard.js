import sql from "mssql";
import { getPOSPool } from "../config/dbConnection.js";

const DashboardModel = {
  // Get dashboard statistics
  async getDashboardStats() {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      
      // Get today's transactions count
      const todayTransactions = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE CAST(order_date AS DATE) = CAST(GETDATE() AS DATE)
      `);

      // Get this month's transactions count
      const monthTransactions = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE MONTH(order_date) = MONTH(GETDATE())
        AND YEAR(order_date) = YEAR(GETDATE())
      `);

      // Get total revenue (today and month)
      const todayRevenue = await pool.request().query(`
        SELECT ISNULL(SUM(order_total), 0) as total
        FROM orders
        WHERE CAST(order_date AS DATE) = CAST(GETDATE() AS DATE)
      `);

      const monthRevenue = await pool.request().query(`
        SELECT ISNULL(SUM(order_total), 0) as total
        FROM orders
        WHERE MONTH(order_date) = MONTH(GETDATE())
        AND YEAR(order_date) = YEAR(GETDATE())
      `);

      // Get low stock products count (qty < 10)
      const lowStock = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM products
        WHERE qty < 10 AND qty > 0
      `);

      // Get active students count
      const activeStudents = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM student
        WHERE is_active = 1
      `);

      return {
        todayTransactions: todayTransactions.recordset[0].count,
        monthTransactions: monthTransactions.recordset[0].count,
        todayRevenue: todayRevenue.recordset[0].total,
        monthRevenue: monthRevenue.recordset[0].total,
        lowStockCount: lowStock.recordset[0].count,
        activeStudents: activeStudents.recordset[0].count
      };
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  // Get weekly sales data for line chart
  async getWeeklySales() {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      const result = await pool.request().query(`
        SELECT 
          DATENAME(WEEKDAY, order_date) as day_name,
          DATEPART(WEEKDAY, order_date) as day_num,
          ISNULL(SUM(order_total), 0) as total
        FROM orders
        WHERE order_date >= DATEADD(day, -7, GETDATE())
        GROUP BY DATENAME(WEEKDAY, order_date), DATEPART(WEEKDAY, order_date)
        ORDER BY day_num
      `);

      return result.recordset;
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  // Get sales by category for doughnut chart
  async getSalesByCategory() {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      const result = await pool.request().query(`
        SELECT 
          c.category_name,
          ISNULL(SUM(od.qty_product * od.price_product), 0) as total
        FROM category c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN order_details od ON p.id = od.product_id
        GROUP BY c.category_name
        ORDER BY total DESC
      `);

      return result.recordset;
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  // Get recent orders
  async getRecentOrders(limit = 5) {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            o.order_number,
            o.order_date,
            o.order_total,
            s.full_name as employee_name,
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM order_details 
                WHERE order_number = o.order_number 
                AND status = 'pending'
              ) THEN 'pending'
              ELSE 'complete'
            END as status
          FROM orders o
          INNER JOIN student s ON o.employee_id = s.id
          ORDER BY o.order_date DESC
        `);

      return result.recordset;
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  // Get top selling products
  async getTopProducts(limit = 5) {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            p.product_name,
            SUM(od.qty_product) as total_sold,
            SUM(od.qty_product * od.price_product) as total_revenue
          FROM order_details od
          INNER JOIN products p ON od.product_id = p.id
          GROUP BY p.product_name
          ORDER BY total_sold DESC
        `);

      return result.recordset;
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  // Get active discounts
  async getActiveDiscounts() {
    let pool;
    try {
      pool = getPOSPool();
      await pool.connect();
      const result = await pool.request().query(`
        SELECT 
          discount_code,
          description,
          discount_percent,
          end_date,
          usage_limit,
          used_count
        FROM discount
        WHERE CAST(GETDATE() AS DATE) BETWEEN start_date AND end_date
        ORDER BY end_date ASC
      `);

      return result.recordset;
    } catch (error) {
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  }
};

export default DashboardModel;
