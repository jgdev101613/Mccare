/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Toaster
import { toast } from "react-toastify";

const ProfRegister = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    name: "",
    department: "",
    schoolId: "",
    role: "professor",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);

      toast.success("Register Successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      navigate("/login");
    } catch (err) {
      const errorMessage = err.response.data.message;
      console.log(err.response.data);
      toast.error("Registration Failed: " + errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 pt-4 pb-12 bg-yellow-100 md:h-screen">
      <img src="/mcare.png" alt="logo" className="w-24 mb-6" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 bg-white shadow-md rounded-2xl p-x"
      >
        <div className="mb-4 tracking-widest">
          <h2 className="text-2xl font-bold text-center text-yellow-700">
            Register
          </h2>
          <p className="text-sm text-center">
            Register your professor's account
          </p>
        </div>
        <input
          type="text"
          placeholder="Employee ID"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.schoolId}
          onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Email"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Department"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full py-3 font-bold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600"
        >
          Register
        </button>
        <p className="mt-4 text-sm text-center">
          After registration, your account will be verified by admin before you
          can login
        </p>
        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ProfRegister;
