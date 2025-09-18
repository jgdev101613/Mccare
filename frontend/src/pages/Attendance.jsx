/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "../context/AuthContext";
// import api from "../api/api";

// Toast
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { markAttendance } from "../api";

const Attendance = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

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

      <div className="w-full max-w-sm p-4 bg-white shadow-md rounded-2xl">
        <div className="overflow-hidden border-4 border-green-600 rounded-xl">
          <Scanner
            onScan={(result) => {
              if (result?.[0]?.rawValue) {
                handleScan(result[0].rawValue);
              }
            }}
            onError={(err) => console.error(err)}
            constraints={{ facingMode: "environment" }}
            scanDelay={2000} // throttles repeated scans
            className="w-full"
          />
        </div>

        {loading && (
          <p className="mt-4 font-semibold text-center text-green-700">
            Marking attendance...
          </p>
        )}
      </div>
    </div>
  );
};

export default Attendance;
