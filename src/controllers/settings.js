import { 
  getAdminProfileModel, 
  updateAdminProfileModel, 
  getBackupScriptModel,
  resetDatabaseModel,
  restoreDatabaseModel
} from "../models/settings.js";
import { createAuditLog } from '../utils/auditLogger.js';

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const profile = await getAdminProfileModel(adminId);
    
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile tidak ditemukan" });
    }
    
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Error getting admin profile:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data profile" });
  }
};

// Update Admin Profile
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { username, fullName, currentPassword, newPassword } = req.body;
    
    if (!username || !fullName) {
      return res.status(400).json({ success: false, message: "Username dan Full Name wajib diisi" });
    }
    
    if (newPassword && !currentPassword) {
      return res.status(400).json({ success: false, message: "Current password wajib diisi untuk mengganti password" });
    }
    
    // Get existing data for audit log
    const existingProfile = await getAdminProfileModel(adminId);
    
    const result = await updateAdminProfileModel(adminId, { username, fullName, currentPassword, newPassword });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Create audit log
    await createAuditLog({
      userId: adminId,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'settings',
      entityId: adminId.toString(),
      action: 'UPDATE',
      description: newPassword ? 'Mengupdate profile dan password admin' : 'Mengupdate profile admin',
      oldValue: {
        username: existingProfile.username,
        full_name: existingProfile.full_name
      },
      newValue: {
        username,
        full_name: fullName,
        password_changed: !!newPassword
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ success: false, message: "Gagal update profile" });
  }
};

// Download Backup (script.sql)
export const downloadBackup = async (req, res) => {
  try {
    const scriptContent = await getBackupScriptModel();
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'settings',
      entityId: 'backup',
      action: 'CREATE',
      description: 'Download backup database (script.sql)',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=script.sql');
    res.send(scriptContent);
  } catch (error) {
    console.error("Error downloading backup:", error);
    res.status(500).json({ success: false, message: "Gagal download backup" });
  }
};

// Reset Database to Default
export const resetDatabase = async (req, res) => {
  try {
    const result = await resetDatabaseModel();
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'settings',
      entityId: 'reset',
      action: 'DELETE',
      description: 'Reset database ke kondisi default (SEMUA DATA DIHAPUS)',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({ success: false, message: "Gagal reset database: " + error.message });
  }
};

// Restore Database from File
export const restoreDatabase = async (req, res) => {
  try {
    const { sqlContent } = req.body;
    
    if (!sqlContent) {
      return res.status(400).json({ success: false, message: "SQL content tidak boleh kosong" });
    }
    
    const result = await restoreDatabaseModel(sqlContent);
    
    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.username || 'Admin',
      entityType: 'settings',
      entityId: 'restore',
      action: 'CREATE',
      description: 'Restore database dari file backup',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error restoring database:", error);
    res.status(500).json({ success: false, message: "Gagal restore database: " + error.message });
  }
};
