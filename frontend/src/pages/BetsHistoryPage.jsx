import React, { useEffect, useState } from "react";
import { Box, CssBaseline, Typography, Toolbar, Grid, Paper, CircularProgress } from "@mui/material";
import NavbarDrawer from "../components/general/NavbarDrawer";
import HistoryBetCard from "../components/betsPage/HistoryBetCard";
import apiClient from "../api/apiClient";

const BetsHistoryPage = () => {
  const [betsHistory, setBetsHistory] = useState([]);
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchBetsHistory();
    }
  }, [userId]);

  const fetchBetsHistory = async () => {
    try {
      const response = await apiClient.get(`/bets/user/${userId}/bets/history`);
      const bets = response.data;
      setBetsHistory(bets);
      fetchRelevantGames(bets);
    } catch (error) {
      console.error("Failed to fetch bets history:", error);
      setBetsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelevantGames = async (bets) => {
    const gameIds = [...new Set(bets.map(bet => bet.game_id))];
    try {
      const response = await apiClient.get(`/games/by-ids`, {
        params: { game_ids: gameIds }, // ✅ Axios automatically converts arrays to `?game_ids=162&game_ids=163`
        paramsSerializer: (params) => {
          return new URLSearchParams(params).toString(); // ✅ Ensures correct serialization
        },
      });
      const gamesData = response.data.reduce((acc, game) => ({
        ...acc,
        [game.id]: game
      }), {});
      setGames(gamesData);
    } catch (error) {
      console.error("Failed to fetch relevant games:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", overflowX: "hidden" }}>
      <CssBaseline />
      <NavbarDrawer open={sidebarOpen} toggleDrawer={() => setSidebarOpen(!sidebarOpen)} />
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
                  const game = games[bet.game_id]; // Get game from fetched games
                  return game ? (
                    <HistoryBetCard key={bet.id} game={game} bet={bet} />
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
