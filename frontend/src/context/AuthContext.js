import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  if (!children) {
    throw new Error("AuthProvider must be used with children components");
  }

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("accessToken") || null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUserId = localStorage.getItem("userId");

    if (storedToken && storedUserId) {
      setToken(storedToken);

      apiClient
        .get("/users/user", { params: { user_id: storedUserId } })
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch user:", error.response ? error.response.data : error.message);
          logout();
        });
    }
  }, []);

  const login = (userData, accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userId", String(userData.id));
    setToken(accessToken);
    setUser(userData);
    const lastPage = localStorage.getItem("lastPage") || "/home";
    navigate(lastPage);
  };

  const logout = async () => {
    try {
      await apiClient.post("/users/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      setUser(null);
      setToken(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
