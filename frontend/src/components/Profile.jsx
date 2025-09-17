/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";
// import api from "../api/api";
import { changePassword } from "../api";

// Icons
import { Eye, EyeOff } from "lucide-react";
import { PenLine, Camera, Download, Lock } from "lucide-react";

const Profile = () => {
  const { user, setUser, token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  if (!user) {
    return (
      <div className="p-6 text-center bg-white shadow-lg rounded-2xl">
        <p className="text-gray-500">No user information available.</p>
      </div>
    );
  }

  // Handle profile info update
  const handleSaveInfo = async () => {
    try {
      const res = await api.put(
        `/auth/update/${user._id}/information`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setUser(res.data.user);
        setModalOpen(false);
      }
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  console.log(user._id);
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
      const res = await api.put(
        `/auth/update/${user._id}/profile-image`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.data.success) {
        setUser(res.data.data);
        setImageModalOpen(false);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Image upload error:", err.response?.data || err.message);
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
        const qrLogoSize = 160;
        const qrLogoX = cardWidth / 2 - qrLogoSize / 2;
        const qrLogoY = qrY + qrSize / 2 - qrLogoSize / 2;

        // White safe background
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(
          qrLogoX - 20,
          qrLogoY - 20,
          qrLogoSize + 40,
          qrLogoSize + 40,
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
        <Info label="Section" value={user.section} />
        <Info label="Course" value={user.course} />
        <Info label="Department" value={user.department} />
        <Info
          label="Group"
          value={
            user.groups?.length > 0 ? user.groups[0].name : "Not in a group yet"
          }
        />
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
              onChange={(e) => setSelectedImage(e.target.files[0])}
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
                Upload
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
