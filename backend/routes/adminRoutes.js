/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import express from "express";

// Models
import Attendance from "../models/Attendance.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

// Authentication
import protectRoutes from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/auth.admin.js";

const adminRoutes = express.Router();

// ********** STUDENTS ********** //
/** Fetch All Students and their information **/
adminRoutes.get(
  "/students/fetchAllStudents",
  protectRoutes,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find({ role: "user" })
        .select("-password")
        .populate("group", "name") // optional: show group name
        .lean();

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Error in GET /members:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  }
);

// ********** GROUP ********** //
/** Create a Group: Admin creates a group with name and members **/
adminRoutes.post("/group", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { name, members } = req.body; // members = array of schoolIds

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name and members (schoolIds) are required.",
      });
    }

    // Ensure group name is unique
    const existingGroup = await Group.findOne({ name: name.trim() });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Group name already exists.",
      });
    }

    // Find users by schoolId
    const users = await User.find({ schoolId: { $in: members } });

    if (users.length !== members.length) {
      return res.status(400).json({
        success: false,
        message: "One or more schoolIds do not exist in the system.",
      });
    }

    // Check if any of these users already belong to another group
    const conflict = await Group.findOne({
      members: { $in: users.map((u) => u._id) },
    });
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "One or more members already belong to another group.",
      });
    }

    // Create group with ObjectIds of users
    const newGroup = new Group({
      name: name.trim(),
      members: users.map((u) => u._id),
    });

    await newGroup.save();

    // Update each user with group reference
    await User.updateMany(
      { _id: { $in: users.map((u) => u._id) } },
      { $set: { group: newGroup._id } }
    );

    res.status(201).json({
      success: true,
      message: "Group created successfully.",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error in POST /groups:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
});

/** Fetch All Groups **/
adminRoutes.get(
  "/group/fetchAllgroups",
  protectRoutes,
  adminOnly,
  async (req, res) => {
    try {
      const groups = await Group.find()
        .sort({ createdAt: -1 })
        .populate("members", "username email schoolId");

      res.json({ success: true, groups });
    } catch (error) {
      console.error("Error in GET /groups:", error);
      return res.status(500).json({
        success: false,
        message: `Internal Server Error: ${error.message}`,
      });
    }
  }
);

/** Search And Fetch Groups **/
adminRoutes.get("/group/", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search && search.trim() !== "") {
      const regex = new RegExp(search, "i");
      query = { name: regex };
    }

    const groups = await Group.find(query)
      .populate("members", "username email schoolId")
      .lean();

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error in GET /group:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/** Add Members To A Group **/
adminRoutes.post(
  "/group/addMembers/:groupId",
  protectRoutes,
  adminOnly,
  async (req, res) => {
    try {
      let { schoolId } = req.body;
      const { groupId } = req.params;

      if (!schoolId) {
        return res
          .status(400)
          .json({ success: false, message: "School ID(s) are required." });
      }

      // Normalize into array
      const schoolIds = Array.isArray(schoolId) ? schoolId : [schoolId];

      // Find target group
      const group = await Group.findById(groupId);
      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Group not found." });
      }

      const results = {
        added: [],
        skipped: [],
        notFound: [],
      };

      for (const id of schoolIds) {
        // Validate user exists (by schoolId)
        const user = await User.findOne({ schoolId: id });
        if (!user) {
          results.notFound.push(id);
          continue;
        }

        // Ensure user isn't already in ANY group
        const conflict = await Group.findOne({ members: user._id });
        if (conflict) {
          results.skipped.push({ schoolId: id, group: conflict.name });
          continue;
        }

        // Add user to group
        group.members.push(user._id);
        await group.save();

        // Update user with group reference
        user.group = group._id;
        await user.save();

        results.added.push({ schoolId: id, name: user.name || user.username });
      }

      res.status(200).json({
        success: true,
        message: "Processed member(s).",
        results,
        group,
      });
    } catch (error) {
      console.error("Error adding members:", error);
      res
        .status(500)
        .json({ success: false, message: `Server error: ${error.message}` });
    }
  }
);

/** Remove a single member from a group **/
adminRoutes.delete(
  "group/:groupId/members/:userId",
  protectRoutes,
  adminOnly,
  async (req, res) => {
    try {
      const { groupId, userId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Group not found." });
      }

      // Check if user is in the group
      if (!group.members.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: "User is not a member of this group.",
        });
      }

      // Remove member
      group.members = group.members.filter(
        (m) => m.toString() !== userId.toString()
      );
      await group.save();

      // Update the user -> set group to null
      await User.findByIdAndUpdate(userId, { $unset: { group: "" } });

      res.status(200).json({
        success: true,
        message: "Member removed successfully.",
        group,
      });
    } catch (error) {
      console.error("Error in DELETE /groups/:id/members/:userId:", error);
      return res.status(500).json({
        success: false,
        message: `Internal Server Error: ${error.message}`,
      });
    }
  }
);

/** Update Group Name **/
adminRoutes.put("group/:id", protectRoutes, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "New group name is required.",
      });
    }

    // Check if group exists
    const group = await Group.findById(id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found." });
    }

    // Ensure the new name is unique
    const existingGroup = await Group.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Another group with this name already exists.",
      });
    }

    group.name = name.trim();
    await group.save();

    res.status(200).json({
      success: true,
      message: "Group name updated successfully.",
      group,
    });
  } catch (error) {
    console.error("Error in PUT /groups/:id:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
});

/** Delete an entire Group **/
adminRoutes.delete("group/:id", protectRoutes, adminOnly, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found." });
    }

    await group.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /groups/:id:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
});

export default adminRoutes;
