const pool = require("../../config/db");

exports.getFinancialYears = async () => {
  const [fyRows] = await pool.query(
    "SELECT DISTINCT financial_year FROM payments WHERE financial_year IS NOT NULL AND financial_year != '' ORDER BY financial_year DESC"
  );
  
  const [cyRows] = await pool.query(
    "SELECT DISTINCT crop_year FROM payments WHERE crop_year IS NOT NULL AND crop_year != '' ORDER BY crop_year DESC"
  );

  return {
    financialYears: fyRows.map(r => r.financial_year),
    cropYears: cyRows.map(r => r.crop_year)
  };
};

exports.getFilteredPayments = async ({ reportType, financialYear, month, cropYear }) => {
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
    WHERE 1=1
    AND ${field} IS NOT NULL
    AND ${field} != 0
  `;

  let values = [];

  if (financialYear) {
    query += ` AND financial_year = ?`;
    values.push(financialYear);
  }

  if (month) {
    query += ` AND month = ?`;
    values.push(month);
  }

  if (cropYear) {
    query += ` AND crop_year = ?`;
    values.push(cropYear);
  }

  const [rows] = await pool.query(query, values); // ✅ FIXED

  return rows;
};

exports.saveReport = async ({ reportType, financialYear, month, cropYear, filePath }) => {
  const [result] = await pool.query(
    "INSERT INTO reports (report_type, financial_year, month, crop_year, file_path) VALUES (?, ?, ?, ?, ?)",
    [reportType, financialYear, month, cropYear, filePath]
  );

  return result;
};

exports.getAllReports = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM reports ORDER BY id DESC"
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