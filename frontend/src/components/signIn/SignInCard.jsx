import React, { useState } from "react";
import { Card, CardContent, Typography, Button, TextField, Box } from "@mui/material";

const SignInCard = ({ onSubmit, errorMessage }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <Card sx={{ maxWidth: 400, margin: "auto", boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          Sign In
        </Typography>
        {errorMessage && <Typography color="error" align="center">{errorMessage}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Sign In
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignInCard;
