/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/db.js";
import "./lib/scheduler.js";

// Routes Import
import authRoutes from "./routes/authRoutes.js";
import dutyRoutes from "./routes/dutyRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5173", // local dev
      "http://192.168.1.5:5173", // LAN dev
    ],
  })
);
// Increase body size limit
app.use(express.json({ limit: "10mb" })); // Allow up to 10MB
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Job to run every 14 minutes
// job.start();
// Routes
app.get("/", (req, res) => {
  res.send("Welcome to Time 2 Care");
});
app.use("/api/auth", authRoutes);
app.use("/api/duties", dutyRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/quotes", quoteRoutes);
// Listen to port
app.listen(PORT, () => {
  console.log(`Server start on port ${PORT}`);
  connectDB();
});
