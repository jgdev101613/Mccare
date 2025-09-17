/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard"; // ✅ new
import Profile from "./components/Profile";
import Members from "./pages/Members";
import Group from "./pages/Group";
import Attendance from "./pages/Attendance";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./context/AuthContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { user } = useAuth();

  return (
    <Router>
      {/* your routes etc */}
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />

        {/* Protected */}
        {user && (
          <Route element={<DashboardLayout />}>
            {/* Normal user */}
            {user.role === "user" && (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
              </>
            )}

            {/* Admin */}
            {user.role === "admin" && (
              <>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/members" element={<Members />} />
                <Route path="/group" element={<Group />} />
                <Route path="/attendance" element={<Attendance />} />
              </>
            )}
          </Route>
        )}

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? user.role === "admin"
                    ? "/admin-dashboard"
                    : "/dashboard"
                  : "/login"
              }
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
