const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

exports.generateExcel = async (data, reportType, financialYear) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  worksheet.columns = [
    { header: "Sr No", key: "id", width: 10 },
    { header: "Bill Type", key: "bill_type", width: 20 },
    { header: "District", key: "district_name", width: 20 },
    { header: "Branch", key: "branch_name", width: 20 },
    { header: "Warehouse Name", key: "warehouse_name", width: 25 },
    { header: "Warehouse No", key: "warehouse_no", width: 20 },
    { header: "PAN Holder", key: "pan_holder", width: 25 },
    { header: "PAN Number", key: "pan_number", width: 25 },
    { header: "Depositer Name", key: "depositer_name", width: 25 },
    { header: "Commodity", key: "commodity", width: 20 },
    { header: "Period", key: "period", width: 25 },
    { header: "Bill Amount", key: "bill_amount", width: 20 },
    { header: "Total JV Amount", key: "total_jv", width: 20 },
    { header: "Actual Passed Amount", key: "actual_passed", width: 25 },
    { header: "TDS", key: "tds", width: 15 },
    { header: "EMI Amount", key: "emi_amount", width: 20 },
    { header: "20% Deduction", key: "deduction_20", width: 25 },
    { header: "Penalty", key: "penalty", width: 15 },
    { header: "Medicine", key: "medicine", width: 15 },
    { header: "EMI FDR Interest", key: "emi_fdr_interest", width: 20 },
    { header: "Gain Shortage Deduction", key: "gain_shortage", width: 25 },
    { header: "Stock Shortage Deduction", key: "stock_shortage", width: 25 },
    { header: "Bank Solvancy", key: "bank_solvancy", width: 20 },
    { header: "Insurance", key: "insurance", width: 20 },
    { header: "Other Deduction", key: "other_deduction", width: 20 },
    { header: "Pay to JVS", key: "pay_to_jvs", width: 20 },
    { header: "Payment By", key: "payment_by", width: 20 },
    { header: "Payment Date", key: "payment_date", width: 20 },
    { header: "QTR", key: "qtr", width: 10 },
    { header: "Remarks", key: "remarks", width: 30 },
  ];

  data.forEach((item) => {
    worksheet.addRow({
      ...item,
      period: `${item.from_date} to ${item.to_date}`,
    });
  });

  const dir = path.join(__dirname, "../../uploads/reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `${reportType}_${financialYear}_${Date.now()}.xlsx`;
  const filePath = path.join(dir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return filePath;
};