import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import apiClient from "../../api/apiClient";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import ClearIcon from "@mui/icons-material/Clear";

const UserActiveBets = ({ userId }) => {
  const [activeBets, setActiveBets] = useState([]);
  const [games, setGames] = useState([]); // ✅ Ensure this is always an array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBets = async () => {
      try {
        const betResponse = await apiClient.get(`/bets/user/${userId}/bets/upcoming`);
        const userBets = betResponse.data || []; // ✅ Ensure it's an array
        setActiveBets(userBets);

        const gameIds = userBets.map((bet) => bet.game_id);
        if (gameIds.length > 0) {
          const gameResponse = await apiClient.get("/games/upcoming");
          setGames(Array.isArray(gameResponse.data) ? gameResponse.data : []); // ✅ Ensure an array
        } else {
          setGames([]); // ✅ No bets = No games
        }
      } catch (error) {
        console.error("Failed to fetch active bets or games:", error);
        setActiveBets([]);
        setGames([]); // ✅ Handle API failure gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBets();
  }, [userId]);

  const handleDeleteBet = async (betId) => {
    try {
      await apiClient.delete(`/bets/${betId}`);
      setActiveBets((prevBets) => prevBets.filter((bet) => bet.id !== betId));
    } catch (error) {
      console.error("Failed to delete bet:", error);
    }
  };

  // 🔹 Create a dictionary to map games by their IDs (ensuring `games` is always an array)
  const gamesMap = games.reduce((acc, game) => {
    acc[game.id] = game;
    return acc;
  }, {});

  return (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : activeBets.length > 0 ? (
        activeBets.map((bet) => {
          const game = gamesMap[bet.game_id];
          if (!game) return null; // Skip bets without a matching game

          return (
            <Card key={bet.id} sx={{ mb: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  {/* Team 1 Info */}
                  <Box textAlign="center">
                    <img
                      src={game.team1_logo}
                      alt={game.team1}
                      style={{ width: 50, height: 50 }}
                    />
                    <Typography>{game.team1}</Typography>
                  </Box>

                  {/* Bet Choice */}
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {bet.bet_choice === "1" ? (
                        <LooksOneIcon fontSize="large" />
                      ) : bet.bet_choice === "X" ? (
                        <ClearIcon fontSize="large" />
                      ) : (
                        <LooksTwoIcon fontSize="large" />
                      )}
                    </Typography>
                    <Typography variant="subtitle2">
                      {new Date(game.match_time).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Team 2 Info */}
                  <Box textAlign="center">
                    <img
                      src={game.team2_logo}
                      alt={game.team2}
                      style={{ width: 50, height: 50 }}
                    />
                    <Typography>{game.team2}</Typography>
                  </Box>
                </Stack>

                {/* Action Buttons */}
                <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
                  <Button variant="contained" color="error" onClick={() => handleDeleteBet(bet.id)}>
                    Delete Bet
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Typography align="center">No active bets found.</Typography>
      )}
    </Box>
  );
};

export default UserActiveBets;
