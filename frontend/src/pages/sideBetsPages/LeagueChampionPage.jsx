import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  CssBaseline,
  FormControl,
  Select,
  MenuItem,
  Button,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import NavbarDrawer from "../../components/general/NavbarDrawer";
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";
import TEAM_LOGOS from "../../constants/TeamLogos";

export default function LeagueChampionPage() {
  const user = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [betChoice, setBetChoice] = useState("");

  const sideBet = location.state?.sideBet;
  const userBet = location.state?.userBet;

  useEffect(() => {
    if (!sideBet) {
      navigate("/side-bets");
    } else {
      setBetChoice(userBet ? userBet.bet_choice.choice : "");
    }
  }, [sideBet, userBet, navigate]);

  const handleBetSubmission = async () => {
    try {
      await apiClient.post(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: betChoice,
      });
      alert("Bet submitted successfully!");
      navigate("/side-bets");
    } catch (error) {
      console.error("Error submitting bet: ", error);
    }
  };

  const handleBetEdit = async () => {
    try {
      await apiClient.put(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: betChoice,
      });
      alert("Bet edited successfully!");
      navigate("/side-bets");
    } catch (error) {
      console.error("Error editing bet: ", error);
    }
  };
  if (!sideBet) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ display: "flex", padding: 3 }}>
      <CssBaseline />
      <NavbarDrawer
        open={sidebarOpen}
        toggleDrawer={() => setSidebarOpen(!sidebarOpen)}
      />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 2, backgroundColor: "#f8f9fa" }}
      >
        <Toolbar />
        <Typography variant="h4">{sideBet.question}</Typography>
        <Typography variant="body1">
          Last Date to Bet:{" "}
          {new Date(sideBet.last_time_to_bet).toLocaleString()}
        </Typography>
        <Typography variant="body1">Reward: {sideBet.reward} points</Typography>

        <FormControl fullWidth margin="normal">
          <Select
            value={betChoice}
            onChange={(e) => setBetChoice(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {sideBet.options.map((option, index) => (
              <MenuItem key={index} value={option}>
                <ListItemIcon>
                  <img
                    src={TEAM_LOGOS[option]}
                    alt={option}
                    style={{ width: 30, height: 30 }}
                  />
                </ListItemIcon>
                <ListItemText primary={option} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          onClick={userBet ? handleBetEdit : handleBetSubmission}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          {userBet ? "Update Bet" : "Place Bet"}
        </Button>
      </Box>
    </Box>
  );
}
