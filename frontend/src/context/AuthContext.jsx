/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";
import { loginUser } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Restore user from localStorage when app loads
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      console.log(user);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    // const res = await api.post("/auth/login", { email, password });
    const res = await loginUser({ email, password });

    console.log(res);

    if (res.data.token) {
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);

      // store user info if backend sends it
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    }
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);

    // if (res.data.token) {
    //   setToken(res.data.token);
    //   localStorage.setItem("token", res.data.token);

    //   if (res.data.user) {
    //     setUser(res.data.user);
    //     localStorage.setItem("user", JSON.stringify(res.data.user));
    //   }
    // }
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, setUser, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
