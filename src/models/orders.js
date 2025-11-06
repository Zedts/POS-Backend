import sql from 'mssql';
import { poolPromise } from '../config/dbConnection.js';

// Get all orders with filters
export const getAllOrders = async (filters = {}) => {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        o.order_number,
        o.order_date,
        o.employee_id,
        o.order_total,
        o.balance,
        o.discount_code,
        o.status,
        s.full_name as employee_name,
        s.nisn as employee_nisn
      FROM orders o
      LEFT JOIN student s ON o.employee_id = s.id
      WHERE 1=1
    `;

    const request = pool.request();

    // Filter by date range
    if (filters.startDate) {
      query += ` AND o.order_date >= @startDate`;
      request.input('startDate', sql.DateTime, new Date(filters.startDate));
    }
    if (filters.endDate) {
      query += ` AND o.order_date <= @endDate`;
      request.input('endDate', sql.DateTime, new Date(filters.endDate + ' 23:59:59'));
    }

    // Filter by employee (search by name)
    if (filters.employeeName) {
      query += ` AND s.full_name LIKE @employeeName`;
      request.input('employeeName', sql.VarChar, `%${filters.employeeName}%`);
    }

    // Filter by status
    if (filters.status) {
      query += ` AND o.status = @status`;
      request.input('status', sql.VarChar(10), filters.status);
    }

    query += ` ORDER BY o.order_date DESC`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get order by order_number
export const getOrderByNumber = async (orderNumber) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('orderNumber', sql.VarChar(50), orderNumber)
      .query(`
        SELECT 
          o.order_number,
          o.order_date,
          o.employee_id,
          o.order_total,
          o.balance,
          o.discount_code,
          o.status,
          s.full_name as employee_name,
          s.nisn as employee_nisn,
          s.class as employee_class,
          s.major as employee_major,
          d.description as discount_description,
          d.discount_percent,
          d.discount_type
        FROM orders o
        LEFT JOIN student s ON o.employee_id = s.id
        LEFT JOIN discount d ON o.discount_code = d.discount_code
        WHERE o.order_number = @orderNumber
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Get order details (items) by order_number
export const getOrderDetails = async (orderNumber) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('orderNumber', sql.VarChar(50), orderNumber)
      .query(`
        SELECT 
          od.id,
          od.order_number,
          od.product_id,
          od.product_name,
          od.product_picture,
          od.qty_product,
          od.price_product,
          od.status,
          od.verified_by,
          od.verified_date,
          od.balance,
          v.full_name as verified_by_name
        FROM order_details od
        LEFT JOIN student v ON od.verified_by = v.id
        WHERE od.order_number = @orderNumber
        ORDER BY od.id
      `);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get order statistics
export const getOrderStats = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          ISNULL(COUNT(*), 0) as total_orders,
          ISNULL(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_orders,
          ISNULL(SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END), 0) as complete_orders,
          ISNULL(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) as refunded_orders,
          ISNULL(SUM(CASE WHEN status = 'complete' THEN order_total ELSE 0 END), 0) as total_revenue,
          ISNULL(SUM(CASE WHEN status = 'complete' AND CAST(order_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END), 0) as today_orders,
          ISNULL(SUM(CASE WHEN status = 'complete' AND CAST(order_date AS DATE) = CAST(GETDATE() AS DATE) THEN order_total ELSE 0 END), 0) as today_revenue
        FROM orders
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderNumber, status) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('orderNumber', sql.VarChar(50), orderNumber)
      .input('status', sql.VarChar(10), status)
      .query(`
        UPDATE orders
        SET status = @status
        WHERE order_number = @orderNumber
      `);
    return { order_number: orderNumber, status };
  } catch (error) {
    throw error;
  }
};

// Create new order with order details
export const createOrder = async (orderData, orderItems) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // Generate order number (format: ORD-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${dateStr}-${randomStr}`;
    
    // Insert order
    const orderRequest = new sql.Request(transaction);
    await orderRequest
      .input('orderNumber', sql.VarChar(50), orderNumber)
      .input('orderDate', sql.DateTime, new Date())
      .input('employeeId', sql.Int, orderData.employeeId)
      .input('orderTotal', sql.Decimal(18, 2), orderData.orderTotal)
      .input('balance', sql.Decimal(18, 2), orderData.balance)
      .input('discountCode', sql.VarChar(50), orderData.discountCode || null)
      .input('status', sql.VarChar(10), 'complete')
      .query(`
        INSERT INTO orders (order_number, order_date, employee_id, order_total, balance, discount_code, status)
        VALUES (@orderNumber, @orderDate, @employeeId, @orderTotal, @balance, @discountCode, @status)
      `);
    
    // Insert order details
    for (const item of orderItems) {
      const detailRequest = new sql.Request(transaction);
      await detailRequest
        .input('orderNumber', sql.VarChar(50), orderNumber)
        .input('productId', sql.Int, item.productId)
        .input('productName', sql.VarChar(255), item.productName)
        .input('productPicture', sql.VarChar(255), item.productPicture)
        .input('qtyProduct', sql.Int, item.qty)
        .input('priceProduct', sql.Decimal(18, 2), item.price)
        .input('status', sql.VarChar(50), 'complete')
        .input('verifiedBy', sql.Int, orderData.employeeId)
        .input('verifiedDate', sql.DateTime, new Date())
        .input('balance', sql.Decimal(18, 2), item.qty * item.price)
        .query(`
          INSERT INTO order_details (order_number, product_id, product_name, product_picture, qty_product, price_product, status, verified_by, verified_date, balance)
          VALUES (@orderNumber, @productId, @productName, @productPicture, @qtyProduct, @priceProduct, @status, @verifiedBy, @verifiedDate, @balance)
        `);
      
      // Update product stock
      const stockRequest = new sql.Request(transaction);
      await stockRequest
        .input('productId', sql.Int, item.productId)
        .input('qty', sql.Int, item.qty)
        .query(`
          UPDATE products
          SET qty = qty - @qty
          WHERE id = @productId
        `);
    }
    
    // Update discount usage if discount code is used
    if (orderData.discountCode) {
      const discountRequest = new sql.Request(transaction);
      await discountRequest
        .input('discountCode', sql.VarChar(50), orderData.discountCode)
        .query(`
          UPDATE discount
          SET total_usage = total_usage + 1
          WHERE discount_code = @discountCode
        `);
    }
    
    await transaction.commit();
    return orderNumber;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
