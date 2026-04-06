const pool = require("../../config/db");

exports.getFinancialYears = async () => {
  const [rows] = await pool.query(
    "SELECT DISTINCT financial_year FROM payments ORDER BY financial_year DESC"
  );
  return rows;
};

exports.getFilteredPayments = async ({ reportType, financialYear, month }) => {
  let field = "";

  switch (reportType) {
    case "TDS":
      field = "tds";
      break;
    case "EMI":
      field = "emi_amount";
      break;
    case "BANK_SOLVANCY":
      field = "bank_solvancy";
      break;
    case "DEDUCTION_20":
      field = "deduction_20_percent";
      break;
    default:
      throw new Error("Invalid report type");
  }

  let query = `
    SELECT * FROM payments
    WHERE financial_year = ?
    AND ${field} IS NOT NULL
    AND ${field} != 0
  `;

  let values = [financialYear];

  if (month) {
    query += ` AND month = ?`;
    values.push(month);
  }

  const [rows] = await pool.query(query, values); // ✅ FIXED

  return rows;
};

exports.saveReport = async ({ reportType, financialYear, filePath }) => {
  const [result] = await pool.query(
    "INSERT INTO reports (report_type, financial_year, file_path) VALUES (?, ?, ?)",
    [reportType, financialYear, filePath]
  );

  return result;
};

exports.getAllReports = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM reports ORDER BY created_at DESC"
  );
  return rows;
};

exports.deleteReport = async (id) => {
  const [result] = await pool.query(
    "DELETE FROM reports WHERE id = ?",
    [id]
  );

  return result;
};