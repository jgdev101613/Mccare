/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import React, { useEffect, useState } from "react";

// Utils
import { useDebounce } from "../hooks/useDebounce";

// Toast
import { showSuccessToast, showErrorToast } from "../utils/toast";

// Endpoints
import {
  adminfetchAllStudents,
  deleteStudent,
  updateStudentInformation,
} from "../api";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchMembers();
  }, []);

  // Apply filter only when debouncedSearch changes
  useEffect(() => {
    if (!debouncedSearch) {
      setFiltered(members);
    } else {
      setFiltered(
        members.filter(
          (m) =>
            m.schoolId?.toLowerCase().includes(debouncedSearch) ||
            m.name?.toLowerCase().includes(debouncedSearch)
        )
      );
    }
  }, [debouncedSearch, members]);

  const fetchMembers = async () => {
    try {
      const res = await adminfetchAllStudents();
      if (res.data.success) {
        setMembers(res.data.users);
        setFiltered(res.data.users);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      showErrorToast("Failed to load members");
    }
  };

  // search handler only updates state
  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  // update user
  const handleUpdate = async (id) => {
    try {
      const res = await updateStudentInformation(id, editingUser);
      if (res.data.success) {
        showSuccessToast("User updated successfully!");
        setEditingUser(null);
        fetchMembers();
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  // delete user
  const handleDelete = async (id) => {
    try {
      const res = await deleteStudent(id);
      if (res.data.success) {
        showSuccessToast("User deleted successfully!");
        setDeletingUser(null);
        fetchMembers();
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Delete error:", err.response?.data || err.message);
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
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage}
                alt={user.name}
                onClick={() => setPreviewImage(user.profileImage)}
                className="object-cover w-12 h-12 border border-gray-200 rounded-full shadow-sm"
              />
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  {user.schoolId} • {user.username}
                </p>
                <p className="text-xs text-gray-400">Email: {user.email}</p>
                <p className="text-xs text-gray-400">
                  Role: {user.role === "user" ? "Student" : user.role}{" "}
                  {user.group ? `• Group: ${user.group.name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
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

      {/* Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)} // close when clicking backdrop
        >
          {console.log(previewImage)}
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute px-3 py-1 text-sm font-extrabold text-white rounded-lg shadow-2xl top-2 right-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
