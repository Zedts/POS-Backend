import * as discountModel from '../models/discount.js';
import { createAuditLog } from '../utils/auditLogger.js';

// Get all discounts
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await discountModel.getAllDiscounts();
    res.json({
      success: true,
      data: discounts
    });
  } catch (error) {
    console.error('Error getting discounts:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data diskon'
    });
  }
};

// Get discount by ID
export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await discountModel.getDiscountById(id);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Diskon tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: discount
    });
  } catch (error) {
    console.error('Error getting discount by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data diskon'
    });
  }
};

// Create discount
export const createDiscount = async (req, res) => {
  try {
    const adminId = req.user.id; // From auth middleware
    
    // Validation
    const { discount_code, discount_percent, start_date, end_date, discount_type } = req.body;
    
    if (!discount_code || !discount_percent || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Kode diskon, persentase/nilai, tanggal mulai, dan tanggal berakhir harus diisi'
      });
    }

    // Check if discount code already exists
    const existingDiscount = await discountModel.getDiscountByCode(discount_code);
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Kode diskon sudah digunakan'
      });
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal berakhir harus setelah tanggal mulai'
      });
    }

    // Validate discount percent/value based on type
    if (discount_type === 'percentage' && (discount_percent < 0 || discount_percent > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Persentase diskon harus antara 0-100'
      });
    }

    if (discount_type === 'fixed' && discount_percent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nilai diskon harus lebih dari 0'
      });
    }

    const result = await discountModel.createDiscount(req.body, adminId);
    
    // Create audit log
    await createAuditLog({
      userId: adminId,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'discount',
      entityId: result.discount_id,
      action: 'CREATE',
      description: `Membuat diskon baru: ${discount_code}`,
      newValue: {
        discount_code,
        discount_percent,
        discount_type,
        start_date,
        end_date
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.status(201).json({
      success: true,
      message: 'Diskon berhasil ditambahkan',
      data: result
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan diskon'
    });
  }
};

// Update discount
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // From auth middleware

    // Check if discount exists
    const existingDiscount = await discountModel.getDiscountById(id);
    if (!existingDiscount) {
      return res.status(404).json({
        success: false,
        message: 'Diskon tidak ditemukan'
      });
    }

    // Validation
    const { discount_code, discount_percent, start_date, end_date, discount_type } = req.body;
    
    if (!discount_code || !discount_percent || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Kode diskon, persentase/nilai, tanggal mulai, dan tanggal berakhir harus diisi'
      });
    }

    // Check if discount code is used by another discount
    if (discount_code !== existingDiscount.discount_code) {
      const codeCheck = await discountModel.getDiscountByCode(discount_code);
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: 'Kode diskon sudah digunakan'
        });
      }
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal berakhir harus setelah tanggal mulai'
      });
    }

    // Validate discount percent/value based on type
    if (discount_type === 'percentage' && (discount_percent < 0 || discount_percent > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Persentase diskon harus antara 0-100'
      });
    }

    if (discount_type === 'fixed' && discount_percent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nilai diskon harus lebih dari 0'
      });
    }

    await discountModel.updateDiscount(id, req.body, adminId);
    
    // Create audit log
    await createAuditLog({
      userId: adminId,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'discount',
      entityId: id,
      action: 'UPDATE',
      description: `Mengupdate diskon: ${discount_code}`,
      oldValue: {
        discount_code: existingDiscount.discount_code,
        discount_percent: existingDiscount.discount_percent,
        discount_type: existingDiscount.discount_type,
        start_date: existingDiscount.start_date,
        end_date: existingDiscount.end_date
      },
      newValue: {
        discount_code,
        discount_percent,
        discount_type,
        start_date,
        end_date
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.json({
      success: true,
      message: 'Diskon berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui diskon'
    });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if discount exists
    const existingDiscount = await discountModel.getDiscountById(id);
    if (!existingDiscount) {
      return res.status(404).json({
        success: false,
        message: 'Diskon tidak ditemukan'
      });
    }

    await discountModel.deleteDiscount(id);
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'discount',
      entityId: id,
      action: 'DELETE',
      description: `Menghapus diskon: ${existingDiscount.discount_code}`,
      oldValue: {
        discount_code: existingDiscount.discount_code,
        discount_percent: existingDiscount.discount_percent,
        discount_type: existingDiscount.discount_type
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.json({
      success: true,
      message: 'Diskon berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus diskon'
    });
  }
};

// Get discount statistics
export const getDiscountStats = async (req, res) => {
  try {
    const stats = await discountModel.getDiscountStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting discount stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik diskon'
    });
  }
};

// Validate discount code
export const validateDiscountCode = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Kode diskon dan jumlah pembelian harus diisi'
      });
    }

    const validation = await discountModel.validateDiscount(code, amount);

    if (!validation) {
      return res.status(404).json({
        success: false,
        message: 'Kode diskon tidak ditemukan'
      });
    }

    if (validation.validation_status !== 'valid') {
      let errorMessage = '';
      switch (validation.validation_status) {
        case 'not_started':
          errorMessage = 'Diskon belum berlaku';
          break;
        case 'expired':
          errorMessage = 'Diskon sudah kadaluarsa';
          break;
        case 'limit_reached':
          errorMessage = 'Batas penggunaan diskon telah tercapai';
          break;
        case 'min_purchase_not_met':
          errorMessage = `Minimum pembelian Rp ${validation.min_purchase.toLocaleString('id-ID')}`;
          break;
        default:
          errorMessage = 'Diskon tidak valid';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (validation.discount_type === 'percentage') {
      discountAmount = (amount * validation.discount_percent) / 100;
      if (validation.max_discount && discountAmount > validation.max_discount) {
        discountAmount = validation.max_discount;
      }
    } else {
      discountAmount = validation.discount_percent;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        discount_id: validation.discount_id,
        discount_code: validation.discount_code,
        discount_amount: discountAmount,
        final_amount: amount - discountAmount,
        discount: {
          discount_id: validation.discount_id,
          discount_code: validation.discount_code,
          discount_percent: validation.discount_percent,
          discount_type: validation.discount_type,
          min_purchase: validation.min_purchase,
          max_discount: validation.max_discount,
          description: validation.description || ''
        }
      }
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi diskon'
    });
  }
};
