import { poolPromise } from '../config/dbConnection.js';
import sql from 'mssql';

// Get all invoices with filters
export const getAllInvoices = async (filters = {}) => {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.invoice_status,
        i.invoice_date,
        i.order_number,
        i.order_total,
        i.discount_code,
        i.discount_percent,
        i.balance,
        i.paid_by,
        i.verified_by,
        i.mobile_employee,
        s.full_name as verified_by_name,
        s.nisn as verified_by_nisn,
        s.class as verified_by_class,
        s.major as verified_by_major
      FROM invoices i
      LEFT JOIN student s ON i.verified_by = s.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by date range
    if (filters.startDate) {
      query += ` AND CAST(i.invoice_date AS DATE) >= @startDate`;
      params.push({ name: 'startDate', type: sql.Date, value: filters.startDate });
    }

    if (filters.endDate) {
      query += ` AND CAST(i.invoice_date AS DATE) <= @endDate`;
      params.push({ name: 'endDate', type: sql.Date, value: filters.endDate });
    }

    // Filter by invoice number search
    if (filters.invoiceNumber) {
      query += ` AND i.invoice_number LIKE @invoiceNumber`;
      params.push({ name: 'invoiceNumber', type: sql.VarChar, value: `%${filters.invoiceNumber}%` });
    }

    // Filter by status
    if (filters.status) {
      query += ` AND i.invoice_status = @status`;
      params.push({ name: 'status', type: sql.VarChar, value: filters.status });
    }

    // Filter by payment method
    if (filters.paidBy) {
      query += ` AND i.paid_by = @paidBy`;
      params.push({ name: 'paidBy', type: sql.VarChar, value: filters.paidBy });
    }

    query += ` ORDER BY i.invoice_date DESC`;

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

// Get invoice by invoice number with details
export const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const pool = await poolPromise;
    
    // Get invoice info
    const invoiceResult = await pool.request()
      .input('invoiceNumber', sql.VarChar, invoiceNumber)
      .query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.invoice_status,
          i.invoice_date,
          i.order_number,
          i.order_total,
          i.discount_code,
          i.discount_percent,
          i.balance,
          i.paid_by,
          i.verified_by,
          i.mobile_employee,
          s.full_name as verified_by_name,
          s.nisn as verified_by_nisn,
          s.class as verified_by_class,
          s.major as verified_by_major,
          d.description as discount_description,
          d.discount_type
        FROM invoices i
        LEFT JOIN student s ON i.verified_by = s.id
        LEFT JOIN discount d ON i.discount_code = d.discount_code
        WHERE i.invoice_number = @invoiceNumber
      `);

    if (invoiceResult.recordset.length === 0) {
      return null;
    }

    return invoiceResult.recordset[0];
  } catch (error) {
    console.error('Error getting invoice by number:', error);
    throw error;
  }
};

// Get invoice items (from order_details)
export const getInvoiceItems = async (orderNumber) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('orderNumber', sql.VarChar, orderNumber)
      .query(`
        SELECT 
          od.id,
          od.product_id,
          od.product_name,
          od.qty_product,
          od.price_product
        FROM order_details od
        WHERE od.order_number = @orderNumber
        ORDER BY od.id
      `);

    return result.recordset;
  } catch (error) {
    console.error('Error getting invoice items:', error);
    throw error;
  }
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT 
        ISNULL(COUNT(*), 0) as total_invoices,
        ISNULL(SUM(CASE WHEN invoice_status = 'diproses' THEN 1 ELSE 0 END), 0) as diproses_invoices,
        ISNULL(SUM(CASE WHEN invoice_status = 'berhasil' THEN 1 ELSE 0 END), 0) as berhasil_invoices,
        ISNULL(SUM(CASE WHEN invoice_status = 'gagal' THEN 1 ELSE 0 END), 0) as gagal_invoices,
        ISNULL(SUM(CASE WHEN invoice_status = 'berhasil' THEN balance ELSE 0 END), 0) as total_revenue,
        ISNULL(SUM(CASE WHEN CAST(invoice_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END), 0) as today_invoices,
        ISNULL(SUM(CASE WHEN CAST(invoice_date AS DATE) = CAST(GETDATE() AS DATE) AND invoice_status = 'berhasil' THEN balance ELSE 0 END), 0) as today_revenue
      FROM invoices
    `);

    return result.recordset[0];
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    throw error;
  }
};

// Create new invoice
export const createInvoice = async (invoiceData) => {
  try {
    const pool = await poolPromise;
    
    // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(10000 + Math.random() * 90000);
    const invoiceNumber = `INV-${dateStr}-${randomStr}`;
    
    await pool.request()
      .input('invoiceNumber', sql.VarChar(50), invoiceNumber)
      .input('invoiceStatus', sql.VarChar(50), 'berhasil')
      .input('invoiceDate', sql.DateTime, new Date())
      .input('orderNumber', sql.VarChar(50), invoiceData.orderNumber)
      .input('orderTotal', sql.Decimal(18, 2), invoiceData.orderTotal)
      .input('discountCode', sql.VarChar(50), invoiceData.discountCode || null)
      .input('discountPercent', sql.Decimal(5, 2), invoiceData.discountPercent || 0)
      .input('balance', sql.Decimal(18, 2), invoiceData.balance)
      .input('paidBy', sql.VarChar(50), invoiceData.paidBy)
      .input('verifiedBy', sql.Int, invoiceData.verifiedBy)
      .input('mobileEmployee', sql.VarChar(20), invoiceData.mobileEmployee || null)
      .query(`
        INSERT INTO invoices (invoice_number, invoice_status, invoice_date, order_number, order_total, discount_code, discount_percent, balance, paid_by, verified_by, mobile_employee)
        VALUES (@invoiceNumber, @invoiceStatus, @invoiceDate, @orderNumber, @orderTotal, @discountCode, @discountPercent, @balance, @paidBy, @verifiedBy, @mobileEmployee)
      `);
    
    return invoiceNumber;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};
