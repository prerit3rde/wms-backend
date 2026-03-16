const dashboardService = require("./dashboard.service");

exports.getOverview = async (req, res) => {
  try {
    const data = await dashboardService.getOverview();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
