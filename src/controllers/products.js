import * as productsModel from '../models/products.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const products = await productsModel.getAllProducts(categoryId);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error in getProducts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk',
      error: error.message
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productsModel.getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk',
      error: error.message
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      created_by: req.user.id // from JWT token
    };

    const newProduct = await productsModel.createProduct(productData);
    
    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: newProduct
    });
  } catch (error) {
    console.error('Error in createProduct controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk',
      error: error.message
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = {
      ...req.body,
      updated_by: req.user.id // from JWT token
    };

    const updatedProduct = await productsModel.updateProduct(id, productData);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Produk berhasil diupdate',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error in updateProduct controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate produk',
      error: error.message
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await productsModel.deleteProduct(id);
    
    // Delete image file if exists and is local file
    if (product && product.picture_url && !product.picture_url.startsWith('http')) {
      const uploadsDir = path.join(__dirname, '../../../uploads');
      const filePath = path.join(uploadsDir, product.picture_url);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Produk berhasil dihapus'
    });
  } catch (error) {
    console.error('Error in deleteProduct controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk',
      error: error.message
    });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await productsModel.getAllCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getCategories controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori',
      error: error.message
    });
  }
};

// Get low stock products
export const getLowStock = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await productsModel.getLowStockProducts(threshold);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error in getLowStock controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data stok menipis',
      error: error.message
    });
  }
};

// Get expired products
export const getExpired = async (req, res) => {
  try {
    const products = await productsModel.getExpiredProducts();
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error in getExpired controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk kadaluarsa',
      error: error.message
    });
  }
};

// Get price history
export const getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await productsModel.getPriceHistory(id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error in getPriceHistory controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat harga',
      error: error.message
    });
  }
};

// Upload image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const fileName = req.file.filename;
    const fileUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      message: 'File berhasil diupload',
      data: {
        fileName,
        fileUrl
      }
    });
  } catch (error) {
    console.error('Error in uploadImage controller:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload file',
      error: error.message
    });
  }
};
