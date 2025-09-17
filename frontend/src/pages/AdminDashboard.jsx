/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Toaster
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [duties, setDuties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dutyMap, setDutyMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingDuty, setEditingDuty] = useState(null);
  const [deletingDuty, setDeletingDuty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    groupId: "",
    date: "",
    place: "",
    timeFrom: "",
    timeTo: "",
    clinicalInstructor: "",
    area: "",
  });

  const fetchAllDuties = async () => {
      try {
        const { data } = await api.get("/duties", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setDuties(data.duties);

        // map duties by date (yyyy-MM-dd)
        const map = {};
        data.duties.forEach((duty) => {
          const dutyDate = format(new Date(duty.date), "yyyy-MM-dd");
          if (!map[dutyDate]) map[dutyDate] = [];
          map[dutyDate].push(duty);
        });
        setDutyMap(map);
      } catch (err) {
        console.error("Error fetching all duties (admin):", err);
      } 
    };

    const fetchGroups = async () => {
      try {
        const { data } = await api.get("/group", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(data.groups || []);
      } catch (err) {
        console.error("Error fetching groups:", err);
      } 
    };

  // Fetch all duties
  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchAllDuties();
      fetchGroups();
    }
  }, [user, token]);

  // Calendar setup
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedDuties = dutyMap[format(selectedDate, "yyyy-MM-dd")] || [];

  // Handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingDuty(null);
    setForm({
      groupId: groups[0]?._id || "",
      date: format(new Date(), "yyyy-MM-dd"),
      place: "",
      time: "",
      clinicalInstructor: "",
      area: "",
    });
    setShowModal(true);
  };

  const openEditModal = (duty) => {
    setEditingDuty(duty);

    const [from = "", to = ""] = (duty.time || "").split(" - ");

    setForm({
      groupId: duty.group?._id || "",
      date: duty.date ? duty.date.split("T")[0] : "",
      place: duty.place,
      timeFrom: from,
      timeTo: to,
      clinicalInstructor: duty.clinicalInstructor,
      area: duty.area,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const dutyPayload = {
      ...form,
        time: `${form.timeFrom} - ${form.timeTo}`, // store as string
      };

      if (editingDuty) {
        // Edit duty
        await api.put(`/duties/${editingDuty._id}`, dutyPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add duty
        await api.post("/duties", dutyPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchAllDuties();
      setShowModal(false);// quick refresh
    } catch (err) {
      console.error("Error saving duty:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (e, duty) => {
    e.preventDefault();
    if (!duty?._id) return;

    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this duty?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                try {
                  await api.delete(`/duties/${duty._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  await fetchAllDuties();
                  toast.success("Duty deleted successfully!");
                } catch (err) {
                  toast.error(
                    err.response?.data?.message || "Failed to delete duty."
                  );
                }
                closeToast();
              }}
            >
              Confirm
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
              onClick={closeToast}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false } // keep it open until user acts
    );
  };

  return (
    <div>
      {/* Calendar header */}
      <div className="flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-green-100 text-green-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-green-100 text-green-700 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={openAddModal}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          + Add Duty
        </button>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 w-full text-center mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-sm font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-7 gap-2 w-full">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const hasDuty = dutyMap[dateKey];
            const isSelected = isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={`h-12 flex items-center justify-center rounded-full cursor-pointer relative text-sm font-medium transition
                  ${inMonth ? "text-gray-900" : "text-gray-300"}
                  ${isSelected ? "bg-green-600 text-white shadow-lg" : "hover:bg-green-100"}
                  ${(isToday && !isSelected ? "text-green-600" : "")}`}
              >
                <span>
                  {format(day, "d")}
                </span>

                {(hasDuty && !isSelected) && (
                  <span className="absolute bottom-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Duty info panel */}
      <div className="mt-6 bg-white shadow-md rounded-2xl p-5">
        <h3 className="text-lg font-bold text-green-700 mb-3">
          {format(selectedDate, "MMMM d, yyyy")}
        </h3>

        {selectedDuties.length > 0 ? (
          selectedDuties.map((duty, i) => (
            <div
              key={duty._id || i}
              className="p-4 mb-3 border rounded-xl bg-green-50 hover:shadow"
            >
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Group:</span>{" "}
                {duty?.group?.name || "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Place:</span>{" "}
                {duty.place || "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Time:</span>{" "}
                {duty.time || "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Clinical Instructor:</span>{" "}
                {duty.clinicalInstructor || "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Area:</span>{" "}
                {duty.area || "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Members:</span>{" "}
                {Array.isArray(duty?.group?.members)
                  ? duty.group.members.map((m) => m.name).join(", ")
                  : "—"}
              </p>
              <div className="flex gap-2">
                <button
                onClick={() => openEditModal(duty)}
                className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
              >
                Edit
              </button>
              <button
                onClick={(e) => handleDelete(e, duty)}
                className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
              >
                Delete Duty
              </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No duties for this day.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-green-700">
              {editingDuty ? "Edit Duty" : "Add Duty"}
            </h2>

            {/* Only select group when adding */}
            {!editingDuty && (
              <div className="mb-3">
                <label className="block text-sm font-medium">Group</label>
                <select
                  name="groupId"
                  value={form.groupId}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                >
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Place</label>
              <input
                type="text"
                name="place"
                value={form.place}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">From</label>
              <input
                type="time"
                name="timeFrom"
                value={form.timeFrom}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">To</label>
              <input
                type="time"
                name="timeTo"
                value={form.timeTo}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">
                Clinical Instructor
              </label>
              <input
                type="text"
                name="clinicalInstructor"
                value={form.clinicalInstructor}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Area</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                {isLoading ? "Loading.." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
