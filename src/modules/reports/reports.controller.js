const reportsService = require("./reports.service");

exports.getPaymentsReport = async (req, res) => {
  try {
    const data = await reportsService.getPaymentsReport(req.query);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.generatePaymentsReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await reportsService.generatePaymentsReport(
      req.body.filters,
      userId
    );

    res.json({
      success: true,
      message: "Report generated",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReportHistory = async (req, res) => {
  try {
    const data = await reportsService.getReportHistory();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const file = await reportsService.getReportFile(req.params.id);

    res.download(file.file_path);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};