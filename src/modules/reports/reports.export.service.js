const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

exports.generateExcelReport = async (data, reportName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  if (!data.length) {
    worksheet.addRow(["No Data Found"]);
  } else {
    const columns = Object.keys(data[0]);

    worksheet.columns = [
      { header: "Bill Type", key: "bill_type", width: 20 },
      { header: "District", key: "district_name", width: 20 },
      { header: "Sr No", key: "sr_no", width: 10 },
      { header: "Branch", key: "branch_name", width: 20 },
      { header: "Warehouse Name", key: "warehouse_name", width: 30 },
      { header: "PAN Holder", key: "pan_card_holder", width: 25 },
      { header: "PAN Number", key: "pan_card_number", width: 20 },
      { header: "Gdn No", key: "gdn_no", width: 10 },
      { header: "Deposit Name", key: "deposit_name", width: 20 },
      { header: "Commodity", key: "commodity", width: 20 },
      { header: "Period", key: "period", width: 15 },
      { header: "Bill Amount", key: "rent_bill_amount", width: 15 },
      { header: "Total JV Amount", key: "total_jv_amount", width: 15 },
      { header: "Actual Passed Amount", key: "actual_passed_amount", width: 18 },
      { header: "TDS", key: "tds", width: 10 },
      { header: "EMI Amount", key: "emi_amount", width: 15 },
      { header: "20% Deduction", key: "deduction_20_percent", width: 15 },
      { header: "Penalty", key: "penalty", width: 10 },
      { header: "Medicine", key: "medicine", width: 10 },
      { header: "EMI FDR Interest", key: "emi_fdr_interest", width: 18 },
      { header: "Gain Shortage Deduction", key: "gain_shortage_deducton", width: 20 },
      { header: "Stock Shortage Deduction", key: "stock_shortage_deduction", width: 20 },
      { header: "Bank Solvency", key: "bank_solvancy", width: 15 },
      { header: "Insurance", key: "insurance", width: 15 },
      { header: "Other Deduction", key: "other_deduction_amount", width: 20 },
      { header: "Pay To JVS Amount", key: "pay_to_jvs_amount", width: 18 },
      { header: "Payment By", key: "payment_by", width: 15 },
      { header: "Payment Date", key: "payment_date", width: 15 },
      { header: "QTR", key: "qtr", width: 10 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    data.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  const dir = path.join(__dirname, "../../../reports");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const fileName = `${reportName}-${Date.now()}.xlsx`;
  const filePath = path.join(dir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return {
    fileName,
    filePath,
  };
};