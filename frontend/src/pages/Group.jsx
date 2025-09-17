/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import React, { useEffect, useState } from "react";
// import api from "../api/api"; // axios instance
import { toast } from "react-toastify";

import { useCallback } from "react";

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const Group = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [addGroupModal, setAddGroupModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [manageMembers, setManageMembers] = useState(null);
  const [addMembers, setAddMembers] = useState(null);
  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  // Inputs
  const [groupName, setGroupName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const debouncedGroupSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        fetchGroups(); // reload all groups if search is cleared
        return;
      }
      try {
        const res = await api.get(`/group/groupid?search=${query}`);
        if (res.data.success) {
          setGroups(res.data.groups);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to search groups");
      }
    }, 200),
    []
  );

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/group");
      if (res.data.success) setGroups(res.data.groups);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch groups");
    }
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    try {
      const res = await api.post("/group", {
        name: groupName,
        members: selectedMembers,
      });
      if (res.data.success) {
        toast.success("Group created!");
        setAddGroupModal(false);
        setGroupName("");
        setSelectedMembers([]);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error creating group");
    }
  };

  const handleDeleteGroup = (id) => {
    setConfirmAction({
      message: "Are you sure you want to delete this group?",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/group/${id}`);
          if (res.data.success) {
            toast.success("Group deleted");
            fetchGroups();
          }
        } catch (err) {
          console.error(err);
          toast.error("Error deleting group");
        }
      },
    });
  };

  const handleUpdateName = async () => {
    try {
      const res = await api.put(`/group/${editGroup._id}`, { name: groupName });
      if (res.data.success) {
        toast.success("Group name updated");
        setEditGroup(null);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating group name");
    }
  };

  const handleAddMembers = async () => {
    try {
      const res = await api.post(`/group/${addMembers._id}/members`, {
        schoolId: selectedMembers,
      });
      if (res.data.success) {
        toast.success("Members added!");
        setAddMembers(null);
        setSelectedMembers([]);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding members");
    }
  };

  const handleRemoveMember = (groupId, userId) => {
    setConfirmAction({
      message: "Are you sure you want to remove this member?",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/group/${groupId}/members/${userId}`);
          if (res.data.success) {
            toast.success("Member removed");

            // ✅ Update local state so modal reflects change immediately
            setManageMembers((prev) => ({
              ...prev,
              members: prev.members.filter((m) => m._id !== userId),
            }));

            fetchGroups(); // keep global list in sync
          }
        } catch (err) {
          console.error(err);
          toast.error("Error removing member");
        }
      },
    });
  };

  // Fake dynamic search (replace with real endpoint)
  const handleSearchMembers = useCallback(
    debounce(async (query) => {
      setMemberSearch(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/auth/members/user?search=${query}`);
        if (res.data.success) {
          setSearchResults(res.data.users);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to search members");
      }
    }, 100),
    []
  );

  return (
    <div className="p-4">
      {/* Group Search */}
      <input
        type="text"
        placeholder="Search groups..."
        className="w-full p-2 mb-4 border rounded"
        onChange={(e) => debouncedGroupSearch(e.target.value)}
      />
      {/* Add Group Button */}
      <button
        onClick={() => setAddGroupModal(true)}
        className="w-full py-2 mb-4 text-white bg-blue-600 rounded-lg"
      >
        + Create Group
      </button>

      {/* Groups */}
      {loading ? (
        <p>Loading groups...</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g._id}
              className="p-4 space-y-2 bg-white rounded-lg shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{g.name}</h2>
                <button
                  onClick={() => handleDeleteGroup(g._id)}
                  className="text-sm text-red-500"
                >
                  Delete
                </button>
              </div>

              {/* Members */}
              <div className="text-sm text-gray-600">
                {g.members.length > 0 ? (
                  g.members.slice(0, 3).map((m) => (
                    <span key={m._id} className="block">
                      {m.username} ({m.email})
                    </span>
                  ))
                ) : (
                  <p>No members</p>
                )}
                {g.members.length > 3 && (
                  <p className="text-blue-500">
                    +{g.members.length - 3} more...
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => {
                    setEditGroup(g);
                    setGroupName(g.name);
                  }}
                >
                  Edit Name
                </button>
                <button
                  className="px-3 py-1 text-white bg-green-500 rounded"
                  onClick={() => setAddMembers(g)}
                >
                  Add Members
                </button>
                <button
                  className="px-3 py-1 text-white bg-orange-500 rounded"
                  onClick={() => {
                    setManageMembers(g);
                  }}
                >
                  Manage Members
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Add Group Modal --- */}
      {addGroupModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Create Group</h2>
            <input
              className="w-full p-2 mb-3 border rounded"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {/* Search and select members */}
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Search members by School ID or Name"
              value={memberSearch}
              onChange={(e) => handleSearchMembers(e.target.value)}
            />
            <div className="mb-2 overflow-y-auto max-h-32">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-1 border-b"
                >
                  <span>
                    {u.name} ({u.schoolId})
                  </span>
                  <button
                    className="text-sm text-blue-600"
                    onClick={() =>
                      setSelectedMembers((prev) =>
                        prev.includes(u.schoolId) ? prev : [...prev, u.schoolId]
                      )
                    }
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMembers.map((id) => (
                <span
                  key={id}
                  className="px-2 py-1 text-blue-700 bg-blue-100 rounded"
                >
                  {id}
                </span>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setAddGroupModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-blue-600 rounded"
                onClick={handleCreateGroup}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Group Name Modal --- */}
      {editGroup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Edit Group Name</h2>
            <input
              className="w-full p-2 mb-4 border rounded"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setEditGroup(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-blue-600 rounded"
                onClick={handleUpdateName}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Members Modal --- */}
      {addMembers && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">
              Add Members to {addMembers.name}
            </h2>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Search members"
              value={memberSearch}
              onChange={(e) => handleSearchMembers(e.target.value)}
            />
            <div className="mb-2 overflow-y-auto max-h-32">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-1 border-b"
                >
                  <span>
                    {u.name} ({u.schoolId})
                  </span>
                  <button
                    className="text-sm text-blue-600"
                    onClick={() =>
                      setSelectedMembers((prev) =>
                        prev.includes(u.schoolId) ? prev : [...prev, u.schoolId]
                      )
                    }
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMembers.map((id) => (
                <span
                  key={id}
                  className="px-2 py-1 text-blue-700 bg-blue-100 rounded"
                >
                  {id}
                </span>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setAddMembers(null);
                  setMemberSearch(""); // reset search
                  setSearchResults([]); // reset results
                  setSelectedMembers([]); // reset selected members
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-green-600 rounded"
                onClick={handleAddMembers}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Manage Members Modal --- */}
      {manageMembers && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">
              Manage Members in {manageMembers.name}
            </h2>
            <div className="space-y-2 overflow-y-auto max-h-64">
              {manageMembers.members.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between pb-1 border-b"
                >
                  <span>
                    {m.username} ({m.schoolId})
                  </span>
                  <button
                    className="text-sm text-red-500"
                    onClick={() => handleRemoveMember(manageMembers._id, m._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setManageMembers(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Confirmation Modal --- */}
      {confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-6 bg-white rounded-lg">
            <p className="mb-6 text-lg text-center">{confirmAction.message}</p>
            <div className="flex justify-center space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 rounded"
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Group;
