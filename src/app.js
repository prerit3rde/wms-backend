const express = require("express");
const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const userRoutes = require("./routes/user.routes");
const cors = require("cors");
const warehouseRoutes = require("./modules/warehouse/warehouse.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const claimRoutes = require("./modules/claim/claim.routes");
const reportsRoutes = require("./modules/reports/reports.routes");

const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorMiddleware);

module.exports = app;
