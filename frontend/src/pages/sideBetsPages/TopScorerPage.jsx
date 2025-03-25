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

export default function TopScorerPage() {
  const user = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [players, setPlayers] = useState([]);
  const sideBet = location.state?.sideBet;
  const userBet = location.state?.userBet;

  useEffect(() => {
    if (!sideBet) {
      navigate("/side-bets");
    } else {
      if (userBet) {
        setSelectedTeam(userBet.bet_choice.team);
        setSelectedPlayer(userBet.bet_choice.player);
      }
    }
  }, [sideBet, userBet, navigate]);

  useEffect(() => {
    if (selectedTeam && sideBet?.options[selectedTeam]) {
      setPlayers(sideBet.options[selectedTeam]);
    } else {
      setPlayers([]);
    }
  }, [selectedTeam, sideBet]);

  const handleBetSubmission = async () => {
    try {
      await apiClient.post(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: { team: selectedTeam, player: selectedPlayer },
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
        bet_choice: { team: selectedTeam, player: selectedPlayer },
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

        {/* Step 1: Select Team */}
        <FormControl fullWidth margin="normal">
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">
              <em>Select a Team</em>
            </MenuItem>
            {Object.keys(sideBet.options).map((team, index) => (
              <MenuItem key={index} value={team}>
                <ListItemIcon>
                  <img
                    src={TEAM_LOGOS[team]}
                    alt={team}
                    style={{ width: 30, height: 30 }}
                  />
                </ListItemIcon>
                <ListItemText primary={team} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 2: Select Player (Disabled until a team is selected) */}
        <FormControl fullWidth margin="normal" disabled={!selectedTeam}>
          <Select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">
              <em>Select a Player</em>
            </MenuItem>
            {players.map((player, index) => (
              <MenuItem key={index} value={player}>
                {player}
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
