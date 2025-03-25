import React from "react";
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Box
} from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";
import { Link } from "react-router-dom";

const LeagueTable = ({ teams }) => {
  return (
    <Paper sx={{ p: 2, boxShadow: 2, borderRadius: "12px", backgroundColor: "white" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
        League Standings
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {["#", "Team", "GP", "W", "D", "L", "GF", "GA", "GD", "Points"].map((col, idx) => (
                <TableCell key={col} sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  borderRight: idx < 9 ? "1px solid #ddd" : "none"
                }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team, index) => {
              const teamLogo = TEAM_LOGOS[team.name] || TEAM_LOGOS["Default"];

            return (

              <TableRow key={team.id}>
                <TableCell sx={{ textAlign: "center", borderRight: "1px solid #ddd" }}>{index + 1}</TableCell>
                <TableCell sx={{ display: "flex", alignItems: "center", borderRight: "1px solid #ddd" }}>
                  <img
                    src={teamLogo}
                    alt={team.name}
                    width={25}
                    height={25}
                    style={{ marginRight: 8, borderRadius: "50%" }}
                  />
                  <Link to={`/teams/${team.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="body2" sx={{ cursor: "pointer" }}>
                        {team.name}
                      </Typography>
                    </Link>
                </TableCell>
                {[
                  team.stats["League Phase"]?.matches_played ?? 0,
                  team.stats["League Phase"]?.wins ?? 0,
                  team.stats["League Phase"]?.draws ?? 0,
                  team.stats["League Phase"]?.losses ?? 0,
                  team.stats["League Phase"]?.goals_for ?? 0,
                  team.stats["League Phase"]?.goals_against ?? 0,
                  team.stats["League Phase"]?.goal_difference ?? 0,
                  team.points
                ].map((value, idx) => (
                  <TableCell key={idx} sx={{ textAlign: "center", borderRight: idx < 7 ? "1px solid #ddd" : "none" }}>
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LeagueTable;
