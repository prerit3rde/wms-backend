const express = require("express");
const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const userRoutes = require("./routes/user.routes");
const cors = require("cors");
const warehouseRoutes = require("./modules/warehouse/warehouse.routes");
const warehouseTypeRoutes = require("./modules/warehouseType/warehouseType.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const reportsRoutes = require("./modules/reports/reports.routes");
const path = require("path");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Enable CORS
app.use(
  cors({
    origin: "*", // Allow all origins (you can specify your frontend URL here)
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/warehouse-types", warehouseTypeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorMiddleware);

app.use("/uploads", express.static("uploads"));

app.use(
  "/samples",
  express.static(path.join(__dirname, "../public/samples"))
);

module.exports = app;
