import * as StudentsModel from '../models/students.js';
import { createAuditLog } from '../utils/auditLogger.js';

// Get all students with filters
export const getStudents = async (req, res) => {
  try {
    const filters = {
      class: req.query.class,
      major: req.query.major,
      status: req.query.status,
      search: req.query.search
    };

    const students = await StudentsModel.getAllStudents(filters);
    res.json(students);
  } catch (error) {
    console.error('Error in getStudents:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Get student by ID with statistics
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentsModel.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

// Get student transactions
export const getStudentTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await StudentsModel.getStudentTransactions(id);
    res.json(transactions);
  } catch (error) {
    console.error('Error in getStudentTransactions:', error);
    res.status(500).json({ error: 'Failed to fetch student transactions' });
  }
};

// Get student statistics
export const getStudentStats = async (req, res) => {
  try {
    const stats = await StudentsModel.getStudentStats();
    res.json(stats);
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
};

// Update student profile
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = req.body;

    // Get existing data for audit log
    const existingStudent = await StudentsModel.getStudentById(id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await StudentsModel.updateStudent(id, studentData);
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'student',
      entityId: id,
      action: 'UPDATE',
      description: `Mengupdate data student: ${studentData.full_name || existingStudent.full_name}`,
      oldValue: {
        full_name: existingStudent.full_name,
        phone: existingStudent.phone,
        address: existingStudent.address,
        class: existingStudent.class,
        major: existingStudent.major
      },
      newValue: {
        full_name: studentData.full_name,
        phone: studentData.phone,
        address: studentData.address,
        class: studentData.class,
        major: studentData.major
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error in updateStudent:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// Toggle student status
export const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get existing data for audit log
    const existingStudent = await StudentsModel.getStudentById(id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await StudentsModel.toggleStudentStatus(id);
    
    const newStatus = existingStudent.is_active === 1 ? 0 : 1;
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'student',
      entityId: id,
      action: 'UPDATE',
      description: `Mengubah status student ${existingStudent.full_name}: ${existingStudent.is_active === 1 ? 'Aktif' : 'Nonaktif'} → ${newStatus === 1 ? 'Aktif' : 'Nonaktif'}`,
      oldValue: { is_active: existingStudent.is_active },
      newValue: { is_active: newStatus },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.json({ message: 'Student status toggled successfully' });
  } catch (error) {
    console.error('Error in toggleStudentStatus:', error);
    res.status(500).json({ error: 'Failed to toggle student status' });
  }
};

// Update student password
export const updateStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }
    
    const result = await StudentsModel.updateStudentPassword(id, oldPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error in updateStudentPassword:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};
