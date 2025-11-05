import { 
  getAdminProfileModel, 
  updateAdminProfileModel, 
  getBackupScriptModel,
  resetDatabaseModel,
  restoreDatabaseModel
} from "../models/settings.js";

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
    
    const result = await updateAdminProfileModel(adminId, { username, fullName, currentPassword, newPassword });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
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
    res.status(200).json(result);
  } catch (error) {
    console.error("Error restoring database:", error);
    res.status(500).json({ success: false, message: "Gagal restore database: " + error.message });
  }
};
