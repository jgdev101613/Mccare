/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
// import api from "../api/api";
import {
  changePassword,
  fetchUserAttendance,
  fetchUserDuties,
  updateProfileImage,
  updateUserInformation,
} from "../api";

// Icons
import { Eye, EyeOff } from "lucide-react";
import { PenLine, Camera, Download, Lock } from "lucide-react";

// Toast
import { showSuccessToast, showErrorToast } from "../utils/toast";

// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Profile = () => {
  const { user, setUser, token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadingLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    section: user?.section || "",
    course: user?.course || "",
    department: user?.department || "",
  });
  const [passFormData, setPassFormData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  // New state for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [duties, setDuties] = useState([]);

  if (!user) {
    return (
      <div className="p-6 text-center bg-white shadow-lg rounded-2xl">
        <p className="text-gray-500">No user information available.</p>
      </div>
    );
  }

  // Fetch attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await fetchUserAttendance(user.schoolId);
        setAttendance(data.records || []);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "Failed to fetch attendance. Please try again.";
        showErrorToast(message);
      }
    };

    const fetchDuties = async () => {
      try {
        const { data } = await fetchUserDuties(user._id);
        setDuties(data.duties || []);
        console.log(duties);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "Failed to fetch duties. Please try again.";
        console.error(message);
      }
    };

    if (user?._id) {
      fetchDuties();
      fetchAttendance();
    }
  }, []);

  // Generate Attendance PDF
  const handleGenerateAttendancePDF = async () => {
    if (attendance.length === 0)
      return showErrorToast("You don't have an attendance yet.");
    const records = attendance && attendance.length ? attendance : [];

    // --- helper to load logo into a dataURL (avoids onload timing issues) ---
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    // Attempt to load the logo; if it fails we just continue without logo
    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      // fallback: continue without logo
      console.warn("Could not load logo for PDF watermark:", err);
      logoDataUrl = null;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    // generated timestamp for footer (bottom-left)
    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // prepare table rows (index, formatted date, formatted time)
    const tableColumn = ["#", "Date", "Time In"];
    const tableRows = records.map((record, i) => {
      const dateObj = new Date(record.date);
      const formattedDate = dateObj.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      // parse timeIn "HH:MM:SS"
      const [h, m, s] = (record.timeIn || "00:00:00").split(":").map(Number);
      const timeObj = new Date();
      timeObj.setHours(h, m, s || 0);
      const formattedTime = timeObj.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return [i + 1, formattedDate, formattedTime];
    });

    // Generate table with header + repeated page hooks
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [22, 163, 74], // green borders
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [22, 163, 74], // green header
        textColor: [255, 255, 255],
        halign: "center",
        valign: "middle",
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: {
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244], // light green row
      },
      // This is called for each page after table content - we draw header/footer/watermark here
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;

        // --- faint logo watermark (center) ---
        if (logoDataUrl) {
          try {
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            const imgW = 220;
            const imgH = 220;
            doc.addImage(
              logoDataUrl,
              "PNG",
              (pageWidth - imgW) / 2,
              (pageHeight - imgH) / 2,
              imgW,
              imgH,
              undefined,
              "FAST"
            );
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            // if setGState or addImage fails for some reason, ignore and continue
            console.warn("logo watermark draw failed:", e);
          }
        }

        // --- repeated watermark text (diagonal, faint) ---
        try {
          doc.setFontSize(48);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "bold");
          doc.setGState(new doc.GState({ opacity: 0.06 }));
          for (let y = 80; y < pageHeight; y += 180) {
            for (let x = -50; x < pageWidth; x += 220) {
              doc.text("MCare", x, y, { angle: 35 });
            }
          }
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (e) {
          // if GState isn't available in this environment, the watermark will still show lighter because of color
          console.warn("watermark draw issue:", e);
        }

        // --- Header (on top so it's always readable) ---
        doc.setFontSize(18);
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance Report", margin.left, 40);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${user?.name || "Test User"}`, margin.left, 60);
        doc.text(`School ID: ${user?.schoolId || "—"}`, margin.left, 76);

        // --- Generated at (bottom-left) ---
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);

        // --- Page number (bottom-right) ---
        doc.text(
          `Page ${pageNumber}`,
          pageWidth - margin.right - 40,
          pageHeight - 30
        );
      },
    });

    // finally save
    doc.save(`${user?.username || "attendance"}_attendance.pdf`);
  };

  // Generate Duties PDF
  const handleGenerateDutiesPDF = async () => {
    if (duties.length === 0)
      return showErrorToast("You don't have duties yet.");

    const records = duties && duties.length ? duties : [];

    // helper to load logo
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      console.warn("Could not load logo for PDF watermark:", err);
      logoDataUrl = null;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    // generated timestamp for footer
    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Prepare table data
    const tableColumn = [
      "Date",
      "Group",
      "Time",
      "Clinical Instructor",
      "Place",
      "Area",
    ];
    const tableRows = records.map((duty) => {
      // Date
      const dateObj = new Date(duty.date);
      const formattedDate = dateObj.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Time (format range if possible)
      let formattedTime = duty.time || "—";
      try {
        if (formattedTime.includes("-")) {
          const [start, end] = formattedTime.split("-").map((t) => t.trim());
          const convertTo12Hour = (t) => {
            const [h, m] = t.split(":").map(Number);
            const d = new Date();
            d.setHours(h, m, 0);
            return d.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          };
          formattedTime = `${convertTo12Hour(start)} - ${convertTo12Hour(end)}`;
        }
      } catch (err) {
        console.warn("Time parse failed:", err);
      }

      return [
        formattedDate,
        duty.group?.name || "—",
        formattedTime,
        duty.clinicalInstructor || "—",
        duty.place || "—",
        duty.area || "—",
      ];
    });

    // Table with header/footer/watermark
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [22, 163, 74],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        halign: "center",
        valign: "middle",
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: {
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;

        // watermark logo
        if (logoDataUrl) {
          try {
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            const imgW = 220;
            const imgH = 220;
            doc.addImage(
              logoDataUrl,
              "PNG",
              (pageWidth - imgW) / 2,
              (pageHeight - imgH) / 2,
              imgW,
              imgH,
              undefined,
              "FAST"
            );
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            console.warn("logo watermark draw failed:", e);
          }
        }

        // repeated text watermark
        try {
          doc.setFontSize(48);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "bold");
          doc.setGState(new doc.GState({ opacity: 0.06 }));
          for (let y = 80; y < pageHeight; y += 180) {
            for (let x = -50; x < pageWidth; x += 220) {
              doc.text("MCare", x, y, { angle: 35 });
            }
          }
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (e) {
          console.warn("watermark draw issue:", e);
        }

        // Header
        doc.setFontSize(18);
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("Duties Report", margin.left, 40);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${user?.name || "Test User"}`, margin.left, 60);
        doc.text(`School ID: ${user?.schoolId || "—"}`, margin.left, 76);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);

        doc.text(
          `Page ${pageNumber}`,
          pageWidth - margin.right - 40,
          pageHeight - 30
        );
      },
    });

    // Save PDF
    doc.save(`${user?.username || "duties"}_duties.pdf`);
  };

  // Handle profile info update
  const handleSaveInfo = async () => {
    try {
      const res = await updateUserInformation(user._id, formData);
      if (res.data.success) {
        showSuccessToast(res.data.message);
        setUser(res.data.user);
        setModalOpen(false);
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  // Handle profile info update
  const handleChangePassword = async () => {
    try {
      setLoading(true);
      // const res = await api.put(`/auth/update/${user._id}/information`,formData);
      const res = await changePassword(passFormData, user._id);
      if (res.data.success) {
        showSuccessToast(res.data.message);
        setPasswordModalOpen(false);
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Update error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image update
  const handleSaveImage = async () => {
    if (!selectedImage) return;
    const data = new FormData();
    data.append("image", selectedImage);

    try {
      setImageUploadingLoading(true);
      const res = await updateProfileImage(user._id, data);
      if (res.data.success) {
        showSuccessToast(res.data.message);
        setUser(res.data.data);
        setImageModalOpen(false);
        setSelectedImage(null);
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Image upload error:", err.response?.data || err.message);
    } finally {
      setImageUploadingLoading(false);
    }
  };

  // Handle QR download with high quality
  const handleDownloadQR = () => {
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.src = user.qrCode;

    qrImg.onload = () => {
      const cardWidth = 1000;
      const cardHeight = 1400;

      const canvas = document.createElement("canvas");
      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext("2d");

      // --- Background Gradient ---
      const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight);
      gradient.addColorStop(0, "#16a34a"); // green-600
      gradient.addColorStop(1, "#fde047"); // yellow-300
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // --- White Card with Rounded Corners ---
      const margin = 80;
      const radius = 60;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(
        margin,
        margin,
        cardWidth - margin * 2,
        cardHeight - margin * 2,
        radius
      );
      ctx.fill();

      // --- Logo ---
      const logo = new Image();
      logo.src = "/mcare.png";

      logo.onload = () => {
        const logoSize = 200;
        ctx.drawImage(
          logo,
          cardWidth / 2 - logoSize / 2,
          150,
          logoSize,
          logoSize
        );

        // --- User Info ---
        ctx.fillStyle = "#111827"; // gray-900
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(user.name, cardWidth / 2, 420);

        ctx.fillStyle = "#374151"; // gray-700
        ctx.font = "40px sans-serif";
        ctx.fillText(`•••• ${user.schoolId.slice(-4)}`, cardWidth / 2, 480);

        // --- QR Code ---
        const qrSize = 700;
        const qrX = cardWidth / 2 - qrSize / 2;
        const qrY = 520;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // --- Overlay Logo (inside QR) ---
        const qrLogoSize = 100;
        const qrLogoX = cardWidth / 2 - qrLogoSize / 2;
        const qrLogoY = qrY + qrSize / 2 - qrLogoSize / 2;

        // White safe background
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(
          qrLogoX - 10,
          qrLogoY - 10,
          qrLogoSize + 20,
          qrLogoSize + 20,
          30
        );
        ctx.fill();

        ctx.drawImage(logo, qrLogoX, qrLogoY, qrLogoSize, qrLogoSize);

        // --- Footer ---
        ctx.fillStyle = "#6b7280"; // gray-500
        ctx.font = "32px sans-serif";
        ctx.fillText("Scan this QR Code", cardWidth / 2, cardHeight - 120);

        // --- Download ---
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png", 1.0);
        link.download = `${user.username}_qr.png`;
        link.click();
      };
    };
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white shadow-lg rounded-2xl">
      {/* Header */}
      <div className="relative flex flex-row items-center justify-center mb-6">
        <h2 className="text-2xl font-bold text-green-700">Profile</h2>
        <div className="absolute right-0">
          <div className="flex gap-2">
            <button onClick={() => setModalOpen(true)} className="">
              <PenLine
                size={16}
                className="text-green-700 hover:text-green-950"
              />
            </button>
            <button onClick={() => setPasswordModalOpen(true)} className="">
              <Lock size={16} className="text-green-700 hover:text-green-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Image with edit icon */}
      <div className="relative flex justify-center mb-6">
        <img
          src={user.profileImage}
          alt="Profile"
          className="object-cover w-32 h-32 border-4 border-green-100 rounded-full shadow-lg md:w-40 md:h-40"
        />
        <button
          onClick={() => setImageModalOpen(true)}
          className="absolute bottom-0 right-[35%] bg-green-600 p-2 rounded-full shadow hover:bg-green-800"
        >
          <Camera size={16} className="text-white" />
        </button>
      </div>

      {/* User Info */}
      <div className="space-y-3 text-gray-700">
        <Info label="School ID" value={user.schoolId} />
        <Info
          label="Role"
          value={user.role === "admin" ? "Admin" : "Student"}
        />
        <Info label="Name" value={user.name} />
        <Info label="Email" value={user.email} />
        <Info label="Username" value={user.username} />
        {user.role !== "admin" && (
          <>
            <Info label="Section" value={user.section} />
            <Info label="Course" value={user.course} />
            <Info label="Department" value={user.department} />
            <Info
              label="Group"
              value={
                user.groups?.length > 0
                  ? user.groups[0].name
                  : "Not in a group yet"
              }
            />
          </>
        )}
      </div>

      {/* QR Code */}
      {user.qrCode && user.role !== "admin" && (
        <div className="mt-8 text-center">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Your Attendance QR Code
          </h3>
          <div className="inline-block p-4 shadow-md bg-gray-50 rounded-xl">
            <img
              src={user.qrCode}
              alt="User QR Code"
              className="p-2 bg-white border shadow-sm w-52 h-52 rounded-xl"
            />
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Download size={16} /> Download QR
            </button>
          </div>
        </div>
      )}

      {user.role !== "admin" && (
        <div className="flex flex-col">
          <p className="mt-5 font-semibold text-center text-md">Data Reports</p>
          <button
            onClick={handleGenerateAttendancePDF}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Attendance PDF
          </button>
          <button
            onClick={handleGenerateDutiesPDF}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Duties PDF
          </button>
        </div>
      )}

      {/* Profile Info Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-6 bg-white shadow-lg rounded-xl w-96">
            <h3 className="mb-4 text-lg font-bold">Edit Profile Info</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold">Name:</label>
                <input
                  type="text"
                  placeholder="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Section:</label>
                <input
                  type="text"
                  placeholder="section"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Course:</label>
                <input
                  type="text"
                  placeholder="course"
                  value={formData.course}
                  onChange={(e) =>
                    setFormData({ ...formData, course: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-bold">Department:</label>
                <input
                  type="text"
                  placeholder="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInfo}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Edit Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-6 bg-white shadow-lg rounded-xl w-96">
            <h3 className="mb-4 text-lg font-bold">Change Password</h3>
            <div className="space-y-3">
              {/* Current Password Field */}
              <div className="relative">
                <label className="text-sm font-bold">Current Password:</label>
                <input
                  // Use the new state for this input field's type
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current Password"
                  value={passFormData.currentPassword}
                  onChange={(e) =>
                    setPassFormData({
                      ...passFormData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border rounded-lg"
                />
                <button
                  type="button"
                  // Toggle the state specific to this field
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 top-6"
                >
                  {/* Use the new state to determine the icon */}
                  {showCurrentPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {/* New Password Field */}
              <div className="relative">
                <label className="text-sm font-bold">New Password:</label>
                <input
                  // Use the new state for this input field's type
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={passFormData.newPassword}
                  onChange={(e) =>
                    setPassFormData({
                      ...passFormData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border rounded-lg"
                />
                <button
                  type="button"
                  // Toggle the state specific to this field
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 top-6"
                >
                  {/* Use the new state to determine the icon */}
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                {loading ? "Saving.." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Edit Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-6 bg-white shadow-lg rounded-xl w-96">
            <h3 className="mb-4 text-lg font-bold">Update Profile Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Check for HEIC/HEIF
                if (
                  file.type === "image/heic" ||
                  file.type === "image/heif" ||
                  file.name.toLowerCase().endsWith(".heic") ||
                  file.name.toLowerCase().endsWith(".heif")
                ) {
                  showErrorToast(
                    "HEIC/HEIF images are not supported. Please upload a JPG or PNG."
                  );
                  e.target.value = ""; // reset input
                  return;
                }

                setSelectedImage(file);
              }}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImage}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                {imageUploadLoading ? "Uploading.." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Info component
const Info = ({ label, value }) => (
  <p className="flex items-center justify-between px-3 py-2 rounded-lg shadow-sm bg-gray-50">
    <span className="font-semibold text-gray-800">{label}:</span>
    <span
      className={`${
        value && !value.includes("Not") ? "text-gray-600" : "text-red-500"
      }`}
    >
      {value}
    </span>
  </p>
);

export default Profile;
