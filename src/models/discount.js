import { poolPromise } from '../config/dbConnection.js';
import sql from 'mssql';

// Get all discounts
export const getAllDiscounts = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        d.discount_id,
        d.discount_code,
        d.description,
        d.discount_percent,
        d.min_purchase,
        d.max_discount,
        d.start_date,
        d.end_date,
        d.usage_limit,
        d.used_count,
        d.discount_type,
        d.created_date,
        d.updated_date,
        a1.full_name as created_by_name,
        a2.full_name as updated_by_name,
        CASE 
          WHEN GETDATE() < d.start_date THEN 'upcoming'
          WHEN GETDATE() > d.end_date THEN 'expired'
          WHEN d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit THEN 'limit_reached'
          ELSE 'active'
        END as status
      FROM discount d
      LEFT JOIN admin a1 ON d.created_by = a1.id
      LEFT JOIN admin a2 ON d.updated_by = a2.id
      ORDER BY d.created_date DESC
    `);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

// Get discount by ID
export const getDiscountById = async (discountId) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('discountId', sql.Int, discountId)
      .query(`
        SELECT 
          d.discount_id,
          d.discount_code,
          d.description,
          d.discount_percent,
          d.min_purchase,
          d.max_discount,
          d.start_date,
          d.end_date,
          d.usage_limit,
          d.used_count,
          d.discount_type,
          d.created_date,
          d.updated_date,
          a1.full_name as created_by_name,
          a2.full_name as updated_by_name,
          CASE 
            WHEN GETDATE() < d.start_date THEN 'upcoming'
            WHEN GETDATE() > d.end_date THEN 'expired'
            WHEN d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit THEN 'limit_reached'
            ELSE 'active'
          END as status
        FROM discount d
        LEFT JOIN admin a1 ON d.created_by = a1.id
        LEFT JOIN admin a2 ON d.updated_by = a2.id
        WHERE d.discount_id = @discountId
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Get discount by code
export const getDiscountByCode = async (discountCode) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('discountCode', sql.VarChar(50), discountCode)
      .query(`
        SELECT 
          d.discount_id,
          d.discount_code,
          d.description,
          d.discount_percent,
          d.min_purchase,
          d.max_discount,
          d.start_date,
          d.end_date,
          d.usage_limit,
          d.used_count,
          d.discount_type,
          CASE 
            WHEN GETDATE() < d.start_date THEN 'upcoming'
            WHEN GETDATE() > d.end_date THEN 'expired'
            WHEN d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit THEN 'limit_reached'
            ELSE 'active'
          END as status
        FROM discount d
        WHERE d.discount_code = @discountCode
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Create discount
export const createDiscount = async (discountData, adminId) => {
  try {
    const pool = await poolPromise;
    
    // Convert discount value to appropriate number format
    const discountValue = parseFloat(discountData.discount_percent);
    
    const result = await pool.request()
      .input('discount_code', sql.VarChar(50), discountData.discount_code)
      .input('description', sql.Text, discountData.description || null)
      .input('discount_percent', sql.Decimal(18, 2), discountValue)
      .input('min_purchase', sql.Decimal(18, 0), parseInt(discountData.min_purchase) || 0)
      .input('max_discount', sql.Decimal(18, 0), discountData.max_discount ? parseInt(discountData.max_discount) : null)
      .input('start_date', sql.Date, discountData.start_date)
      .input('end_date', sql.Date, discountData.end_date)
      .input('usage_limit', sql.Int, discountData.usage_limit || null)
      .input('discount_type', sql.VarChar(20), discountData.discount_type || 'percentage')
      .input('created_by', sql.Int, adminId)
      .query(`
        INSERT INTO discount (
          discount_code, description, discount_percent, min_purchase, max_discount,
          start_date, end_date, usage_limit, discount_type, created_by
        )
        OUTPUT INSERTED.discount_id
        VALUES (
          @discount_code, @description, @discount_percent, @min_purchase, @max_discount,
          @start_date, @end_date, @usage_limit, @discount_type, @created_by
        )
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Update discount
export const updateDiscount = async (discountId, discountData, adminId) => {
  try {
    const pool = await poolPromise;
    
    // Convert discount value to appropriate number format
    const discountValue = parseFloat(discountData.discount_percent);
    
    await pool.request()
      .input('discountId', sql.Int, discountId)
      .input('discount_code', sql.VarChar(50), discountData.discount_code)
      .input('description', sql.Text, discountData.description || null)
      .input('discount_percent', sql.Decimal(18, 2), discountValue)
      .input('min_purchase', sql.Decimal(18, 0), parseInt(discountData.min_purchase) || 0)
      .input('max_discount', sql.Decimal(18, 0), discountData.max_discount ? parseInt(discountData.max_discount) : null)
      .input('start_date', sql.Date, discountData.start_date)
      .input('end_date', sql.Date, discountData.end_date)
      .input('usage_limit', sql.Int, discountData.usage_limit || null)
      .input('discount_type', sql.VarChar(20), discountData.discount_type || 'percentage')
      .input('updated_by', sql.Int, adminId)
      .query(`
        UPDATE discount
        SET 
          discount_code = @discount_code,
          description = @description,
          discount_percent = @discount_percent,
          min_purchase = @min_purchase,
          max_discount = @max_discount,
          start_date = @start_date,
          end_date = @end_date,
          usage_limit = @usage_limit,
          discount_type = @discount_type,
          updated_by = @updated_by,
          updated_date = GETDATE()
        WHERE discount_id = @discountId
      `);
    return { discount_id: discountId };
  } catch (error) {
    throw error;
  }
};

// Delete discount
export const deleteDiscount = async (discountId) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('discountId', sql.Int, discountId)
      .query('DELETE FROM discount WHERE discount_id = @discountId');
    return { discount_id: discountId };
  } catch (error) {
    throw error;
  }
};

