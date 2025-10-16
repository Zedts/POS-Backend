import jwt from "jsonwebtoken";

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Sesi telah berakhir, silakan login kembali",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

// Middleware to verify admin role
export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Hanya admin yang diizinkan",
    });
  }
  next();
};

// Middleware to verify employee role
export const verifyEmployee = (req, res, next) => {
  if (req.user.role !== "employee") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Hanya employee yang diizinkan",
    });
  }
  next();
};
