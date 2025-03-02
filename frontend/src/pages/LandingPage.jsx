import React, { useContext, useEffect, useState } from "react";
import { CssBaseline, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AppTheme from "../shared-theme/AppTheme.jsx";
import SignInCard from "../components/signIn/SignInCard";
import Content from "../components/signIn/LandingContent";
import apiClient from "../api/apiClient.js";

export default function LandingPage(props) {
  const { user, login } = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // 🔹 Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleLogin = async (username, password) => {
    try {
      const response = await apiClient.post("/users/login", { username, password });
      const { access_token, user } = response.data;

      login(user, access_token); // Store user & token in context
      navigate("/home"); // Redirect after login
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Login failed");
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Stack
        direction="column"
        component="main"
        sx={{
          justifyContent: "center",
          height: "100vh",
          marginTop: "max(40px, 0px)",
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "center", p: 2 }}>
          <Content />
          <SignInCard onSubmit={handleLogin} errorMessage={errorMessage} />
        </Stack>
      </Stack>
    </AppTheme>
  );
}
