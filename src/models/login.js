import { connectDBPOSSequelize } from "../config/dbConnection.js";
import { QueryTypes } from "sequelize";

// Login - Check Admin
export const loginAdmin = async (username, passwordHash) => {
  try {
    const query = `
      SELECT id, username, full_name, created_date, updated_date
      FROM admin
      WHERE username = :username AND password_hash = :passwordHash
    `;
    
    const result = await connectDBPOSSequelize.query(query, {
      replacements: { username, passwordHash },
      type: QueryTypes.SELECT,
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw error;
  }
};

// Login - Check Student
export const loginStudent = async (username, passwordHash) => {
  try {
    const query = `
      SELECT id, nisn, username, full_name, phone, address, class, major, is_active, created_date, updated_date
      FROM student
      WHERE username = :username AND password_hash = :passwordHash AND is_active = 1
    `;
    
    const result = await connectDBPOSSequelize.query(query, {
      replacements: { username, passwordHash },
      type: QueryTypes.SELECT,
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw error;
  }
};

// Register - Student Only
export const registerStudent = async (studentData) => {
  try {
    const { nisn, username, passwordHash, fullName, phone, address, studentClass, major } = studentData;
    
    // Check if username already exists
    const checkUsername = `
      SELECT username FROM student WHERE username = :username
      UNION
      SELECT username FROM admin WHERE username = :username
    `;
    
    const existingUser = await connectDBPOSSequelize.query(checkUsername, {
      replacements: { username },
      type: QueryTypes.SELECT,
    });

    if (existingUser.length > 0) {
      return { success: false, message: "Username sudah digunakan" };
    }

    // Check if NISN already exists
    const checkNISN = `
      SELECT nisn FROM student WHERE nisn = :nisn
    `;
    
    const existingNISN = await connectDBPOSSequelize.query(checkNISN, {
      replacements: { nisn },
      type: QueryTypes.SELECT,
    });

    if (existingNISN.length > 0) {
      return { success: false, message: "NISN sudah terdaftar" };
    }

    // Insert new student
    const insertQuery = `
      INSERT INTO student (nisn, username, password_hash, full_name, phone, address, class, major)
      VALUES (:nisn, :username, :passwordHash, :fullName, :phone, :address, :studentClass, :major)
    `;
    
    await connectDBPOSSequelize.query(insertQuery, {
      replacements: { nisn, username, passwordHash, fullName, phone, address, studentClass, major },
      type: QueryTypes.INSERT,
    });

    return { success: true, message: "Registrasi berhasil" };
  } catch (error) {
    throw error;
  }
};
