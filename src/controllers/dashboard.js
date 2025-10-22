import DashboardModel from "../models/dashboard.js";

const DashboardController = {
  // Get all dashboard data
  async getDashboardData(req, res) {
    try {
      const stats = await DashboardModel.getDashboardStats();
      const weeklySales = await DashboardModel.getWeeklySales();
      const salesByCategory = await DashboardModel.getSalesByCategory();
      const recentOrders = await DashboardModel.getRecentOrders();
      const topProducts = await DashboardModel.getTopProducts();
      const activeDiscounts = await DashboardModel.getActiveDiscounts();

      res.status(200).json({
        success: true,
        data: {
          stats,
          weeklySales,
          salesByCategory,
          recentOrders,
          topProducts,
          activeDiscounts
        }
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data dashboard"
      });
    }
  }
};

export default DashboardController;
