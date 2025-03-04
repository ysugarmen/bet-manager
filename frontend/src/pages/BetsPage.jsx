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
import BetCard from "../components/betsPage/BetCard";
import apiClient from "../api/apiClient";

const BetsPage = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [games, setGames] = useState([]);  // ✅ Holds all games for the selected date
  const [upcomingGames, setUpcomingGames] = useState([]);  // ✅ Holds games without bets
  const [upcomingBets, setUpcomingBets] = useState([]);  // ✅ Holds games where user placed a bet
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

      // ✅ Initially, all games are unbetted
      setUpcomingGames(response.data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      setGames([]);
      setUpcomingGames([]);
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

      // ✅ Remove betted games from upcomingGames
      setUpcomingGames((prevGames) =>
        prevGames.filter((game) => !response.data.some((bet) => bet.game_id === game.id))
      );
    } catch (error) {
      console.error("Failed to fetch upcoming bets:", error);
      setUpcomingBets([]);
    }
  };

  const handleBetPlaced = (bet, updatedBudget) => {
    console.log("Bet: ", bet);

    setUpcomingBets((prevBets) => {
      const existingIndex = prevBets.findIndex((b) => b.id === bet.id);
      if (existingIndex > -1) {
        // Bet already exists, update it
        const newBets = [...prevBets];
        newBets[existingIndex] = bet;
        return newBets;
      } else {
        // New bet, add it to the array and handle the unbetted games list
        setUpcomingGames((prevGames) => prevGames.filter((g) => g.id !== bet.game_id));
        return [...prevBets, bet];
      }
    });

    setGamedayBudget(updatedBudget);
  };



  const handleBetDeleted = async (betId) => {
    try {
      // ✅ Fetch updated budget first
      const response = await apiClient.get(`/users/${userId}/gameday_budget/${selectedDate}`);
      const updatedBudget = response.data.budget || 0;

      // ✅ Find the bet to delete
      const deletedBet = upcomingBets.find((bet) => bet.id === betId);
      if (!deletedBet) return;

      // ✅ Find the game related to the deleted bet
      const gameToRestore = games.find((game) => game.id === deletedBet.game_id);
      if (!gameToRestore) return;

      // ✅ Remove bet from upcomingBets
      setUpcomingBets((prevBets) => prevBets.filter((bet) => bet.id !== betId));

      // ✅ Move game back to upcomingGames
      setUpcomingGames((prevGames) => [...prevGames, gameToRestore]);

      // ✅ Update the budget
      setGamedayBudget(updatedBudget);
    } catch (error) {
      console.error("❌ Failed to delete bet or refresh budget:", error);
    }
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
                  {/* 🏆 Show Placed Bets First */}
                  {upcomingBets.map((bet) => {
                    const game = games.find((g) => g.id === bet.game_id);
                    return game ? (
                      <BetCard
                        key={bet.id}
                        game={game}
                        userBet={bet}
                        userId={userId}
                        gamedayBudget={gamedayBudget}
                        onBetPlaced={handleBetPlaced}
                        onDeleteBet={handleBetDeleted}
                      />
                    ) : null;
                  })}

                  {/* 🏆 Show Unbetted Games */}
                  {upcomingGames.map((game) => (
                    <BetCard
                      key={game.id}
                      game={game}
                      userBet={null}
                      userId={userId}
                      gamedayBudget={gamedayBudget}
                      onBetPlaced={handleBetPlaced}
                      onDeleteBet={handleBetDeleted}
                    />
                  ))}
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
