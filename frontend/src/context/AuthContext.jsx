import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "../api/api";
import { loginUser, registerUser } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true); // <-- added

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedToken) {
      setAuthToken(storedToken);
    }

    // Finish loading after checking localStorage
    setLoading(false);

    window.addEventListener("token-expired", logout);
    return () => {
      window.removeEventListener("token-expired", logout);
    };
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("token");
      setAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
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
      value={{ user, token, loading, setUser, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
