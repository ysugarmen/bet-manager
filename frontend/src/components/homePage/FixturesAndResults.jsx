import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress } from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";
import apiClient from "../../api/apiClient";

const FixtureCard = ({ team1, team2, time, team1Score, team2Score }) => {
  const team1Logo = TEAM_LOGOS[team1] || TEAM_LOGOS["Default"]; // 🛠 Use fallback if not found
  const team2Logo = TEAM_LOGOS[team2] || TEAM_LOGOS["Default"]; // 🛠 Use fallback if not found
  return (
    <Card sx={{ minWidth: 275, boxShadow: 3, p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CardContent>
        {/* ✅ Row Layout for Logos, Score, and Names */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
          {/* Team 1 Logo & Name */}
          <Box sx={{ textAlign: "center" }}>
            <img src={team1Logo} alt={team1} style={{ width: 50, height: 50 }} />
            <Typography variant="body1">{team1}</Typography>
          </Box>

          {/* Score in the Middle */}
          <Typography variant="h5" sx={{ fontWeight: "bold", mx: 2 }}>
            {team1Score !== null && team2Score !== null ? `${team1Score} : ${team2Score}` : "- : -"}
          </Typography>

          {/* Team 2 Logo & Name */}
          <Box sx={{ textAlign: "center" }}>
            <img src={team2Logo} alt={team2} style={{ width: 50, height: 50 }} />
            <Typography variant="body1">{team2}</Typography>
          </Box>
        </Box>

      </CardContent>
        {/* Match Time Below */}
        <Box sx={{ alignItems: "center", justifyContent: "center", mt: 1 }}>
        <Typography variant="subtitle2" sx={{ mt: 1 }}>
          <strong>Match Time:</strong> {time}
        </Typography>
        </Box>
    </Card>
  );
};

const FixturesAndResults = ({ date }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/games/upcoming/by-date/${date}`);
        setGames(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Failed to fetch upcominggames:", error);
        setGames([]);
      }
    };
    fetchData();
  }, [date]);

  return (
    <Box sx={{ mt: 3 }}>
      {loading ? (
        <CircularProgress />
      ) : games.length > 0 ? (
        games.map((game, index) => (
          <FixtureCard
            key={index}
            team1={game.team1}
            team2={game.team2}
            team1LogoUrl={game.team1_logo}
            team2LogoUrl={game.team2_logo}
            team1Score={game.score_team1}
            team2Score={game.score_team2}
            time={new Date(game.match_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          />
        ))
      ) : (
        <Typography>No games found for this date</Typography>
      )}
    </Box>
  );
};

export default FixturesAndResults;