// Get discount statistics
export const getDiscountStats = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        ISNULL(COUNT(*), 0) as total_discounts,
        ISNULL(SUM(CASE 
          WHEN GETDATE() BETWEEN start_date AND end_date 
          AND (usage_limit IS NULL OR used_count < usage_limit)
          THEN 1 ELSE 0 
        END), 0) as active_discounts,
        ISNULL(SUM(CASE WHEN GETDATE() > end_date THEN 1 ELSE 0 END), 0) as expired_discounts,
        ISNULL(SUM(CASE 
          WHEN usage_limit IS NOT NULL AND used_count >= usage_limit 
          THEN 1 ELSE 0 
        END), 0) as limit_reached,
        ISNULL(SUM(used_count), 0) as total_usage
      FROM discount
    `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Validate discount for use
export const validateDiscount = async (discountCode, purchaseAmount) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('discountCode', sql.VarChar(50), discountCode)
      .input('purchaseAmount', sql.Decimal(18, 0), purchaseAmount)
      .query(`
        SELECT 
          d.discount_id,
          d.discount_code,
          d.discount_percent,
          d.discount_type,
          d.min_purchase,
          d.max_discount,
          d.usage_limit,
          d.used_count,
          CASE 
            WHEN GETDATE() < d.start_date THEN 'not_started'
            WHEN GETDATE() > d.end_date THEN 'expired'
            WHEN d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit THEN 'limit_reached'
            WHEN @purchaseAmount < d.min_purchase THEN 'min_purchase_not_met'
            ELSE 'valid'
          END as validation_status
        FROM discount d
        WHERE d.discount_code = @discountCode
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

// Increment usage count
export const incrementUsageCount = async (discountId) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('discountId', sql.Int, discountId)
      .query(`
        UPDATE discount
        SET used_count = used_count + 1
        WHERE discount_id = @discountId
      `);
    return { discount_id: discountId };
  } catch (error) {
    throw error;
  }
};
