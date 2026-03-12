const analyticsService = require("../services/analyticsService");

async function getDashboardStats(req, res, next) {
  try {
    const stats = await analyticsService.getDashboardStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSummaryReport(req, res, next) {
  try {
    const report = await analyticsService.generateSummaryReport();

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboardStats,
  getSummaryReport,
};
