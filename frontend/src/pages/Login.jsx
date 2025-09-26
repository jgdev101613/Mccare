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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      toast.success("Logged In Successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response.data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 bg-green-100">
      <img src="/mcare.png" alt="logo" className="w-24 mb-6" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 bg-white shadow-md rounded-2xl"
      >
        <h2 className="mb-4 text-2xl font-bold text-center text-green-700">
          Login
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          Login
        </button>
        <p className="mt-4 text-sm text-center">
          <Link
            to="/register"
            className="font-semibold text-yellow-600 hover:underline"
          >
            Register Student Account
          </Link>
        </p>
        <p className="text-sm text-center">
          <Link
            to="/prof-register"
            className="font-semibold text-yellow-300 hover:underline"
          >
            Register Professor Account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
