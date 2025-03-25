import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CssBaseline,
  Grid,
  Toolbar,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import NavbarDrawer from "../components/general/NavbarDrawer";
import { AuthContext } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import TEAM_LOGOS from "../constants/TeamLogos";

export default function SideBetsPage() {
  const { user } = useContext(AuthContext);
  const [sideBets, setSideBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBets, setUserBets] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const userId = user.id;

  const fetchSideBetsData = async () => {
    try {
      const response = await apiClient.get("/side-bets/");
      setSideBets(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching side-bets data: ", error);
    }
  };

  const fetchUserSideBetsData = async () => {
    try {
      const response = await apiClient.get(`/side-bets/user/${user.id}`);
      const userSideBetsData = response.data.reduce((acc, sideBet) => {
        acc[sideBet.side_bet_id] = sideBet; // Key by side_bet_id for easy lookup
        return acc;
      }, {});
      setUserBets(userSideBetsData);
    } catch (error) {
      console.error("Error fetching user side-bets data: ", error);
    }
  };

  useEffect(() => {
    fetchSideBetsData();
    fetchUserSideBetsData();
  }, []);

  const handlePlaceSideBet = async (sideBet) => {
    try {
      const navigateToPage = getNavigationPath(sideBet.question);
      navigate(navigateToPage, { state: { sideBet, userBet: null } });
    } catch (error) {
      console.error("Error placing side-bet: ", error);
    }
  };
  const handleEditSideBet = async (sideBet) => {
    try {
      const userBet = userBets[sideBet.id];
      const navigateToPage = getNavigationPath(sideBet.question);
      navigate(navigateToPage, { state: { sideBet, userBet } });
    } catch (error) {
      console.error("Error editing side-bet: ", error);
    }
  };

  const handleDeleteBet = async (sideBetId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this bet?");
    if (!confirmDelete) {
        return;
    }
    try {
      await apiClient.delete(`/side-bets/user/${userId}/${sideBetId}`);
      setUserBets((prevBets) => {
        const updatedBets = { ...prevBets };
        delete updatedBets[sideBetId];
        return updatedBets;
      });
    } catch (error) {
      console.error("Error deleting bet: ", error);
    }
  };

  const isBetLocked = (lastTimeToBet) => {
    const currentDate = new Date();
    return currentDate > new Date(lastTimeToBet);
  };

  const isBetEditable = (betState) => betState === "editable";

  const getNavigationPath = (question) => {
    const pageMap = {
      "League Champion": "/side-bets/league-champion",
      "Top Scorer": "/side-bets/top-scorer",
      "Top Assister": "/side-bets/top-assister",
      "Knockout stages qualifiers": "/side-bets/qualifiers",
    };
    return pageMap[question];
  };

  return (
    <Box sx={{ display: "flex", padding: 3 }}>
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
        <Grid container spacing={3}>
          {sideBets.map((sideBet) => {
            const userBet = userBets[sideBet.id];
            const betLocked = isBetLocked(sideBet.last_time_to_bet);
            const canEdit = isBetEditable(sideBet.bet_state) && !betLocked;
            // Handle bet display based on type
            let displayBetChoice = "";
            let teamLogo = null;

            if (userBet) {
              if (sideBet.question === "Top Scorer" || sideBet.question === "Top Assister") {
                // Extract team & player for Top Scorer bet
                const teamName = userBet.bet_choice.team;
                const playerName = userBet.bet_choice.player;
                displayBetChoice = `${playerName} (${teamName})`;
                teamLogo = TEAM_LOGOS[teamName] || null;
              } if (sideBet.question === "League Champion") {
                // Default case for other bets
                displayBetChoice = userBet.bet_choice;
                teamLogo = TEAM_LOGOS[displayBetChoice] || null;
              }
            }

            return (
              <Grid item xs={12} sm={6} md={6} lg={6} key={sideBet.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{sideBet.question}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last Date to Bet:{" "}
                      {new Date(sideBet.last_time_to_bet).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Reward: {sideBet.reward} points
                    </Typography>

                    {userBet ? (
                      <>
                        <Typography variant="body2" sx={{ marginTop: 2 }}>
                          Your choice: {displayBetChoice}
                        </Typography>
                        {teamLogo && (
                          <Box
                            component="img"
                            src={teamLogo}
                            alt={displayBetChoice}
                            sx={{ width: 50, height: 50, marginTop: 1 }}
                          />
                        )}
                        <Box sx={{ marginTop: 2 }}>
                          {canEdit && (
                            <Button
                              onClick={() => handleEditSideBet(sideBet)}
                              variant="outlined"
                              color="primary"
                              sx={{ marginRight: 1 }}
                            >
                              Edit Bet
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteBet(sideBet.id)}
                            variant="outlined"
                            color="secondary"
                          >
                            Delete Bet
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        onClick={() => handlePlaceSideBet(sideBet)}
                        variant="contained"
                        color="primary"
                        sx={{ marginTop: 2 }}
                      >
                        Place Bet
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
