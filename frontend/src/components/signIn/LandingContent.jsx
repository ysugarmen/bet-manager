import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const Content = () => {
  return (
    <Box sx={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Welcome to BetManager
      </Typography>
      <Typography variant="body1" paragraph>
        BetManager helps you keep track of your bets on the Champions League. Sign up to start placing your bets and competing with others on the leaderboard.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
        <Typography variant="body1">
          Still don’t have an account?{" "}
          <Link to="/register" style={{ color: "blue", textDecoration: "none", fontWeight: "bold" }}>
            Register here
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};

export default Content;
