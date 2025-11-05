import * as categoryModel from "../models/category.js";
import { createAuditLog } from "../utils/auditLogger.js";

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error getting category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "Nama kategori harus diisi",
      });
    }

    const category = await categoryModel.createCategory({ category_name });
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: req.user.userType,
      userName: req.user.fullName,
      entityType: 'category',
      entityId: category.id,
      action: 'CREATE',
      description: `Menambahkan kategori "${category_name}"`,
      newValue: {
        category_name
      }
    });

    res.status(201).json({
      success: true,
      message: "Kategori berhasil ditambahkan",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan kategori",
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "Nama kategori harus diisi",
      });
    }
    
    // Get old data first for audit log
    const oldCategory = await categoryModel.getCategoryById(id);
    
    if (!oldCategory) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const category = await categoryModel.updateCategory(id, { category_name });
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: req.user.userType,
      userName: req.user.fullName,
      entityType: 'category',
      entityId: id,
      action: 'UPDATE',
      description: `Mengupdate kategori "${oldCategory.category_name}" menjadi "${category_name}"`,
      oldValue: {
        category_name: oldCategory.category_name
      },
      newValue: {
        category_name
      }
    });

    res.status(200).json({
      success: true,
      message: "Kategori berhasil diperbarui",
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui kategori",
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await categoryModel.checkCategoryProductCount(id);

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus kategori yang memiliki ${productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`,
      });
    }
    
    // Get old data first for audit log
    const category = await categoryModel.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    await categoryModel.deleteCategory(id);
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: req.user.userType,
      userName: req.user.fullName,
      entityType: 'category',
      entityId: id,
      action: 'DELETE',
      description: `Menghapus kategori "${category.category_name}"`,
      oldValue: {
        category_name: category.category_name
      }
    });

    res.status(200).json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus kategori",
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await categoryModel.getProductsByCategory(id);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error getting products by category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
    });
  }
};

// Get category statistics
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await categoryModel.getCategoryStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting category stats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik kategori",
    });
  }
};
