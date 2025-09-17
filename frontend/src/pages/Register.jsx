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

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({email: "", username: "", password: "", name: "", course: "", year: "", section: "", department: "", schoolId: ""});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      
      toast.success('Register Successfully', {
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
      console.log(err.response.data)
      toast.error('Registration Failed: ' + errorMessage, {
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
    <div className="flex flex-col justify-center items-center pt-4 pb-12 h-full md:h-screen bg-yellow-100 px-6">
      <img src="/mcare.png" alt="logo" className="w-24 mb-6" />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-6 p-x w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-yellow-700 mb-4 text-center">
          Register
        </h2>
        <input
          type="text"
          placeholder="School ID"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.schoolId}
          onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Course"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Year"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          max="4"
          min="1"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="section"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.section}
          onChange={(e) => setForm({ ...form, section: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Department"
          className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-yellow-600"
        >
          Register
        </button>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 font-semibold">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
