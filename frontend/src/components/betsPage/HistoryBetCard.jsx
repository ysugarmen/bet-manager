import { Card, CardContent, Typography, Box } from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";

const HistoryBetCard = ({ game, bet }) => {
  if (!game || !bet) {
    return (
      <Typography color="error">Game or bet data missing.</Typography>
    );
  }

  const team1Logo = TEAM_LOGOS[game.team1] || TEAM_LOGOS["Default"];
  const team2Logo = TEAM_LOGOS[game.team2] || TEAM_LOGOS["Default"];
  console.log("Bet: ", bet);
  return (
    <Card sx={{ mb: 2, boxShadow: 3, backgroundColor: "#f5f5f5", p: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1 }}>
          <Typography variant="body1">{game.team1}</Typography>
          <img src={team1Logo} alt={`${game.team1} logo`} style={{ width: 40, height: 40 }} />
          <Typography variant="h6" sx={{ mx: 1 }}>
            vs
          </Typography>
          <img src={team2Logo} alt={`${game.team2} logo`} style={{ width: 40, height: 40 }} />
          <Typography variant="body1">{game.team2}</Typography>
        </Box>

        <Typography variant="body2" align="center">
          Date: {new Date(game.match_time).toLocaleString()}
        </Typography>

        <Typography variant="h6" align="center" sx={{ mt: 1 }}>
          Final Score: <strong>{game.score_team1} - {game.score_team2}</strong>
        </Typography>

        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          Your Bet: <strong>{bet.bet_choice === "1" ? game.team1 : bet.bet_choice === "2" ? game.team2 : "Draw"}</strong>
        </Typography>

        <Typography variant="body1" align="center">
          Amount: <strong>{bet.amount}</strong> Coins
        </Typography>

        <Typography
          variant="body1"
          align="center"
          sx={{
            mt: 1,
            color: bet.points_granted ? "green" : "gray",
            fontWeight: bet.points_granted ? "bold" : "normal",
          }}
        >
          Reward: {bet.reward !== null ? `${bet.reward} Points` : "Pending"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HistoryBetCard;
