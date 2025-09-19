/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "../context/AuthContext";

// Toast
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { fetchStudent, markAttendance } from "../api";

const STORAGE_KEY = "scannedStudents";

const Attendance = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  // 📦 Load scanned students from localStorage (only if same day)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split("T")[0];

      if (parsed.date === today) {
        setStudents(parsed.students);
      } else {
        // New day → clear old records
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // 💾 Save scanned students to localStorage whenever it changes
  useEffect(() => {
    if (students.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, students })
      );
    }
  }, [students]);

  const getPHTime = () => {
    return new Date().toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // 24h format
      timeZone: "Asia/Manila",
    });
  };

  const handleScan = async (schoolId) => {
    if (!schoolId) return;

    console.log("Scanned schoolId:", schoolId);

    // vibrate feedback
    if (navigator.vibrate) navigator.vibrate(300);

    setLoading(true);
    try {
      const res = await markAttendance(schoolId);
      if (res.data?.success) {
        showSuccessToast(res.data.message);

        // ✅ Fetch student details
        const studentRes = await fetchStudent(schoolId);
        if (studentRes.data?.success) {
          // unwrap array → always use student object
          let scannedStudent = studentRes.data.user;
          if (Array.isArray(scannedStudent)) {
            scannedStudent = scannedStudent[0];
          }

          // Add scan time (PH time)
          scannedStudent = {
            ...scannedStudent,
            scannedAt: getPHTime(),
          };

          // Avoid duplicates (already scanned today)
          setStudents((prev) => {
            const exists = prev.some(
              (s) => s.schoolId === scannedStudent.schoolId
            );
            if (!exists) {
              return [...prev, scannedStudent];
            }
            return prev;
          });
        }
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message || "Scan failed");
      console.error("Update error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-green-50">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-green-700">
          Attendance Scanner
        </h1>
        <p className="text-sm text-green-600">
          Scan the QR code to mark attendance
        </p>
      </div>

      {/* Scanner */}
      <div className="w-full max-w-sm p-4 mb-6 bg-white shadow-md rounded-2xl">
        <div className="overflow-hidden border-4 border-green-600 rounded-xl">
          <Scanner
            onScan={(result) => {
              if (result?.[0]?.rawValue) {
                handleScan(result[0].rawValue);
              }
            }}
            onError={(err) => console.error(err)}
            constraints={{ facingMode: "environment" }}
            scanDelay={2000}
            className="w-full"
          />
        </div>

        {loading && (
          <p className="mt-4 font-semibold text-center text-green-700">
            Marking attendance...
          </p>
        )}
      </div>

      {/* Scanned students list */}
      <div className="w-full max-w-md space-y-3">
        <p className="font-semibold text-center text-gray-500">
          Today's Attendance
        </p>
        {students.map((s, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-white shadow rounded-xl"
          >
            <div>
              <h2 className="font-bold text-green-700">{s.name}</h2>
              <p className="text-sm text-gray-600">ID: {s.schoolId}</p>
              <p className="text-xs text-gray-500">Time: {s.scannedAt}</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
              Scanned
            </span>
          </div>
        ))}

        {students.length === 0 && (
          <p className="text-center text-gray-500">No students scanned yet</p>
        )}
      </div>
    </div>
  );
};

export default Attendance;
