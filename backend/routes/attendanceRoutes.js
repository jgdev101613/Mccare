/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

// routes/attendanceRoutes.js
import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

// Authentication
import protectRoutes from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/auth.admin.js";
import selfOrAdmin from "../middleware/auth.user.js";

const attendanceRoutes = express.Router();

// Mark attendance by schoolId
attendanceRoutes.get("/mark/:schoolId", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { schoolId } = req.params;

    const user = await User.findOne({ schoolId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // midnight reset

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      schoolId,
      date: dateOnly,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today.",
      });
    }

    // Save new attendance
    const attendance = new Attendance({
      user: user._id,
      schoolId,
      date: dateOnly,
      timeIn: today.toTimeString().split(" ")[0], // HH:mm:ss
    });

    await attendance.save();

    console.log("✅ Marked User(" + schoolId + ") as present: ", req.originalUrl);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully!",
      data: {
        name: user.name,
        schoolId: user.schoolId,
        date: attendance.date,
        timeIn: attendance.timeIn,
      },
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance records of a user by schoolId
attendanceRoutes.get("/:schoolId", protectRoutes, selfOrAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;

    const user = await User.findOne({ schoolId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const records = await Attendance.find({ schoolId })
      .sort({ date: -1 }) // latest first
      .select("-__v")     // remove __v field for cleaner response
      .lean();

    console.log("✅ Get User(" + schoolId + ") attendance record: ", req.originalUrl);

    res.status(200).json({
      success: true,
      message: "Attendance records retrieved successfully.",
      user: {
        id: user._id,
        name: user.name,
        schoolId: user.schoolId,
      },
      records,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance records of ALL users (admin only)
attendanceRoutes.get("/", protectRoutes, adminOnly, async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("user", "name username schoolId section course department") // attach user details
      .sort({ date: -1 }) // latest first
      .select("-__v")     // remove __v field
      .lean();

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found.",
      });
    }

    console.log("✅ Get all attendance record: ", req.originalUrl);

    res.status(200).json({
      success: true,
      message: "All attendance records retrieved successfully.",
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


export default attendanceRoutes;
