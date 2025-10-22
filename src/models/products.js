import { getPOSPool } from '../config/dbConnection.js';

// Get all products with category info
export const getAllProducts = async (categoryId = null) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    let query = `
      SELECT 
        p.id,
        p.product_name,
        p.category_id,
        c.category_name,
        p.qty,
        p.supplier,
        p.price,
        p.picture_url,
        p.status,
        p.exp_date,
        p.created_date,
        p.updated_date,
        a.full_name as created_by_name
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN admin a ON p.created_by = a.id
    `;

    if (categoryId) {
      query += ` WHERE p.category_id = @categoryId`;
    }

    query += ` ORDER BY p.created_date DESC`;

    const request = pool.request();
    if (categoryId) {
      request.input('categoryId', categoryId);
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .input('productId', productId)
      .query(`
        SELECT 
          p.*,
          c.category_name,
          a.full_name as created_by_name,
          a2.full_name as updated_by_name
        FROM products p
        LEFT JOIN category c ON p.category_id = c.id
        LEFT JOIN admin a ON p.created_by = a.id
        LEFT JOIN admin a2 ON p.updated_by = a2.id
        WHERE p.id = @productId
      `);

    return result.recordset[0];
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Create new product
export const createProduct = async (productData) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .input('product_name', productData.product_name)
      .input('category_id', productData.category_id)
      .input('qty', productData.qty)
      .input('supplier', productData.supplier)
      .input('price', productData.price)
      .input('picture_url', productData.picture_url)
      .input('created_by', productData.created_by)
      .input('status', productData.status || 'tidak')
      .input('exp_date', productData.exp_date || null)
      .query(`
        INSERT INTO products (
          product_name, category_id, qty, supplier, price, 
          picture_url, created_by, status, exp_date
        )
        OUTPUT INSERTED.*
        VALUES (
          @product_name, @category_id, @qty, @supplier, @price,
          @picture_url, @created_by, @status, @exp_date
        )
      `);

    return result.recordset[0];
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    // Check if price changed - if yes, log to price history
    const currentProduct = await getProductById(productId);
    
    const result = await pool.request()
      .input('productId', productId)
      .input('product_name', productData.product_name)
      .input('category_id', productData.category_id)
      .input('qty', productData.qty)
      .input('supplier', productData.supplier)
      .input('price', productData.price)
      .input('picture_url', productData.picture_url)
      .input('updated_by', productData.updated_by)
      .input('status', productData.status)
      .input('exp_date', productData.exp_date || null)
      .query(`
        UPDATE products
        SET 
          product_name = @product_name,
          category_id = @category_id,
          qty = @qty,
          supplier = @supplier,
          price = @price,
          picture_url = @picture_url,
          updated_by = @updated_by,
          status = @status,
          exp_date = @exp_date,
          updated_date = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @productId
      `);

    // Log price change if price changed
    if (currentProduct && currentProduct.price !== productData.price) {
      await pool.request()
        .input('product_id', productId)
        .input('old_price', currentProduct.price)
        .input('new_price', productData.price)
        .input('changed_by', productData.updated_by)
        .query(`
          INSERT INTO product_price_history (product_id, old_price, new_price, changed_by)
          VALUES (@product_id, @old_price, @new_price, @changed_by)
        `);
    }

    return result.recordset[0];
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    // Get product info first (for file deletion)
    const product = await getProductById(productId);

    // Delete product
    await pool.request()
      .input('productId', productId)
      .query('DELETE FROM products WHERE id = @productId');

    return product;
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Get low stock products
export const getLowStockProducts = async (threshold = 10) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .input('threshold', threshold)
      .query(`
        SELECT 
          p.*,
          c.category_name
        FROM products p
        LEFT JOIN category c ON p.category_id = c.id
        WHERE p.qty <= @threshold
        ORDER BY p.qty ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Get expired products
export const getExpiredProducts = async () => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .query(`
        SELECT 
          p.*,
          c.category_name
        FROM products p
        LEFT JOIN category c ON p.category_id = c.id
        WHERE p.exp_date <= GETDATE() OR p.status = 'kadaluarsa'
        ORDER BY p.exp_date ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error('Error in getExpiredProducts:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Get all categories
export const getAllCategories = async () => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .query('SELECT * FROM category ORDER BY category_name ASC');

    return result.recordset;
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};

// Get price history for a product
export const getPriceHistory = async (productId) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request()
      .input('productId', productId)
      .query(`
        SELECT 
          ph.*,
          a.full_name as changed_by_name
        FROM product_price_history ph
        LEFT JOIN admin a ON ph.changed_by = a.id
        WHERE ph.product_id = @productId
        ORDER BY ph.changed_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error('Error in getPriceHistory:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};
