/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
// import api from "../api/api";

const Attendance = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleScan = async (scannedUrl) => {
    if (!scannedUrl) return;

    console.log("Scanned URL:", scannedUrl);

    // Extract schoolId from the URL (last path segment)
    const parts = scannedUrl.split("/");
    const schoolId = parts[parts.length - 1];

    console.log("Extracted schoolId:", schoolId);

    setLoading(true);
    try {
      const res = await api.get(`/attendance/mark/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Axios automatically parses JSON, so `res.data`
      if (res.data?.success) {
        toast.success("Attendance Marked", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      } else {
        throw new Error(res.data?.message || "Failed to mark attendance");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
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
