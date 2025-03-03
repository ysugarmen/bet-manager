import React, { useEffect, useState } from "react";
import { Box, CssBaseline, Typography, Toolbar, Grid, Paper, CircularProgress } from "@mui/material";
import NavbarDrawer from "../components/general/NavbarDrawer";
import BetCard from "../components/betsPage/BetCard";
import apiClient from "../api/apiClient";

const BetsHistoryPage = () => {
  const [betsHistory, setBetsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchBetsHistory();
    }
  }, [userId]);

  const fetchBetsHistory = async () => {
    try {
      const response = await apiClient.get(`/bets/user/${userId}/bets/history`);
      setBetsHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch bets history:", error);
      setBetsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", overflowX: "hidden" }}>
      <CssBaseline />
      <NavbarDrawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          backgroundColor: "#f8f9fa",
          transition: "margin-left 0.3s ease-out",
        }}
      >
        <Toolbar />
        <Grid container spacing={2} sx={{ width: "100%", margin: "0 auto", maxWidth: "1200px" }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, boxShadow: 3, borderRadius: "12px", backgroundColor: "white" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333", textAlign: "center" }}>
                Your Bet History
              </Typography>

              {loading ? (
                <CircularProgress />
              ) : betsHistory.length > 0 ? (
                betsHistory.map((bet) => {
                  const game = bet.game; // ✅ Extract game from bet
                  return game ? (
                    <BetCard key={bet.id} game={game} bet={bet} showEdit={false} />
                  ) : (
                    <Typography key={bet.id} color="error">
                      Game not found for bet {bet.id}
                    </Typography>
                  );
                })
              ) : (
                <Typography align="center">No bet history yet.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default BetsHistoryPage;
