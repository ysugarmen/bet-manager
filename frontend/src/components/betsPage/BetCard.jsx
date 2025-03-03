import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";

const BetCard = ({ game, bet, showEdit = true }) => {
  const team1Logo = TEAM_LOGOS[game.team1] || TEAM_LOGOS["Default"];
  const team2Logo = TEAM_LOGOS[game.team2] || TEAM_LOGOS["Default"];

  return (
    <Card sx={{ mb: 2, boxShadow: 3, backgroundColor: "#e8e8e8", p: 2 }}>
      <CardContent>
        {/* ✅ Team Logos & Names */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1 }}>
          <Typography variant="body1">{game.team1}</Typography>
          <img src={team1Logo} alt={`${game.team1} logo`} style={{ width: 40, height: 40 }} />

          <Typography variant="h6" sx={{ mx: 1 }}>vs</Typography>

          <img src={team2Logo} alt={`${game.team2} logo`} style={{ width: 40, height: 40 }} />
          <Typography variant="body1">{game.team2}</Typography>
        </Box>

        {/* ✅ Game Date */}
        <Typography variant="body2" align="center">
          Date: {new Date(game.match_time).toLocaleString()}
        </Typography>

        {/* ✅ Bet Details */}
        <Typography variant="body1" align="center">
          Your Bet: <strong>{bet.bet_choice}</strong>
        </Typography>
        <Typography variant="body1" align="center">
          Amount: <strong>{bet.bet_amount}</strong> Coins
        </Typography>

        {/* ✅ Result of the Match */}
        <Typography variant="body1" align="center" sx={{ mt: 1, color: "green" }}>
          {game.score_team1 !== null && game.score_team2 !== null
            ? `Final Score: ${game.score_team1} - ${game.score_team2}`
            : "Match not finished yet"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default BetCard;
