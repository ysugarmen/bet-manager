import React, { useState, useEffect } from "react";
import {
  Box,
  CssBaseline,
  Typography,
  CircularProgress,
  Tab,
  Tabs,
  Toolbar,
  Grid,
  Paper,
} from "@mui/material";
import NavbarDrawer from "../components/general/NavbarDrawer";
import PlaceBet from "../components/betsPage/PlaceBet";
import BetCard from "../components/betsPage/BetCard";  
import apiClient from "../api/apiClient";

const BetsPage = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [games, setGames] = useState([]);
  const [upcomingBets, setUpcomingBets] = useState([]);
  const [userBetsMap, setUserBetsMap] = useState(new Set());
  const [gamedayBudget, setGamedayBudget] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchGamesByDate(selectedDate);
      fetchGamedayBudget();
      fetchUserBets();
    }
  }, [selectedDate]);

  const fetchDates = async () => {
    try {
      const response = await apiClient.get("/games/upcoming/dates");
      if (response.data?.length > 0) {
        setDates(response.data);
        setSelectedDate(response.data[0]);
      } else {
        setDates([]);
      }
    } catch (error) {
      console.error("Failed to fetch upcoming dates:", error);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchGamesByDate = async (date) => {
    try {
      setLoadingGames(true);
      const response = await apiClient.get(`/games/upcoming/by-date/${date}`);
      setGames(response.data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      setGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchGamedayBudget = async () => {
    if (!userId || !selectedDate) return;
    try {
      const response = await apiClient.get(`/users/${userId}/gameday_budget/${selectedDate}`);
      setGamedayBudget(response.data.budget || 0);
    } catch (error) {
      console.error("❌ Failed to fetch gameday budget:", error);
      setGamedayBudget(0);
    }
  };

  const fetchUserBets = async () => {
    try {
      const response = await apiClient.get(`/bets/user/${userId}/bets/upcoming`);
      setUpcomingBets(response.data);
      setUserBetsMap(new Set(response.data.map((bet) => bet.game_id)));
    } catch (error) {
      console.error("Failed to fetch upcoming bets:", error);
      setUpcomingBets([]);
    }
  };

  const handleBetPlaced = async (bet, updatedBudget) => {
    setUpcomingBets((prevBets) => {
      const betExists = prevBets.some((b) => b.game_id === bet.game_id);
      return betExists
        ? prevBets.map((b) =>
            b.game_id === bet.game_id ? { ...b, bet_choice: bet.bet_choice, bet_amount: bet.bet_amount } : b
          )
        : [...prevBets, bet];
    });

    setUserBetsMap((prevMap) => new Set([...prevMap, bet.game_id]));
    setGamedayBudget(updatedBudget);
  };

  // ✅ Handle Bet Edit (Update UI)
  const handleBetUpdated = async (updatedBet, updatedBudget) => {
    setUpcomingBets((prevBets) =>
      prevBets.map((bet) => (bet.id === updatedBet.id ? updatedBet : bet))
    );
    await fetchGamedayBudget();

  };

  // ✅ Handle Bet Deletion
  const handleBetDeleted = async(betId) => {
    setUpcomingBets((prevBets) => prevBets.filter((bet) => bet.id !== betId));
    setUserBetsMap((prevMap) => {
      const newMap = new Set(prevMap);
      newMap.delete(betId);
      return newMap;
    });
    await fetchGamedayBudget();
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", overflowX: "hidden" }}>
      <CssBaseline />
      <NavbarDrawer open={sidebarOpen} toggleDrawer={() => setSidebarOpen(!sidebarOpen)} />
      <Box component="main" sx={{ flexGrow: 1, p: 2, backgroundColor: "#f8f9fa" }}>
        <Toolbar />
        <Grid container spacing={2} sx={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, boxShadow: 2, borderRadius: "12px", backgroundColor: "white" }}>
              <Box sx={{ mb: 2, textAlign: "center" }}>
                {loadingDates ? (
                  <CircularProgress />
                ) : dates.length > 0 ? (
                  <Tabs
                    value={selectedDate}
                    onChange={(event, newValue) => setSelectedDate(newValue)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: 1 }}
                  >
                    {dates.map((date) => (
                      <Tab key={date} label={date} value={date} />
                    ))}
                  </Tabs>
                ) : (
                  <Typography variant="h6" align="center">
                    No games found
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
                Gameday Budget: {gamedayBudget} Coins
              </Typography>

              {loadingGames ? (
                <CircularProgress />
              ) : (
                <>
                  {/* 🏆 Show Bet Cards First */}
                  {upcomingBets
                    .filter((bet) => userBetsMap.has(bet.game_id))
                    .map((bet) => {
                      const game = games.find((g) => g.id === bet.game_id);
                      return game ? (
                        <BetCard
                          key={bet.id}
                          game={game}
                          bet={bet}
                          userId={userId}  // ✅ Pass userId
                          selectedDate={selectedDate}  // ✅ Pass selectedDate
                          onBetUpdated={handleBetUpdated}
                          onBetDeleted={handleBetDeleted}
                        />
                      ) : null;
                    })}

                  {/* 🏆 Show Unbetted Games */}
                  <PlaceBet
                    upcomingGames={games.filter((g) => !userBetsMap.has(g.id))}
                    upcomingBets={upcomingBets}
                    userId={userId}
                    userBetsMap={userBetsMap}
                    gamedayBudget={gamedayBudget}
                    onBetPlaced={handleBetPlaced}
                  />
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default BetsPage;
