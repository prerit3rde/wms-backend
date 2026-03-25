const reportService = require("./reports.service");
const exportService = require("./reports.export.service");

exports.getFinancialYears = async (req, res) => {
  try {
    const data = await reportService.getFinancialYears();

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.previewReport = async (req, res) => {
  try {
    const { reportType, financialYear } = req.query;

    const data = await reportService.getFilteredPayments({
      reportType,
      financialYear,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType, financialYear } = req.body;

    const data = await reportService.getFilteredPayments({
      reportType,
      financialYear,
    });

    const filePath = await exportService.generateExcel(
      data,
      reportType,
      financialYear
    );

    await reportService.saveReport({
      reportType,
      financialYear,
      filePath,
    });

    res.json({
      success: true,
      message: "Report generated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const data = await reportService.getAllReports();

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const { file } = req.query;

    const filePath = require("path").join(
      __dirname,
      "../../",
      file
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.download(filePath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Download failed",
    });
  }
};