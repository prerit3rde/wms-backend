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

    worksheet.columns = columns.map((col) => ({
      header: col.replace("_", " ").toUpperCase(),
      key: col,
      width: 20,
    }));

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