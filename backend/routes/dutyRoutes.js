/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import express from "express";
import Duty from "../models/Duty.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
// Authentication
import protectRoutes from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/auth.admin.js";
import selfOrAdmin from "../middleware/auth.user.js";
// Mailer
import { sendDutyNotification, sendUpdateDutyNotification } from "../lib/mailer.js";

const dutyRoutes = express.Router();

/**
 * Create a Duty (Create Duty: date, place, time, clinical)
 * With Email Notif
 */
dutyRoutes.post("/", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { groupId, date, place, time, clinicalInstructor, area } = req.body;

    if (!groupId || !date || !clinicalInstructor || !area) {
      return res.status(400).json({
        success: false,
        message: "All fields (group, date, place, time, clinicalInstructor, area) are required.",
      });
    }

    // Check group exists
    const group = await Group.findById(groupId).populate("members");
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    // Normalize date to ignore time portion (only check by day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if duty already exists for this group on the same day
    const existingDuty = await Duty.findOne({
      group: groupId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingDuty) {
      return res.status(400).json({
        success: false,
        message: "This group already has a duty assigned on the same date.",
      });
    }

    // Create duty
    const duty = await Duty.create({
      group: groupId,
      date,
      place,
      time,
      clinicalInstructor,
      area
    });

    // Collect recipient info (email + name) from the group, not duty
    const recipients = group.members.map((member) => ({
      email: member.email,
      name: member.name,
    }));

    // Send notification
    if (recipients.length > 0) {
      await sendDutyNotification(recipients, duty, group.name);
    }

    res.status(201).json({
      success: true,
      message: "Duty created and assigned to group.",
      duty,
      assignedMembers: group.members,
    });
  } catch (error) {
    console.error("Error creating duty:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update a Duty (edit duty: date, place, time, task)
 * With Email Notif
 */
dutyRoutes.put("/:id", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, place, time, clinicalInstructor, area } = req.body;

    const duty = await Duty.findById(id).populate({
      path: "group",
      populate: { path: "members" }, // load group + members
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: "Duty not found.",
      });
    }

    // Update fields
    if (date) {
      const dutyDate = new Date(date);
      dutyDate.setHours(0, 0, 0, 0);
      duty.date = dutyDate;
    }
    if (place) duty.place = place.trim();
    if (time) duty.time = time.trim();
    if (clinicalInstructor) duty.clinicalInstructor = clinicalInstructor.trim();
    if (area) duty.area = area.trim();

    await duty.save();

    // Collect recipient info (email + name) from group members
    const recipients = duty.group.members.map((member) => ({
      email: member.email,
      name: member.name,
    }));

    // Send notification
    if (recipients.length > 0) {
      await sendUpdateDutyNotification(recipients, duty, duty.group.name);
    }

    res.status(200).json({
      success: true,
      message: "Duty updated successfully. Notifications sent to group members.",
      duty,
    });
  } catch (error) {
    console.error("Error in PUT /duties/:id:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
});

/**
 * Get all duties (with group and members populated)
 * ADMIN
 */
dutyRoutes.get("/", protectRoutes, adminOnly, async (req, res) => {
  try {
    const duties = await Duty.find()
      .populate({
        path: "group",
        populate: { path: "members", select: "name email" },
      })
      .sort({ date: 1 });

    res.status(200).json({ success: true, duties });
  } catch (error) {
    console.error("Error fetching duties:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Duties Of Particular Group
 * ADMIN
 */
dutyRoutes.get("/:groupId", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { groupId } = req.params;

    const duties = await Duty.find({ group: groupId })
      .populate({
        path: "group",
        populate: { path: "members", select: "name email" },
      })
      .sort({ date: 1 });

    res.status(200).json({ success: true, duties });
  } catch (error) {
    console.error("Error fetching group duties:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Duties Of Particular User
 */
dutyRoutes.get("/user/:_id", protectRoutes, selfOrAdmin, async (req, res) => {
  try {
    const { _id } = req.params;

    // 1. Find user
    const user = await User.findById(_id).populate("group");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.group) {
      return res.status(404).json({
        success: false,
        message: "This user does not belong to any group, so no duties.",
      });
    }

    // 2. Find all duties for user's group
    const duties = await Duty.find({ group: user.group._id })
      .populate({
        path: "group",
        populate: { path: "members", select: "name email schoolId" },
      })
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        group: user.group.name,
      },
      duties,
    });
  } catch (error) {
    console.error("Error fetching user duties:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete a Duty
 */
dutyRoutes.delete("/:id", protectRoutes, adminOnly, async (req, res) => {
  try {
    const duty = await Duty.findById(req.params.id);

    if (!duty) {
      return res
        .status(404)
        .json({ success: false, message: "Duty not found." });
    }

    await duty.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Duty deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /duties/:id:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
});

export default dutyRoutes;
