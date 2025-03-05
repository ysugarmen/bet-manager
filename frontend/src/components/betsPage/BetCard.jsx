import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
} from "@mui/material";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import ClearIcon from "@mui/icons-material/Clear";
import TEAM_LOGOS from "../../constants/TeamLogos";
import apiClient from "../../api/apiClient";

const BetCard = ({
  game,
  userBet,
  userId,
  gamedayBudget,
  onBetPlaced,
  onDeleteBet,
}) => {
  const [betChoice, setBetChoice] = useState(userBet ? userBet.bet_choice : "");
  const [betAmount, setBetAmount] = useState(userBet ? userBet.bet_amount : 1);
  const [isEditing, setIsEditing] = useState(false);

  const maxBudget = Math.max(
    1,
    (userBet?.bet_amount || 0) + (gamedayBudget || 0)
  );
  const team1Logo = TEAM_LOGOS[game.team1] || TEAM_LOGOS["Default"];
  const team2Logo = TEAM_LOGOS[game.team2] || TEAM_LOGOS["Default"];

  useEffect(() => {
    if (userBet) {
      setBetChoice(userBet.bet_choice);
      setBetAmount(userBet.bet_amount);
      setIsEditing(false);
    }
  }, [userBet]);

  const homeOdds = game.team1_odds || "N/A";
  const drawOdds = game.draw_odds || "N/A";
  const awayOdds = game.team2_odds || "N/A";

  const handleBetPlacement = async () => {
    if (!betChoice || betAmount <= 0) return;

    try {
      let response;
      if (userBet) {
        response = await apiClient.put(`/bets/${userBet.id}`, {
          user_id: userId,
          game_id: game.id,
          bet_choice: betChoice,
          amount: betAmount,
        });
      } else {
        response = await apiClient.post("/bets/", {
          user_id: userId,
          game_id: game.id,
          bet_choice: betChoice,
          amount: betAmount,
        });
      }
      const { bet, updated_budget } = response.data;
      setIsEditing(false);
      onBetPlaced(bet, updated_budget);
    } catch (error) {
      console.error("Failed to place/edit bet:", error);
    }
  };
  const handleDeleteBet = async () => {
    try {
      await apiClient.delete(`/bets/${userBet.id}`);

      // ✅ Reset UI to pre-bet state
      setBetChoice("");
      setBetAmount(1);
      setIsEditing(false);

      // ✅ Inform parent to update state without removing the game card
      onDeleteBet(userBet.id);
    } catch (error) {
      console.error("Failed to delete bet:", error);
    }
  };
  return (
    <Card
      sx={{
        mb: 2,
        boxShadow: 3,
        backgroundColor: userBet ? "#e0e0e0" : "white",
        p: 2,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            mb: 1,
          }}
        >
          <Typography variant="body1">{game.team1}</Typography>
          <img
            src={team1Logo}
            alt={`${game.team1} logo`}
            style={{ width: 40, height: 40 }}
          />
          <Typography variant="h6" sx={{ mx: 1 }}>
            vs
          </Typography>
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

        {userBet && !isEditing ? (
          <>
            <Typography variant="body1" align="center">
              Your Bet: <strong>{betChoice}</strong>
            </Typography>
            <Typography variant="body1" align="center">
              Amount: <strong>{userBet.amount}</strong> Coins
            </Typography>

            <Stack
              direction="row"
              justifyContent="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                Edit Bet
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteBet}
              >
                Delete Bet
              </Button>
            </Stack>
          </>
        ) : (
          <>
            {/* ✅ This section now ensures the game is shown with the "Place Bet" button when userBet is deleted */}
            <Stack
              direction="row"
              justifyContent="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <ToggleButtonGroup
                value={betChoice}
                exclusive
                onChange={(event, newValue) => setBetChoice(newValue)}
                aria-label="Bet placement"
              >
                <ToggleButton value="1" aria-label="Home team">
                  <LooksOneIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {game.team1_odds || "N/A"}
                  </Typography>
                </ToggleButton>
                <ToggleButton value="X" aria-label="Draw">
                  <ClearIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {game.draw_odds || "N/A"}
                  </Typography>
                </ToggleButton>
                <ToggleButton value="2" aria-label="Away team">
                  <LooksTwoIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {game.team2_odds || "N/A"}
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

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
                  width: "60%",
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

export default BetCard;
