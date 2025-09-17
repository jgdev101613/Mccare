/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, User, LogOut } from "lucide-react";

import quotes from "../data/quotes"; // ✅ import local quotes

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-green-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-green-700 text-white transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex items-center justify-between p-4 border-b border-green-600">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-4">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center w-full gap-2 text-left hover:text-green-300"
          >
            <User className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center w-full gap-2 text-left hover:text-green-300"
          >
            <User className="w-5 h-5" /> Profile
          </Link>
          {user.role == "admin" && (
            <Link
              to="/members"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center w-full gap-2 text-left hover:text-green-300"
            >
              <User className="w-5 h-5" /> Members
            </Link>
          )}
          {user.role == "admin" && (
            <Link
              to="/group"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center w-full gap-2 text-left hover:text-green-300"
            >
              <User className="w-5 h-5" /> Groups
            </Link>
          )}
          {user.role == "admin" && (
            <Link
              to="/attendance"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center w-full gap-2 text-left hover:text-green-300"
            >
              <User className="w-5 h-5" /> Attendance
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center w-full gap-2 text-left hover:text-green-300"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-green-600 shadow">
        <div className="flex gap-4">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1>Welcome {user.username}</h1>
        </div>
        <h1 className="text-lg font-bold">MCare</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
