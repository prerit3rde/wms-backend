const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

exports.generateExcel = async (data, reportType, financialYear) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payments");

  // Define Columns
  const columns = [
    { header: "ID", key: "id" },
    { header: "Bill Type", key: "bill_type" },
    { header: "District", key: "district_name" },
    { header: "Sr No", key: "sr_no" },
    { header: "Branch", key: "branch_name" },
    { header: "Name of Warehouse", key: "warehouse_name" },
    { header: "Godown type", key: "warehouse_type" },
    { header: "PAN Card Holder", key: "pan_card_holder" },
    { header: "PAN Card Number", key: "pan_card_number" },
    { header: "Gdn No.", key: "warehouse_no" },
    { header: "Depositers Name", key: "depositers_name" },
    { header: "Commodity", key: "commodity" },
    { header: "Period", key: "period" },
    { header: "Financial Year", key: "financial_year" },
    { header: "Crop Year", key: "crop_year" },
    { header: "Bill Amount", key: "bill_amount" },
    { header: "TOTAL JV Amount", key: "total_jv_amount" },
    { header: "Actual Passed Amount", key: "actual_passed_amount" },
    { header: "TDS", key: "tds" },
    { header: "EMI Amount", key: "emi_amount" },
    { header: "20% Deduction Amount against gain", key: "deduction_20_percent" },
    { header: "Penalty", key: "penalty" },
    { header: "Medicine", key: "medicine" },
    { header: "EMI FDR Interest", key: "emi_fdr_interest" },
    { header: "Gain Shortage Deduction", key: "gain_shortage_deduction" },
    { header: "Stock Shortage Deduction", key: "stock_shortage_deduction" },
    { header: "Bank Solvancy", key: "bank_solvancy" },
    { header: "Insurance", key: "insurance" },
    { header: "Other Deduction", key: "other_deduction_amount" },
    { header: "Pay to JVS Amount", key: "pay_to_jvs_amount" },
    { header: "Payment By", key: "payment_by" },
    { header: "Payment Date", key: "payment_date" },
    { header: "QTR", key: "qtr" },
    { header: "Remarks", key: "remarks" },
  ];

  // 1. Add Hindi Title Rows
  const title1 = "म. प्र. वेयरहाउसिंग एंड लॉजिस्टिक्स कॉर्पोरेशन, क्षेत्रीय कार्यालय, इन्दौर";
  const title2 = `${financialYear || "2024-25"} में जी.वी. स्कीम योजनान्तर्गत भंडारण शुल्क देयकों के भुगतान की जानकारी`;

  worksheet.insertRow(1, []);
  worksheet.insertRow(2, []);
  worksheet.insertRow(3, []); // Deduction row
  worksheet.insertRow(4, columns.map(c => c.header));

  worksheet.mergeCells(`D1:AH1`);
  worksheet.mergeCells(`D2:AH2`);

  const cellD1 = worksheet.getCell("D1");
  const cellD2 = worksheet.getCell("D2");

  cellD1.value = title1;
  cellD2.value = title2;

  [cellD1, cellD2].forEach(cell => {
    cell.font = { name: "Times New Roman", size: 16 };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 28;
  worksheet.getRow(3).height = 22;
  worksheet.getRow(4).height = 30;

  // 2. Deduction Header (Row 3) - ONLY FOR TDS
  if (reportType === "TDS") {
    // EMI (Col 20) to Other Deduction (Col 29)
    worksheet.mergeCells(3, 20, 3, 29);
    const deductionCell = worksheet.getCell(3, 20);
    deductionCell.value = "Deduction";
    deductionCell.font = { name: "Times New Roman", size: 13, bold: true };
    deductionCell.alignment = { horizontal: "center", vertical: "middle" };
    deductionCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    deductionCell.border = {
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // 3. Header Styling (Row 4)
  const headerRow = worksheet.getRow(4);
  headerRow.eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 11, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // 4. Data Rows
  data.forEach((item, index) => {
    const rowData = {
      id: item.id,
      bill_type: item.bill_type || "",
      district_name: item.district_name || "",
      sr_no: index + 1,
      branch_name: item.branch_name || "",
      warehouse_name: item.warehouse_name || "",
      warehouse_type: item.warehouse_type || "",
      pan_card_holder: item.pan_card_holder || "",
      pan_card_number: item.pan_card_number || "",
      warehouse_no: item.warehouse_no || "",
      depositers_name: item.depositers_name || "",
      commodity: item.commodity || "",
      period: item.from_date ? new Date(item.from_date).toLocaleString("en-IN", { month: "short", year: "2-digit" }) : "",
      financial_year: item.financial_year || "",
      crop_year: item.crop_year || "",
      bill_amount: Number(item.bill_amount || 0),
      total_jv_amount: Number(item.total_jv_amount || 0),
      actual_passed_amount: Number(item.actual_passed_amount || 0),
      tds: Number(item.tds || 0),
      emi_amount: Number(item.emi_amount || 0),
      deduction_20_percent: Number(item.deduction_20_percent || 0),
      penalty: Number(item.penalty || 0),
      medicine: Number(item.medicine || 0),
      emi_fdr_interest: Number(item.emi_fdr_interest || 0),
      gain_shortage_deduction: Number(item.gain_shortage_deduction || 0),
      stock_shortage_deduction: Number(item.stock_shortage_deduction || 0),
      bank_solvancy: Number(item.bank_solvancy || 0),
      insurance: Number(item.insurance || 0),
      other_deduction_amount: Number(item.other_deduction_amount || 0),
      pay_to_jvs_amount: Number(item.pay_to_jvs_amount || 0),
      payment_by: item.payment_by || "",
      payment_date: item.payment_date ? new Date(item.payment_date).toLocaleDateString("en-IN") : "",
      qtr: item.qtr || "",
      remarks: item.remarks || "",
    };

    const row = worksheet.addRow(Object.values(rowData));
    row.eachCell((cell) => {
      cell.font = { name: "Times New Roman", size: 11 };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });

  // Column widths scaling
  columns.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = col.width;
  });

  const dir = path.join(__dirname, "../../uploads/reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `${reportType}_${financialYear || "REPORT"}_${Date.now()}.xlsx`;
  const filePath = path.join(dir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return `uploads/reports/${fileName}`;
};