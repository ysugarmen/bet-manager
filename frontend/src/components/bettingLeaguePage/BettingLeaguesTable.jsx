import React, { useState, useContext } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

export default function BettingLeaguesTable({ leagues, userLeagues, setUserLeagues }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [joiningLeagueId, setJoiningLeagueId] = useState(null);

    const handleJoinLeague = async (leagueId, userId) => {
        setJoiningLeagueId(leagueId); // Show loading state for the button
        try {
            await apiClient.post(`/betting-leagues/${leagueId}/join/${userId}`);

            // ✅ Update the userLeagues state after joining
            setUserLeagues((prev) => [...prev, leagueId]);

            
            // Redirect user to the league landing page
            setTimeout(() => {
                navigate(`/betting-leagues/${leagueId}`);
            }, 1500);
        } catch (error) {
            console.error("Error joining league:", error);
        } finally {
            setJoiningLeagueId(null); // Reset loading state
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Index</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>League Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Number of Members</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.isArray(leagues) && leagues.length > 0 ? (
                        leagues.map((league, index) => {
                            const isMember = userLeagues.includes(league.id); // ✅ Use userLeagues for correctness

                            return (
                                <TableRow key={league.id} sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Link to={`/betting-leagues/${league.id}`} style={{ textDecoration: "none", color: "blue" }}>
                                            {league.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{league.members.length}</TableCell>
                                    <TableCell>
                                        {isMember ? (
                                            <Button variant="contained" disabled>
                                                Joined
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleJoinLeague(league.id, user.id)}
                                                disabled={joiningLeagueId === league.id}
                                            >
                                                {joiningLeagueId === league.id ? "Joining..." : "Join"}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} align="center">
                                No leagues found 
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
