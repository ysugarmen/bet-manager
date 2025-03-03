import React from "react";
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from "@mui/material";

export default function Leadboard({ league }) {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Leadboard
            </Typography>
            <TableContainer component={Paper} sx={{ width: '100%', maxWidth: '700px' }}>
                <Table sx={{ minWidth: 300 }} aria-label="leaderboard table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Points</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {league?.members?.length > 0 ? (
                            league.members.map((member, index) => (
                                <TableRow key={member.id}>
                                    <TableCell>{index + 1}</TableCell> {/* Rank */}
                                    <TableCell component="th" scope="row">
                                        {member.username}
                                    </TableCell>
                                    <TableCell>{member.points}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No members yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
