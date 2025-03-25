import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { TbCircleLetterWFilled } from "react-icons/tb";
import { TbCircleLetterLFilled } from "react-icons/tb";
import { TbCircleLetterXFilled } from "react-icons/tb";
import TEAM_LOGOS from "../../constants/TeamLogos";

const GamesHistory = ({ team, games }) => {
  return (
    <Paper
      sx={{
        p: 2,
        boxShadow: 2,
        borderRadius: "12px",
        backgroundColor: "white",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}
      >
        Game History
      </Typography>
      <TableContainer component={Paper}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                Result
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Opponent</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map((game, index) => {
              const winnerIcon = game.game_winner === "X" ? (
                <TbCircleLetterXFilled style={{ color: "gray", fontSize: "24px" }} />
              ) : game.game_winner === "1" && game.team1 === team.name ? (
                <TbCircleLetterWFilled style={{ color: "green", fontSize: "24px" }} />
              ) : game.game_winner === "2" && game.team2 === team.name ? (
                <TbCircleLetterWFilled style={{ color: "green", fontSize: "24px" }} />
              ) : game.game_winner === "1" && game.team2 === team.name ? (
                <TbCircleLetterLFilled style={{ color: "red", fontSize: "24px" }} />
              ) : game.game_winner === "2" && game.team1 === team.name ? (
                <TbCircleLetterLFilled style={{ color: "red", fontSize: "24px" }} />
              ) : null;
              const opponent = game.team1 === team.name ? game.team2 : game.team1;
              const opponentLogo = TEAM_LOGOS[opponent] || TEAM_LOGOS["Default"];

              return (
                <TableRow key={game.id}>
                  <TableCell sx={{ textAlign: "center" }}>
                    {winnerIcon}
                  </TableCell>
                  <TableCell>
                    {new Date(game.match_time).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <img
                        src={opponentLogo}
                        style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "contain" }}
                    />
                    {opponent}
                  </TableCell>
                  <TableCell>
                    {game.score_team1} - {game.score_team2}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default GamesHistory;
