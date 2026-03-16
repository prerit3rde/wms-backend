const db = require("../../config/db");
const { generateExcelReport } = require("./reports.export.service");

exports.getClaimsReport = async (filters) => {
  let query = `SELECT 
    warehouse_name,
    month,
    financial_year,
    status,
    rent_bill_amount
  FROM claims
  WHERE 1=1`;

  const params = [];

  if (filters.month) {
    query += " AND month = ?";
    params.push(filters.month);
  }

  if (filters.financial_year) {
    query += " AND financial_year = ?";
    params.push(filters.financial_year);
  }

  if (filters.warehouse_name) {
    query += " AND warehouse_name = ?";
    params.push(filters.warehouse_name);
  }

  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  const [rows] = await db.query(query, params);

  return rows;
};

exports.generateClaimsReport = async (filters, userId) => {
  const data = await exports.getClaimsReport(filters);

  const reportName = "claims-report";

  const file = await generateExcelReport(data, reportName);

  const [result] = await db.query(
    `INSERT INTO reports 
     (report_name, report_type, filters_used, file_path, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      reportName,
      "excel",
      JSON.stringify(filters),
      file.filePath,
      userId,
    ]
  );

  return {
    reportId: result.insertId,
    filePath: file.filePath,
  };
};

exports.getReportHistory = async () => {
  const [rows] = await db.query(`
    SELECT id, report_name, report_type, created_at
    FROM reports
    ORDER BY created_at DESC
  `);

  return rows;
};

exports.getReportFile = async (id) => {
  const [rows] = await db.query(
    "SELECT file_path FROM reports WHERE id = ?",
    [id]
  );

  return rows[0];
};