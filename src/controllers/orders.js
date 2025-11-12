import * as orderModel from '../models/orders.js';
import { createAuditLog } from '../utils/auditLogger.js';

// Get all orders with optional filters
export const getOrders = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      employeeName: req.query.employeeName,
      status: req.query.status
    };

    const orders = await orderModel.getAllOrders(filters);
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data order'
    });
  }
};

// Get order by order_number with details
export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await orderModel.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    const details = await orderModel.getOrderDetails(orderNumber);

    res.json({
      success: true,
      data: {
        ...order,
        items: details
      }
    });
  } catch (error) {
    console.error('Error getting order by number:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail order'
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const stats = await orderModel.getOrderStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik order'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'complete', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid. Gunakan: pending, complete, atau refunded'
      });
    }

    const order = await orderModel.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan'
      });
    }

    await orderModel.updateOrderStatus(orderNumber, status);
    res.json({
      success: true,
      message: 'Status order berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status order'
    });
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { orderData, orderItems } = req.body;

    // Validation
    if (!orderData || !orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data order tidak lengkap'
      });
    }

    if (!orderData.employeeId || !orderData.orderTotal || !orderData.balance) {
      return res.status(400).json({
        success: false,
        message: 'Data order tidak valid'
      });
    }

    // Validasi customer_id WAJIB DIISI
    if (!orderData.customerId) {
      return res.status(400).json({
        success: false,
        message: 'Mohon pilih customer terlebih dahulu'
      });
    }

    // Create order
    const orderNumber = await orderModel.createOrder(orderData, orderItems);
    
    // Create audit log for employee order creation
    await createAuditLog({
      userId: orderData.employeeId,
      userType: 'student',
      userName: req.user?.username || req.user?.full_name || 'Employee',
      entityType: 'order',
      entityId: orderNumber,
      action: 'CREATE',
      description: `Membuat order baru: ${orderNumber} dengan ${orderItems.length} item untuk customer ID: ${orderData.customerId}`,
      newValue: {
        orderNumber,
        orderTotal: orderData.orderTotal,
        balance: orderData.balance,
        itemCount: orderItems.length,
        discountCode: orderData.discountCode || null,
        customerId: orderData.customerId
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.json({
      success: true,
      message: 'Order berhasil dibuat',
      data: { orderNumber }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat order'
    });
  }
};
