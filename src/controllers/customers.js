import Customer from "../models/customers.js";
import { connectDBPOS } from "../config/dbConnection.js";
import crypto from "crypto";
import { createAuditLog } from "../utils/auditLogger.js";
import { Op } from "sequelize";

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: { exclude: ["password_hash"] },
      order: [["created_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};

// Register new customer
export const createCustomer = async (req, res) => {
  try {
    const { nisn, username, password, fullName, phone, address, studentClass, major } = req.body;

    // Validation
    if (!nisn || !username || !password || !fullName || !studentClass || !major) {
      return res.status(400).json({
        success: false,
        message: "NISN, username, password, full name, class, and major are required",
      });
    }

    // Check if username or NISN already exists
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [{ username }, { nisn }],
      },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Username or NISN already exists",
      });
    }

    // Hash password using MD5
    const passwordHash = crypto.createHash("md5").update(password).digest("hex");

    // Create customer
    const customer = await Customer.create({
      nisn,
      username,
      password_hash: passwordHash,
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      class: studentClass,
      major,
    });

    // Log audit
    await createAuditLog({
      userId: customer.id,
      userType: "customer",
      userName: customer.full_name,
      entityType: "customer",
      entityId: customer.id.toString(),
      action: "CREATE",
      description: `Customer registered: ${customer.username}`,
      newValue: JSON.stringify({
        nisn: customer.nisn,
        username: customer.username,
        full_name: customer.full_name,
        class: customer.class,
        major: customer.major,
      }),
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        id: customer.id,
        nisn: customer.nisn,
        username: customer.username,
        full_name: customer.full_name,
        phone: customer.phone,
        address: customer.address,
        class: customer.class,
        major: customer.major,
      },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register customer",
      error: error.message,
    });
  }
};

// Update customer profile
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, phone, address, studentClass, major, currentPassword, newPassword } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const oldValue = {
      username: customer.username,
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      class: customer.class,
      major: customer.major,
    };

    // Update basic info
    if (username) customer.username = username;
    if (fullName) customer.full_name = fullName;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (studentClass) customer.class = studentClass;
    if (major) customer.major = major;

    // Update password if provided
    if (currentPassword && newPassword) {
      const currentPasswordHash = crypto.createHash("md5").update(currentPassword).digest("hex");

      if (customer.password_hash !== currentPasswordHash) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const newPasswordHash = crypto.createHash("md5").update(newPassword).digest("hex");
      customer.password_hash = newPasswordHash;
    }

    customer.updated_date = new Date();
    await customer.save();

    const newValue = {
      username: customer.username,
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      class: customer.class,
      major: customer.major,
    };

    // Log audit
    await createAuditLog({
      userId: customer.id,
      userType: "customer",
      userName: customer.full_name,
      entityType: "customer",
      entityId: customer.id.toString(),
      action: "UPDATE",
      description: `Customer profile updated: ${customer.username}`,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(newValue),
    });

    res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      data: {
        id: customer.id,
        nisn: customer.nisn,
        username: customer.username,
        full_name: customer.full_name,
        phone: customer.phone,
        address: customer.address,
        class: customer.class,
        major: customer.major,
      },
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
};

// Search customers by name (for autocomplete)
export const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const customers = await Customer.findAll({
      where: {
        full_name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "nisn", "username", "full_name", "phone", "class", "major"],
      limit: 10,
      order: [["full_name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search customers",
      error: error.message,
    });
  }
};

// Get customer order history
export const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        o.order_number,
        o.order_date,
        o.order_total,
        o.balance,
        o.status,
        o.discount_code,
        s.full_name as employee_name,
        i.invoice_number,
        i.invoice_status,
        i.paid_by,
        (
          SELECT COUNT(*) 
          FROM order_details od 
          WHERE od.order_number = o.order_number
        ) as total_items
      FROM orders o
      LEFT JOIN student s ON o.employee_id = s.id
      LEFT JOIN invoices i ON o.order_number = i.order_number
      WHERE o.customer_id = ${id}
      ORDER BY o.order_date DESC
    `;

    const result = await connectDBPOS(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: error.message,
    });
  }
};

// Get customer order details
export const getCustomerOrderDetails = async (req, res) => {
  try {
    const { id, orderNumber } = req.params;

    const query = `
      SELECT 
        od.*,
        p.product_name,
        p.picture_url
      FROM order_details od
      LEFT JOIN products p ON od.product_id = p.id
      WHERE od.order_number = '${orderNumber}'
      AND EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.order_number = '${orderNumber}' 
        AND o.customer_id = ${id}
      )
      ORDER BY od.id
    `;

    const result = await connectDBPOS(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

// Get top 5 selling products
export const getTopSellingProducts = async (req, res) => {
  try {
    const query = `
      SELECT TOP 5
        p.id,
        p.product_name,
        p.price,
        p.picture_url,
        c.category_name,
        SUM(od.qty_product) as total_sold
      FROM order_details od
      INNER JOIN products p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE od.status = 'complete'
      GROUP BY p.id, p.product_name, p.price, p.picture_url, c.category_name
      ORDER BY total_sold DESC
    `;

    const result = await connectDBPOS(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top selling products",
      error: error.message,
    });
  }
};

// Get active discounts
export const getActiveDiscounts = async (req, res) => {
  try {
    const query = `
      SELECT 
        discount_id,
        discount_code,
        description,
        discount_percent,
        min_purchase,
        max_discount,
        start_date,
        end_date,
        usage_limit,
        used_count,
        discount_type
      FROM discount
      WHERE GETDATE() BETWEEN start_date AND end_date
      AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY created_date DESC
    `;

    const result = await connectDBPOS(query);

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching active discounts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active discounts",
      error: error.message,
    });
  }
};
