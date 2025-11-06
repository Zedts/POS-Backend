import { poolPromise } from '../config/dbConnection.js';
import sql from 'mssql';

// Get all students with filters and transaction statistics
export const getAllStudents = async (filters = {}) => {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        s.id,
        s.nisn,
        s.username,
        s.full_name,
        s.phone,
        CAST(s.address AS VARCHAR(MAX)) as address,
        s.class,
        s.major,
        s.is_active,
        s.created_date,
        s.updated_date,
        ISNULL(COUNT(DISTINCT o.order_number), 0) as total_transactions,
        ISNULL(SUM(o.order_total), 0) as total_revenue
      FROM student s
      LEFT JOIN orders o ON s.id = o.employee_id
      WHERE 1=1
    `;

    const params = [];

    // Filter by class
    if (filters.class) {
      query += ` AND s.class = @class`;
      params.push({ name: 'class', type: sql.VarChar, value: filters.class });
    }

    // Filter by major
    if (filters.major) {
      query += ` AND s.major = @major`;
      params.push({ name: 'major', type: sql.VarChar, value: filters.major });
    }

    // Filter by status
    if (filters.status !== undefined && filters.status !== '') {
      const isActive = filters.status === 'active' ? 1 : 0;
      query += ` AND s.is_active = @status`;
      params.push({ name: 'status', type: sql.Bit, value: isActive });
    }

    // Search by name or NISN
    if (filters.search) {
      query += ` AND (s.full_name LIKE @search OR s.nisn LIKE @search)`;
      params.push({ name: 'search', type: sql.VarChar, value: `%${filters.search}%` });
    }

    query += `
      GROUP BY s.id, s.nisn, s.username, s.full_name, s.phone, CAST(s.address AS VARCHAR(MAX)), s.class, s.major, s.is_active, s.created_date, s.updated_date
      ORDER BY s.created_date DESC
    `;

    let request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    throw error;
  }
};

// Get student by ID with detailed statistics
export const getStudentById = async (id) => {
  try {
    const pool = await poolPromise;
    
    // Get student info
    const studentQuery = `
      SELECT 
        id,
        nisn,
        username,
        full_name,
        phone,
        CAST(address AS VARCHAR(MAX)) as address,
        class,
        major,
        is_active,
        created_date,
        updated_date
      FROM student
      WHERE id = @id
    `;
    
    const studentResult = await pool.request()
      .input('id', sql.Int, id)
      .query(studentQuery);
    
    if (studentResult.recordset.length === 0) {
      return null;
    }

    const student = studentResult.recordset[0];

    // Get statistics
    const statsQuery = `
      SELECT 
        ISNULL(COUNT(DISTINCT o.order_number), 0) as total_transactions,
        ISNULL(SUM(o.order_total), 0) as total_revenue,
        ISNULL(COUNT(DISTINCT CASE WHEN CAST(o.order_date AS DATE) = CAST(GETDATE() AS DATE) THEN o.order_number END), 0) as today_transactions,
        ISNULL(SUM(CASE WHEN CAST(o.order_date AS DATE) = CAST(GETDATE() AS DATE) THEN o.order_total ELSE 0 END), 0) as today_revenue,
        ISNULL(COUNT(DISTINCT CASE WHEN YEAR(o.order_date) = YEAR(GETDATE()) AND MONTH(o.order_date) = MONTH(GETDATE()) THEN o.order_number END), 0) as month_transactions,
        ISNULL(SUM(CASE WHEN YEAR(o.order_date) = YEAR(GETDATE()) AND MONTH(o.order_date) = MONTH(GETDATE()) THEN o.order_total ELSE 0 END), 0) as month_revenue
      FROM orders o
      WHERE o.employee_id = @id
    `;

    const statsResult = await pool.request()
      .input('id', sql.Int, id)
      .query(statsQuery);

    return {
      ...student,
      statistics: statsResult.recordset[0]
    };
  } catch (error) {
    console.error('Error in getStudentById:', error);
    throw error;
  }
};

// Get student transactions
export const getStudentTransactions = async (id) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        o.order_number,
        o.order_date,
        o.order_total,
        o.status as order_status,
        o.discount_code,
        i.invoice_status,
        i.paid_by
      FROM orders o
      LEFT JOIN invoices i ON o.order_number = i.order_number
      WHERE o.employee_id = @id
      ORDER BY o.order_date DESC
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    return result.recordset;
  } catch (error) {
    console.error('Error in getStudentTransactions:', error);
    throw error;
  }
};

// Get student statistics for dashboard cards
export const getStudentStats = async () => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_students,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_students,
        ISNULL((
          SELECT COUNT(DISTINCT o.order_number)
          FROM orders o
          WHERE CAST(o.order_date AS DATE) = CAST(GETDATE() AS DATE)
        ), 0) as today_transactions,
        ISNULL((
          SELECT SUM(o.order_total)
          FROM orders o
          WHERE CAST(o.order_date AS DATE) = CAST(GETDATE() AS DATE)
        ), 0) as today_revenue,
        ISNULL((
          SELECT COUNT(DISTINCT o.order_number)
          FROM orders o
          WHERE YEAR(o.order_date) = YEAR(GETDATE()) AND MONTH(o.order_date) = MONTH(GETDATE())
        ), 0) as month_transactions
      FROM student
    `;

    const result = await pool.request().query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    throw error;
  }
};

// Update student profile
export const updateStudent = async (id, studentData) => {
  try {
    const pool = await poolPromise;
    const query = `
      UPDATE student
      SET 
        full_name = @fullName,
        phone = @phone,
        address = @address,
        updated_date = GETDATE()
      WHERE id = @id
    `;

    await pool.request()
      .input('id', sql.Int, id)
      .input('fullName', sql.VarChar, studentData.full_name)
      .input('phone', sql.VarChar, studentData.phone)
      .input('address', sql.Text, studentData.address)
      .query(query);

    return { success: true };
  } catch (error) {
    console.error('Error in updateStudent:', error);
    throw error;
  }
};

// Toggle student status
export const toggleStudentStatus = async (id) => {
  try {
    const pool = await poolPromise;
    const query = `
      UPDATE student
      SET 
        is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
        updated_date = GETDATE()
      WHERE id = @id
    `;

    await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    return { success: true };
  } catch (error) {
    console.error('Error in toggleStudentStatus:', error);
    throw error;
  }
};

// Update student password with old password verification
export const updateStudentPassword = async (id, oldPassword, newPassword) => {
  try {
    const pool = await poolPromise;
    
    // Verify old password (MD5 hash)
    const verifyQuery = `
      SELECT id FROM student
      WHERE id = @id AND password_hash = @oldPasswordHash
    `;
    
    const verifyResult = await pool.request()
      .input('id', sql.Int, id)
      .input('oldPasswordHash', sql.VarChar, oldPassword)
      .query(verifyQuery);
    
    if (verifyResult.recordset.length === 0) {
      return { success: false, message: 'Password lama tidak sesuai' };
    }
    
    // Update password
    const updateQuery = `
      UPDATE student
      SET 
        password_hash = @newPasswordHash,
        updated_date = GETDATE()
      WHERE id = @id
    `;
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('newPasswordHash', sql.VarChar, newPassword)
      .query(updateQuery);
    
    return { success: true, message: 'Password berhasil diubah' };
  } catch (error) {
    console.error('Error in updateStudentPassword:', error);
    throw error;
  }
};
