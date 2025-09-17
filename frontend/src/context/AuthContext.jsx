/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { createContext, useContext, useState, useEffect } from "react";

// Axioswrapper && Endpoints
import { setAuthToken } from "../api/api";
import { loginUser, registerUser } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Restore user from localStorage and set the auth token on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedToken) {
      // Set the token on app load if it exists in localStorage
      setAuthToken(storedToken);
    }
  }, []);

  // Sync localStorage and the axios header whenever token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token); // Set the header whenever the token state changes
    } else {
      localStorage.removeItem("token");
      setAuthToken(null); // Remove the header when the token is null
    }
  }, [token]);

  // Sync localStorage whenever user changes
  useEffect(() => {
    if (user) {
      console.log(user);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });

    if (res.data.token) {
      setToken(res.data.token);

      if (res.data.user) {
        setUser(res.data.user);
      }
    }
    return res.data;
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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
