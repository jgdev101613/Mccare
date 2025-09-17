/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import React, { useEffect, useState } from "react";
// import api from "../api/api"; // axios instance
import { toast } from "react-toastify";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/auth/members");
      if (res.data.success) {
        setMembers(res.data.users);
        setFiltered(res.data.users);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  };

  // search filter
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setFiltered(
      members.filter(
        (m) =>
          m.schoolId?.toLowerCase().includes(value) ||
          m.name?.toLowerCase().includes(value)
      )
    );
  };

  // update user
  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/auth/update/${id}`, editingUser);
      if (res.data.success) {
        toast.success("User updated successfully!");
        setEditingUser(null);
        fetchMembers();
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update user.");
    }
  };

  // delete user
  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/auth/delete/${id}`);
      if (res.data.success) {
        toast.success("User deleted successfully!");
        setDeletingUser(null);
        fetchMembers();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete user.");
    }
  };

  return (
    <div className="p-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by School ID or Name"
        value={search}
        onChange={handleSearch}
        className="w-full p-2 mb-4 border rounded-lg"
      />

      {/* Members List */}
      <div className="space-y-4">
        {filtered.map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md"
          >
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">
                {user.schoolId} • {user.username}
              </p>
              <p className="text-xs text-gray-400">
                Role: {user.role}{" "}
                {user.group ? `• Group: ${user.group.name}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(user)}
                className="px-3 py-1 text-sm text-white bg-blue-500 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => setDeletingUser(user)}
                className="px-3 py-1 text-sm text-white bg-red-500 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">
              Edit User ({editingUser.schoolId})
            </h2>

            <p className="px-1 mb-2 text-sm text-gray-400">School ID:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="School ID"
              value={editingUser.schoolId || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, schoolId: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Username:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Username"
              value={editingUser.username || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Name:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Name"
              value={editingUser.name || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, name: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Section:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Section"
              value={editingUser.section || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, section: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Course:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Course"
              value={editingUser.course || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, course: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Department:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Department"
              value={editingUser.department || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, department: e.target.value })
              }
            />

            <p className="px-1 mb-2 text-sm text-gray-400">Role:</p>
            <select
              className="w-full p-2 mb-4 border rounded"
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-blue-600 rounded"
                onClick={() => handleUpdate(editingUser._id)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-6 text-center bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Delete User</h2>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingUser.name}</span>?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 rounded"
                onClick={() => handleDelete(deletingUser._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
