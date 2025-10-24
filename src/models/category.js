import { DataTypes } from "sequelize";
import { connectDBPOSSequelize, getPOSPool } from "../config/dbConnection.js";

const Category = connectDBPOSSequelize.define(
  "category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "category",
    timestamps: false,
  }
);

// Get all categories
export const getAllCategories = async () => {
  try {
    const categories = await Category.findAll({
      order: [["category_name", "ASC"]],
    });
    return categories;
  } catch (error) {
    console.error("Error in getAllCategories model:", error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const category = await Category.findByPk(categoryId);
    return category;
  } catch (error) {
    console.error("Error in getCategoryById model:", error);
    throw error;
  }
};

// Create new category
export const createCategory = async (categoryData) => {
  try {
    const category = await Category.create({
      category_name: categoryData.category_name,
    });
    return category;
  } catch (error) {
    console.error("Error in createCategory model:", error);
    throw error;
  }
};

// Update category
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return null;
    }

    await category.update({
      category_name: categoryData.category_name,
    });

    return category;
  } catch (error) {
    console.error("Error in updateCategory model:", error);
    throw error;
  }
};

// Check product count for category
export const checkCategoryProductCount = async (categoryId) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool
      .request()
      .input("categoryId", categoryId)
      .query(`
        SELECT COUNT(*) as product_count 
        FROM products 
        WHERE category_id = @categoryId
      `);

    return result.recordset[0].product_count;
  } catch (error) {
    console.error("Error in checkCategoryProductCount model:", error);
    throw error;
  } finally {
    if (pool) pool.close();
  }
};

// Delete category
export const deleteCategory = async (categoryId) => {
  try {
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return null;
    }

    await category.destroy();
    return category;
  } catch (error) {
    console.error("Error in deleteCategory model:", error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (categoryId) => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool
      .request()
      .input("categoryId", categoryId)
      .query(`
        SELECT 
          p.id,
          p.product_name,
          p.qty,
          p.price,
          p.supplier,
          p.picture_url,
          p.status,
          p.exp_date,
          c.category_name
        FROM products p
        INNER JOIN category c ON p.category_id = c.id
        WHERE p.category_id = @categoryId
        ORDER BY p.product_name ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error in getProductsByCategory model:", error);
    throw error;
  } finally {
    if (pool) pool.close();
  }
};

// Get category statistics
export const getCategoryStats = async () => {
  let pool;
  try {
    pool = getPOSPool();
    await pool.connect();

    const result = await pool.request().query(`
      SELECT 
        c.id,
        c.category_name,
        COUNT(p.id) as product_count,
        ISNULL(SUM(p.qty), 0) as total_stock,
        ISNULL(AVG(p.price), 0) as avg_price,
        ISNULL(MIN(p.price), 0) as min_price,
        ISNULL(MAX(p.price), 0) as max_price
      FROM category c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.category_name
      ORDER BY c.category_name ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Error in getCategoryStats model:", error);
    throw error;
  } finally {
    if (pool) pool.close();
  }
};

export default Category;
