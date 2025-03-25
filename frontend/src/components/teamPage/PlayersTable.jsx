import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";

const PlayersTable = ({ players }) => {
  return (
    <Paper
      sx={{
        p: 2,
        boxShadow: 2,
        borderRadius: "12px",
        backgroundColor: "white",
      }}
    >
      <TableContainer
        component={Paper}
        sx={{ maxHeight: 400, overflowY: "auto" }}
      >
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {[
                "#",
                "Player",
                "Goals",
                "Assists",
                "Yellow Cards",
                "Red Cards",
              ].map((col, idx) => (
                <TableCell
                  key={col}
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    borderRight: idx < 9 ? "1px solid #ddd" : "none",
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player, index) => {
              return (
                <TableRow key={player.id}>
                  <TableCell
                    sx={{ textAlign: "center", borderRight: "1px solid #ddd" }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      borderRight: "1px solid #ddd",
                    }}
                  >
                    {player.name}
                  </TableCell>
                  {[
                    player?.stats?.goals ?? 0,
                    player?.stats?.assists ?? 0,
                    player?.stats?.yellow_cards ?? 0,
                    player?.stats?.red_cards ?? 0,
                  ].map((value, idx) => (
                    <TableCell
                      key={idx}
                      sx={{
                        textAlign: "center",
                        borderRight: idx < 7 ? "1px solid #ddd" : "none",
                      }}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PlayersTable;
