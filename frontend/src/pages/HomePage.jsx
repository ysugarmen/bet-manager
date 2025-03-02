import React, { useState, useEffect, useContext } from "react";
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
import FixturesAndResults from "../components/homePage/FixturesAndResults.jsx";
import UserActiveBets from "../components/betsPage/UserBetsActive";
import UserPointsDisplay from "../components/homePage/UserPointsDisplay.jsx";
import apiClient from "../api/apiClient.js";
import { AuthContext } from "../context/AuthContext";

export default function HomePage() {
  const { user, token } = useContext(AuthContext); // ✅ Use AuthContext
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingDates, setLoadingDates] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
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
        console.error("Failed to fetch upcoming dates: ", error);
      } finally {
        setLoadingDates(false);
      }
    };
    fetchDates();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedDate(newValue);
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", overflowX: "hidden" }}>
      <CssBaseline />
      <NavbarDrawer
        open={sidebarOpen}
        toggleDrawer={() => setSidebarOpen(!sidebarOpen)}
      />
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
          {/* Left Section - Fixtures and Results */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, boxShadow: 2, width: "100%", borderRadius: "12px", backgroundColor: "white" }}>
              <Box sx={{ mb: 2, textAlign: "center" }}>
                {loadingDates ? (
                  <CircularProgress />
                ) : dates.length > 0 ? (
                  <Tabs
                    value={selectedDate}
                    onChange={handleTabChange}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    aria-label="scrollable date tabs"
                    sx={{ maxWidth: "100%", backgroundColor: "white", borderRadius: 2, boxShadow: 1 }}
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
                Upcoming Matches
              </Typography>
              {selectedDate && <FixturesAndResults date={selectedDate} />}
            </Paper>
          </Grid>

          {/* Right Section - Leaderboard, Active Bets & Points */}
          <Grid item xs={12} md={4}>

            {/* 🎯 Points Display */}
            {user && <UserPointsDisplay userId={user.id} />}

            {/* 🎯 Active Bets */}
            <Paper sx={{ p: 2, boxShadow: 3, width: "100%", borderRadius: "12px", backgroundColor: "white" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
                Your Active Bets
              </Typography>
              <UserActiveBets userId={user.id}/>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
