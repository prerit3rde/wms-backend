const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

exports.generateExcel = async (data, reportType, financialYear) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  worksheet.columns = [
    { header: "Sr No", key: "id" },
    { header: "Bill Type", key: "bill_type" },
    { header: "District", key: "district_name" },
    { header: "Branch", key: "branch_name" },
    { header: "Warehouse Name", key: "warehouse_name" },
    { header: "Warehouse No", key: "warehouse_no" },
    { header: "PAN Holder", key: "pan_holder" },
    { header: "PAN Number", key: "pan_number" },
    { header: "Depositer Name", key: "depositer_name" },
    { header: "Commodity", key: "commodity" },
    { header: "Period", key: "period" },
    { header: "Bill Amount", key: "bill_amount" },
    { header: "Total JV Amount", key: "total_jv" },
    { header: "Actual Passed Amount", key: "actual_passed" },
    { header: "TDS", key: "tds" },
    { header: "EMI Amount", key: "emi_amount" },
    { header: "20% Deduction", key: "deduction_20" },
    { header: "Penalty", key: "penalty" },
    { header: "Medicine", key: "medicine" },
    { header: "EMI FDR Interest", key: "emi_fdr_interest" },
    { header: "Gain Shortage Deduction", key: "gain_shortage" },
    { header: "Stock Shortage Deduction", key: "stock_shortage" },
    { header: "Bank Solvancy", key: "bank_solvancy" },
    { header: "Insurance", key: "insurance" },
    { header: "Other Deduction", key: "other_deduction" },
    { header: "Pay to JVS", key: "pay_to_jvs" },
    { header: "Payment By", key: "payment_by" },
    { header: "Payment Date", key: "payment_date" },
    { header: "QTR", key: "qtr" },
    { header: "Remarks", key: "remarks" },
  ];

  // ✅ ADD DEDUCTION HEADER ROW (ONLY FOR TDS)
  if (reportType === "TDS") {
    // Add empty row at top
    worksheet.insertRow(1, []);

    // Find column indexes (1-based)
    const deductionStartIndex = worksheet.columns.findIndex(
      (col) => col.key === "emi_amount"
    ) + 1;

    const deductionEndIndex = worksheet.columns.findIndex(
      (col) => col.key === "other_deduction"
    ) + 1;

    // Merge cells from TDS → Other Deduction
    worksheet.mergeCells(
      1,
      deductionStartIndex,
      1,
      deductionEndIndex
    );

    const cell = worksheet.getCell(1, deductionStartIndex);

    cell.value = "Other Deductions";

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.font = { bold: true };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // ✅ STYLE HEADER ROW (NOW ROW 2)
  const headerRowIndex = reportType === "TDS" ? 2 : 1;
  const headerRow = worksheet.getRow(headerRowIndex);

  headerRow.height = 22;

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FF000000" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });

  data.forEach((item) => {
    worksheet.addRow({
      id: item.id || "",
      bill_type: item.bill_type || "",
      district_name: item.district_name || "",
      branch_name: item.branch_name || "",
      warehouse_name: item.warehouse_name || "",
      warehouse_no: item.warehouse_no || "",
      pan_holder: item.pan_card_holder || "",
      pan_number: item.pan_card_number || "",
      depositer_name: item.depositers_name || "",
      commodity: item.commodity || "",
      period: `${item.from_date || ""} to ${item.to_date || ""}`,
      bill_amount: Number(item.bill_amount || 0),
      total_jv: Number(item.total_jv || 0),
      actual_passed: Number(item.actual_passed || 0),
      tds: Number(item.tds || 0),
      emi_amount: Number(item.emi_amount || 0),
      deduction_20: Number(item.deduction_20_percent || 0),
      penalty: Number(item.penalty || 0),
      medicine: Number(item.medicine || 0),
      emi_fdr_interest: Number(item.emi_fdr_interest || 0),
      gain_shortage: Number(item.gain_shortage || 0),
      stock_shortage: Number(item.stock_shortage || 0),
      bank_solvancy: Number(item.bank_solvancy || 0),
      insurance: Number(item.insurance || 0),
      other_deduction: Number(item.other_deduction || 0),
      pay_to_jvs: Number(item.pay_to_jvs || 0),
      payment_by: item.payment_by || "",
      payment_date: item.payment_date || "",
      qtr: item.qtr || "",
      remarks: item.remarks || "",
    });
  });

  const dir = path.join(__dirname, "../../uploads/reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `${reportType}_${financialYear}_${Date.now()}.xlsx`;
  const filePath = path.join(dir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return `uploads/reports/${fileName}`;
};