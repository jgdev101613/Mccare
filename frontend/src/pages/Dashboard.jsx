/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
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
import { Briefcase, Clock, Star } from "lucide-react";
import { fetchUserDuties, fetchUserAttendance } from "../api";

import quotes from "../data/quotes"; // ✅ local quotes

const Dashboard = () => {
  const { user } = useAuth();
  const [duties, setDuties] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dutyMap, setDutyMap] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [error, setError] = useState("");

  // Fetch duties + attendance
  useEffect(() => {
    const fetchDuties = async () => {
      try {
        const { data } = await fetchUserDuties(user._id);
        setDuties(data.duties || []);

        // map duties by date
        const map = {};
        (data.duties || []).forEach((duty) => {
          const key = format(new Date(duty.date), "yyyy-MM-dd");
          if (!map[key]) map[key] = [];
          map[key].push(duty);
        });
        setDutyMap(map);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "Failed to fetch duties. Please try again.";
        setError("You don't belong to a group yet.");
      }
    };

    const fetchAttendance = async () => {
      try {
        const { data } = await fetchUserAttendance(user.schoolId);
        setAttendance(data.records || []);

        // map attendance by date
        const map = {};
        (data.records || []).forEach((rec) => {
          const key = format(new Date(rec.date), "yyyy-MM-dd");
          if (!map[key]) map[key] = [];
          map[key].push(rec);
        });
        setAttendanceMap(map);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "Failed to fetch attendance. Please try again.";
        setError(message);
      }
    };

    if (user?._id) {
      fetchDuties();
      fetchAttendance();
    }
  }, [user]);

  // random quotes
  const [quote, setQuote] = useState("");
  useEffect(() => {
    const changeQuote = () => {
      const idx = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[idx]);
    };
    changeQuote();
    const interval = setInterval(changeQuote, 5000);
    return () => clearInterval(interval);
  }, []);

  // calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedDuties = dutyMap[format(selectedDate, "yyyy-MM-dd")] || [];
  const selectedAttendance =
    attendanceMap[format(selectedDate, "yyyy-MM-dd")] || [];

  return (
    <div>
      <div className="p-2 bg-green-50">
        {/* ✅ Error Banner */}
        {error && (
          <div className="p-3 mb-4 font-medium text-center text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-green-700 rounded-full hover:bg-green-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 text-green-700 rounded-full hover:bg-green-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasDuty = dutyMap[key];
            const hasAttendance = attendanceMap[key];
            const selected = isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={[
                  "h-12 w-full rounded-xl relative flex items-center justify-center text-sm font-medium transition",
                  selected
                    ? "bg-green-600 text-white shadow-lg"
                    : "hover:bg-green-100",
                  inMonth ? "text-gray-900" : "text-gray-300",
                  isToday && !selected ? "text-green-600 font-bold" : "",
                ].join(" ")}
              >
                {/* Date number */}
                {format(day, "d")}

                {/* ✅ Markers at the top */}
                <div className="absolute flex items-center gap-1 -translate-x-1/2 bottom-[-10px] left-1/2">
                  {hasDuty &&
                    dutyMap[key].map((duty, i) => (
                      <span
                        key={i}
                        className="flex items-center justify-center px-1.5 h-[20px] text-[10px] font-bold text-pink-600 bg-pink-100 rounded"
                      >
                        {duty.area || "—"}
                      </span>
                    ))}

                  {hasAttendance && (
                    <span className="flex items-center justify-center px-1.5 h-[20px] text-[10px] font-bold text-green-600 bg-green-100 rounded">
                      <Clock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <hr />
        <div className="flex flex-col items-center justify-center w-full h-12 mt-6">
          <p className="text-sm italic text-center text-gray-700">
            "{quote.text}"
          </p>
        </div>

        {/* ✅ Attendance Info Panel */}
        <div className="p-4 mt-6 mb-4 bg-white shadow rounded-xl">
          <h3 className="mb-2 text-lg font-bold text-green-700">
            Attendance Info{" "}
            <span className="text-xs">
              ({format(selectedDate, "MMMM d, yyyy")})
            </span>
          </h3>
          {selectedAttendance.length > 0 ? (
            selectedAttendance.map((rec, i) => (
              <div
                key={rec._id || i}
                className="p-3 mb-2 bg-white border rounded-lg"
              >
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Time In:</span>{" "}
                  {rec.timeIn || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Created:</span>{" "}
                  {format(new Date(rec.createdAt), "PPpp")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              No attendance recorded for this day.
            </p>
          )}
        </div>

        {/* Duty info panel */}
        <div className="p-5 mt-6 bg-white shadow-md rounded-2xl">
          <h3 className="mb-3 text-lg font-bold text-green-700">
            Duty Info{" "}
            <span className="text-xs">
              {format(selectedDate, "MMMM d, yyyy")}
            </span>
          </h3>

          {selectedDuties.length > 0 ? (
            selectedDuties.map((duty, i) => (
              <div
                key={`${duty._id || i}`}
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
              </div>
            ))
          ) : (
            <p className="text-gray-500">No duties for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
