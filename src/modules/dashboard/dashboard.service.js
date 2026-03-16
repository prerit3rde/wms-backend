const pool = require("../../config/db");

exports.getOverview = async () => {
  const [warehouseCount] = await pool.query(
    `SELECT COUNT(*) as total FROM warehouses WHERE is_deleted = FALSE`
  );

  const [revenue] = await pool.query(
    `SELECT SUM(total_amount) as totalRevenue FROM warehouses WHERE is_deleted = FALSE`
  );

  return {
    totalWarehouses: warehouseCount[0].total,
    totalRevenue: revenue[0].totalRevenue || 0,
    monthlyStats: [
      { month: "Jan", value: 10 },
      { month: "Feb", value: 20 },
      { month: "Mar", value: 15 },
    ], // dummy for now
  };
};
