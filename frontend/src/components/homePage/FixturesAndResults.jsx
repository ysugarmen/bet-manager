import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress } from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";
import apiClient from "../../api/apiClient";
import { Link } from "react-router-dom";

const FixtureCard = ({ team1, team2, time, team1Score, team2Score, teams }) => {
  const team1Logo = TEAM_LOGOS[team1] || TEAM_LOGOS["Default"];
  const team2Logo = TEAM_LOGOS[team2] || TEAM_LOGOS["Default"];

  // Find the team ids based on the team names
  const team1Id = teams.find(team => team.name === team1)?.id;
  const team2Id = teams.find(team => team.name === team2)?.id;

  return (
    <Card sx={{ minWidth: 275, boxShadow: 3, p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CardContent>
        {/* Row Layout for Logos, Score, and Names */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
          {/* Team 1 Logo & Name */}
          <Box sx={{ textAlign: "center" }}>
            <img src={team1Logo} alt={team1} style={{ width: 50, height: 50 }} />
            <Link to={`/teams/${team1Id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Typography variant="body1" sx={{ cursor: "pointer" }}>
                {team1}
              </Typography>
            </Link>
          </Box>

          {/* Score in the Middle */}
          <Typography variant="h5" sx={{ fontWeight: "bold", mx: 2 }}>
            {team1Score !== null && team2Score !== null ? `${team1Score} : ${team2Score}` : "- : -"}
          </Typography>

          {/* Team 2 Logo & Name */}
          <Box sx={{ textAlign: "center" }}>
            <img src={team2Logo} alt={team2} style={{ width: 50, height: 50 }} />
            <Link to={`/teams/${team2Id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Typography variant="body1" sx={{ cursor: "pointer" }}>
                {team2}
              </Typography>
            </Link>
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


const FixturesAndResults = ({ date, teams }) => {
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
        console.error("Failed to fetch upcoming games:", error);
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
            team1Score={game.score_team1}
            team2Score={game.score_team2}
            time={new Date(game.match_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            teams={teams}
          />
        ))
      ) : (
        <Typography>No games found for this date</Typography>
      )}
    </Box>
  );
};

export default FixturesAndResults;
