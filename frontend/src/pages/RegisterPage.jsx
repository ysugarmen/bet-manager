import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
  Typography,
  Stack,
  Card,
} from "@mui/material";
import AppTheme from "../shared-theme/AppTheme.jsx";
import ColorModeSelect from "../shared-theme/ColorModeSelect";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/apiClient.js";

export default function RegisterPage(props) {
  const navigate = useNavigate();

  // ✅ Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    termsAccepted: false,
  });

  // ✅ Error state
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    terms: "",
  });

  const [errorMessage, setErrorMessage] = useState(""); // General API error message

  // ✅ Handle input change
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Validate form inputs
  const validateInputs = () => {
    let valid = true;
    let newErrors = { username: "", email: "", password: "", terms: "" };

    if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long.";
      valid = false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
      valid = false;
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one digit.";
      valid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter.";
      valid = false;
    }

    if (!formData.termsAccepted) {
      newErrors.terms = "You must accept the terms and conditions.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ✅ Handle registration
  const handleRegister = async (event) => {
    event.preventDefault();

    if (!validateInputs()) return;

    try {
      const response = await apiClient.post("/users/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("username", formData.username);

      navigate("/home"); // Redirect on success
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: "fixed", top: "1rem", right: "1rem" }} />
      <Stack direction="column" sx={{ justifyContent: "center", padding: 3 }}>
        <Card sx={{ padding: 3, boxShadow: 3, maxWidth: 400, margin: "auto" }}>
          <Typography variant="h4" gutterBottom align="center">
            Sign Up
          </Typography>

          {errorMessage && <Typography color="error" align="center">{errorMessage}</Typography>}

          <Box component="form" onSubmit={handleRegister}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Username</FormLabel>
              <TextField
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                variant="outlined"
                required
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Email</FormLabel>
              <TextField
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                required
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel>Password</FormLabel>
              <TextField
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                required
              />
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
              }
              label="I agree to the terms and conditions"
            />
            {errors.terms && (
              <Typography color="error" variant="caption" sx={{ display: "block" }}>
                {errors.terms}
              </Typography>
            )}

            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Sign Up
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Link to="/" style={{ color: "blue", textDecoration: "none" }}>
              Login here
            </Link>
          </Typography>
        </Card>
      </Stack>
    </AppTheme>
  );
}
