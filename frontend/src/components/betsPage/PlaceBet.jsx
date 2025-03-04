import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
} from "@mui/material";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import ClearIcon from "@mui/icons-material/Clear";
import TEAM_LOGOS from "../../constants/TeamLogos";
import apiClient from "../../api/apiClient";

const GameCard = ({ game, userBet, userId, gamedayBudget, onBetPlaced, onDeleteBet }) => {
  const [betChoice, setBetChoice] = useState(userBet ? userBet.bet_choice : "");
  const [betAmount, setBetAmount] = useState(userBet ? userBet.bet_amount : 1);
  const [isEditing, setIsEditing] = useState(false);
  const maxBudget = Math.max(1, (userBet?.bet_amount || 0) + (gamedayBudget || 0));
  const team1Logo = TEAM_LOGOS[game.team1] || TEAM_LOGOS["Default"]; // 🛠 Use fallback if not found
  const team2Logo = TEAM_LOGOS[game.team2] || TEAM_LOGOS["Default"]; // 🛠 Use fallback if not found

  useEffect(() => {
    if (!userBet) {
      setBetAmount(1); // ✅ Reset bet amount for new bets
    }
  }, [userBet]);

  // Extract betting odds
  const homeOdds = game.team1_odds || "N/A";
  const drawOdds = game.draw_odds || "N/A";
  const awayOdds = game.team2_odds || "N/A";

  const handleBetPlacement = async () => {
    if (!betChoice || betAmount <= 0) return;

    try {
      let response;
      if (userBet) {
        // ✅ Update an existing bet
        response = await apiClient.put(`/bets/${userBet.id}`, {
          user_id: userId,
          game_id: game.id,
          bet_choice: betChoice,
          bet_amount: betAmount,
        });
      } else {
        // ✅ Create a new bet
        response = await apiClient.post(`/bets/`, {
          user_id: userId,
          game_id: game.id,
          bet_choice: betChoice,
          bet_amount: betAmount,
        });
      }

      // Extract bet and updated budget
      const { bet, updated_budget } = response.data;

      // Update the bets and budget in the parent component
      onBetPlaced(bet, updated_budget);
      setIsEditing(false); // ✅ Exit editing mode after placing bet

    } catch (error) {
      console.error("Failed to place/edit bet:", error);
      alert("Failed to place or edit bet");
    }
  };

  const handleDeleteBet = async () => {
    try {
      await apiClient.delete(`/bets/${userBet.id}`);
      onDeleteBet(game.id);
    } catch (error) {
      console.error("Failed to delete bet:", error);
      alert("Failed to delete bet");
    }
  };
  console.log("User bet:", userBet);
  return (
    <Card sx={{ mb: 2, boxShadow: 3 }}>
      <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1 }}>
          {/* Team 1 */}
          <Typography variant="body1">{game.team1}</Typography>
          <img
            src={team1Logo}
            alt={`${game.team1} logo`}
            style={{ width: 40, height: 40 }}
          />

          {/* VS */}
          <Typography variant="h6" sx={{ mx: 1 }}>vs</Typography>

          {/* Team 2 */}
          <img
            src={team2Logo}
            alt={`${game.team2} logo`}
            style={{ width: 40, height: 40 }}
          />
          <Typography variant="body1">{game.team2}</Typography>
        </Box>
        <Typography variant="body2" align="center">
          Date: {new Date(game.match_time).toLocaleString()}
        </Typography>

        {userBet && userBet.bet_state === "editable" && !isEditing ? (
          <>
            <Typography variant="h5" align="center" sx={{ mt: 2 }}>
              Your Bet: <strong>{betChoice}</strong>
            </Typography>
            <Typography variant="h6" align="center">
              Bet Amount: <strong>{userBet.bet_amount} Coins</strong>
            </Typography>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                Edit Bet
              </Button>
              <Button variant="contained" color="error" onClick={handleDeleteBet}>
                Delete Bet
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
              <ToggleButtonGroup
                value={betChoice}
                exclusive
                onChange={(event, newValue) => setBetChoice(newValue)}
                aria-label="Bet placement"
              >
                <ToggleButton value="1" aria-label="Home team">
                  <LooksOneIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {homeOdds}
                  </Typography>
                </ToggleButton>
                <ToggleButton value="X" aria-label="Draw">
                  <ClearIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {drawOdds}
                  </Typography>
                </ToggleButton>
                <ToggleButton value="2" aria-label="Away team">
                  <LooksTwoIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {awayOdds}
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* ✅ Scrollable Bet Amount Slider */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Slider
                value={betAmount}
                onChange={(e, value) => setBetAmount(value)}
                step={1}
                marks
                min={1}
                max={maxBudget}
                valueLabelDisplay="auto"
                sx={{
                  width: "60%", // ✅ Make the slider narrower (adjust width as needed)
                  mt: 1,
                }}
                color="primary"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleBetPlacement}
                disabled={!betChoice || betAmount > gamedayBudget}
              >
                {userBet ? "Confirm Edit" : "Place Bet"}
              </Button>
            </Box>

            {userBet && (
              <Button
                variant="outlined"
                sx={{ mt: 2, ml: 2 }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const PlaceBet = ({ upcomingGames, upcomingBets, userId, userBetsMap, gamedayBudget, onBetPlaced, onDeleteBet }) => {
  console.log("User upcoming bets:", upcomingBets);
  return (
    <>
      {upcomingGames.map((game) => {
        const userBet = upcomingBets.find((bet) => bet.game_id === game.id);
        return (
          <GameCard
            key={game.id}
            game={game}
            userBet={userBet}
            userId={userId}
            gamedayBudget={gamedayBudget}
            onBetPlaced={onBetPlaced}
            onDeleteBet={onDeleteBet}
          />
        );
      })}
    </>
  );
};

export default PlaceBet;
