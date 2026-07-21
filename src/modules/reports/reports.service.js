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

exports.getFilteredPayments = async ({ reportType, financialYear, month, cropYear, warehouseName, warehouseBranch, billType, warehouseType, fromDate, toDate }) => {
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

  if (warehouseName) {
    query += ` AND warehouse_name = ?`;
    values.push(warehouseName);
  }

  if (warehouseBranch) {
    query += ` AND branch_name = ?`;
    values.push(warehouseBranch);
  }

  if (billType) {
    query += ` AND bill_type = ?`;
    values.push(billType);
  }

  if (warehouseType) {
    query += ` AND warehouse_type = ?`;
    values.push(warehouseType);
  }

  // TDS-only date range filter — uses payment's payment_date or created_at
  if (fromDate && toDate) {
    if (reportType === "TDS") {
      query += ` AND DATE(payment_date) >= ? AND DATE(payment_date) <= ?`;
    } else {
      query += ` AND DATE(created_at) >= ? AND DATE(created_at) <= ?`;
    }
    values.push(fromDate, toDate);
  }

  const [rows] = await pool.query(query, values);

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

exports.getReportFilters = async ({ reportType, financialYear, month, cropYear, warehouseName, warehouseBranch, billType, warehouseType }) => {
  if (!reportType) return { financialYears: [], months: [], cropYears: [], warehouseNames: [], warehouseBranches: [], billTypes: [], warehouseTypes: [] };

  let field = "";
  switch (reportType) {
    case "TDS": field = "tds"; break;
    case "EMI": field = "emi_amount"; break;
    case "BANK_SOLVANCY": field = "bank_solvancy"; break;
    case "DEDUCTION_20": field = "deduction_20_percent"; break;
    default: throw new Error("Invalid report type");
  }

  const baseCriteria = `FROM payments WHERE 1=1 AND ${field} IS NOT NULL AND ${field} != 0`;

  const buildWhere = (excludeKey) => {
    let query = baseCriteria;
    let vals = [];
    if (financialYear && excludeKey !== 'financialYear') { query += ` AND financial_year = ?`; vals.push(financialYear); }
    if (month && excludeKey !== 'month') { query += ` AND month = ?`; vals.push(month); }
    if (cropYear && excludeKey !== 'cropYear') { query += ` AND crop_year = ?`; vals.push(cropYear); }
    if (warehouseName && excludeKey !== 'warehouseName') { query += ` AND warehouse_name = ?`; vals.push(warehouseName); }
    if (warehouseBranch && excludeKey !== 'warehouseBranch') { query += ` AND branch_name = ?`; vals.push(warehouseBranch); }
    if (billType && excludeKey !== 'billType') { query += ` AND bill_type = ?`; vals.push(billType); }
    if (warehouseType && excludeKey !== 'warehouseType') { query += ` AND warehouse_type = ?`; vals.push(warehouseType); }
    return { query, vals };
  };

  const fYear = buildWhere('financialYear');
  const fMonth = buildWhere('month');
  const fCrop = buildWhere('cropYear');
  const fWhName = buildWhere('warehouseName');
  const fWhBranch = buildWhere('warehouseBranch');
  const fBillType = buildWhere('billType');
  const fWhType = buildWhere('warehouseType');

  const queries = [
    pool.query(`SELECT DISTINCT financial_year ${fYear.query} AND financial_year IS NOT NULL AND financial_year != '' ORDER BY financial_year DESC`, fYear.vals),
    pool.query(`SELECT DISTINCT month ${fMonth.query} AND month IS NOT NULL AND month != '' ORDER BY month DESC`, fMonth.vals),
    pool.query(`SELECT DISTINCT crop_year ${fCrop.query} AND crop_year IS NOT NULL AND crop_year != '' ORDER BY crop_year DESC`, fCrop.vals),
    pool.query(`SELECT DISTINCT warehouse_name ${fWhName.query} AND warehouse_name IS NOT NULL AND warehouse_name != '' ORDER BY warehouse_name ASC`, fWhName.vals),
    pool.query(`SELECT DISTINCT branch_name ${fWhBranch.query} AND branch_name IS NOT NULL AND branch_name != '' ORDER BY branch_name ASC`, fWhBranch.vals),
    pool.query(`SELECT DISTINCT bill_type ${fBillType.query} AND bill_type IS NOT NULL AND bill_type != '' ORDER BY bill_type ASC`, fBillType.vals),
    pool.query(`SELECT DISTINCT warehouse_type ${fWhType.query} AND warehouse_type IS NOT NULL AND warehouse_type != '' ORDER BY warehouse_type ASC`, fWhType.vals),
  ];

  const results = await Promise.all(queries);

  return {
    financialYears: results[0][0].map(r => r.financial_year),
    months: results[1][0].map(r => r.month),
    cropYears: results[2][0].map(r => r.crop_year),
    warehouseNames: results[3][0].map(r => r.warehouse_name),
    warehouseBranches: results[4][0].map(r => r.branch_name),
    billTypes: results[5][0].map(r => r.bill_type),
    warehouseTypes: results[6][0].map(r => r.warehouse_type)
  };
};

/* =====================================================================
   ADVISORY
   The Advisory page represents a single report type, so it reuses the
   same payments data source and filter logic as the Report module but
   without restricting to a specific deduction field (no reportType).
   ===================================================================== */

/* Advisory data: all payments matching the selected filters */
exports.getAdvisoryPayments = async ({ financialYear, month, cropYear, warehouseName, warehouseBranch, billType, warehouseType, fromDate, toDate }) => {
  let query = `SELECT * FROM payments WHERE 1=1`;
  let values = [];

  if (financialYear) { query += ` AND financial_year = ?`; values.push(financialYear); }
  if (month) { query += ` AND month = ?`; values.push(month); }
  if (cropYear) { query += ` AND crop_year = ?`; values.push(cropYear); }
  if (warehouseName) { query += ` AND warehouse_name = ?`; values.push(warehouseName); }
  if (warehouseBranch) { query += ` AND branch_name = ?`; values.push(warehouseBranch); }
  if (billType) { query += ` AND bill_type = ?`; values.push(billType); }
  if (warehouseType) { query += ` AND warehouse_type = ?`; values.push(warehouseType); }
  if (fromDate && toDate) {
    query += ` AND DATE(created_at) >= ? AND DATE(created_at) <= ?`;
    values.push(fromDate, toDate);
  }

  query += ` ORDER BY id ASC`;

  const [rows] = await pool.query(query, values);
  return rows;
};

/* Advisory cascading filter options (no reportType restriction) */
exports.getAdvisoryFilters = async ({ financialYear, month, cropYear, warehouseName, warehouseBranch, billType, warehouseType }) => {
  const baseCriteria = `FROM payments WHERE 1=1`;

  const buildWhere = (excludeKey) => {
    let query = baseCriteria;
    let vals = [];
    if (financialYear && excludeKey !== 'financialYear') { query += ` AND financial_year = ?`; vals.push(financialYear); }
    if (month && excludeKey !== 'month') { query += ` AND month = ?`; vals.push(month); }
    if (cropYear && excludeKey !== 'cropYear') { query += ` AND crop_year = ?`; vals.push(cropYear); }
    if (warehouseName && excludeKey !== 'warehouseName') { query += ` AND warehouse_name = ?`; vals.push(warehouseName); }
    if (warehouseBranch && excludeKey !== 'warehouseBranch') { query += ` AND branch_name = ?`; vals.push(warehouseBranch); }
    if (billType && excludeKey !== 'billType') { query += ` AND bill_type = ?`; vals.push(billType); }
    if (warehouseType && excludeKey !== 'warehouseType') { query += ` AND warehouse_type = ?`; vals.push(warehouseType); }
    return { query, vals };
  };

  const fYear = buildWhere('financialYear');
  const fMonth = buildWhere('month');
  const fCrop = buildWhere('cropYear');
  const fWhName = buildWhere('warehouseName');
  const fWhBranch = buildWhere('warehouseBranch');
  const fBillType = buildWhere('billType');
  const fWhType = buildWhere('warehouseType');

  const queries = [
    pool.query(`SELECT DISTINCT financial_year ${fYear.query} AND financial_year IS NOT NULL AND financial_year != '' ORDER BY financial_year DESC`, fYear.vals),
    pool.query(`SELECT DISTINCT month ${fMonth.query} AND month IS NOT NULL AND month != '' ORDER BY month DESC`, fMonth.vals),
    pool.query(`SELECT DISTINCT crop_year ${fCrop.query} AND crop_year IS NOT NULL AND crop_year != '' ORDER BY crop_year DESC`, fCrop.vals),
    pool.query(`SELECT DISTINCT warehouse_name ${fWhName.query} AND warehouse_name IS NOT NULL AND warehouse_name != '' ORDER BY warehouse_name ASC`, fWhName.vals),
    pool.query(`SELECT DISTINCT branch_name ${fWhBranch.query} AND branch_name IS NOT NULL AND branch_name != '' ORDER BY branch_name ASC`, fWhBranch.vals),
    pool.query(`SELECT DISTINCT bill_type ${fBillType.query} AND bill_type IS NOT NULL AND bill_type != '' ORDER BY bill_type ASC`, fBillType.vals),
    pool.query(`SELECT DISTINCT warehouse_type ${fWhType.query} AND warehouse_type IS NOT NULL AND warehouse_type != '' ORDER BY warehouse_type ASC`, fWhType.vals),
  ];

  const results = await Promise.all(queries);

  return {
    financialYears: results[0][0].map(r => r.financial_year),
    months: results[1][0].map(r => r.month),
    cropYears: results[2][0].map(r => r.crop_year),
    warehouseNames: results[3][0].map(r => r.warehouse_name),
    warehouseBranches: results[4][0].map(r => r.branch_name),
    billTypes: results[5][0].map(r => r.bill_type),
    warehouseTypes: results[6][0].map(r => r.warehouse_type)
  };
};