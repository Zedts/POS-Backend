import crypto from "crypto";
import jwt from "jsonwebtoken";
import { loginAdmin, loginStudent, registerStudent } from "../models/login.js";

// MD5 Hash Function
const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

// Generate JWT Token (8 hours)
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password harus diisi",
      });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Check Admin first
    const admin = await loginAdmin(username, passwordHash);
    if (admin) {
      const token = generateToken(admin.id, "admin");
      return res.status(200).json({
        success: true,
        message: "Login berhasil",
        role: "admin",
        token: token,
        data: {
          id: admin.id,
          username: admin.username,
          fullName: admin.full_name,
          createdDate: admin.created_date,
          updatedDate: admin.updated_date,
        },
      });
    }

    // Check Student
    const student = await loginStudent(username, passwordHash);
    if (student) {
      const token = generateToken(student.id, "employee");
      return res.status(200).json({
        success: true,
        message: "Login berhasil",
        role: "employee",
        token: token,
        data: {
          id: student.id,
          nisn: student.nisn,
          username: student.username,
          fullName: student.full_name,
          phone: student.phone,
          address: student.address,
          class: student.class,
          major: student.major,
          isActive: student.is_active,
          createdDate: student.created_date,
          updatedDate: student.updated_date,
        },
      });
    }

    // If not found
    return res.status(401).json({
      success: false,
      message: "Username atau password salah",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

// Register Controller (Student Only)
export const register = async (req, res) => {
  try {
    const { nisn, username, password, fullName, phone, address, studentClass, major } = req.body;

    // Validation
    if (!nisn || !username || !password || !fullName || !studentClass || !major) {
      return res.status(400).json({
        success: false,
        message: "NISN, username, password, nama lengkap, kelas, dan jurusan harus diisi",
      });
    }

    // Validate class
    const validClasses = ["X", "XI", "XII"];
    if (!validClasses.includes(studentClass)) {
      return res.status(400).json({
        success: false,
        message: "Kelas tidak valid. Pilih: X, XI, atau XII",
      });
    }

    // Validate major
    const validMajors = ["RPL", "DKV1", "DKV2", "BR", "MP", "AK"];
    if (!validMajors.includes(major)) {
      return res.status(400).json({
        success: false,
        message: "Jurusan tidak valid. Pilih: RPL, DKV1, DKV2, BR, MP, atau AK",
      });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Register student
    const result = await registerStudent({
      nisn,
      username,
      passwordHash,
      fullName,
      phone: phone || null,
      address: address || null,
      studentClass,
      major,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};
