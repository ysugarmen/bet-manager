import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, CssBaseline, Paper, Grid } from "@mui/material";
import NavbarDrawer from "../components/general/NavbarDrawer";
import PlayersTable from "../components/teamPage/PlayersTable";
import TeamDetails from "../components/teamPage/TeamDetails";
import GamesHistory from "../components/teamPage/GamesHistory";  // Import the new component
import apiClient from "../api/apiClient";

export default function TeamPage() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState({});
    const [players, setPlayers] = useState([]);
    const [gamesHistory, setGamesHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchTeamData = useCallback(async () => {
        setLoading(true);
        try {
            const teamResponse = await apiClient.get(`/teams/${teamId}`);
            setTeam(teamResponse.data);

            const playersResponse = await apiClient.get(`/teams/${teamId}/players`);
            setPlayers(playersResponse.data);

            const gameHistoryResponse = await apiClient.get(`/teams/${teamId}/games-history`); // Ensure you use the correct endpoint
            setGamesHistory(gameHistoryResponse.data);
        } catch (error) {
            console.log("Error fetching team data: ", error);
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamData();
    }, [fetchTeamData]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <CssBaseline />
            <NavbarDrawer
                open={sidebarOpen}
                toggleDrawer={() => setSidebarOpen(!sidebarOpen)}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    backgroundColor: "#f8f9fa",
                    overflow: "auto",
                }}
            >
                <Grid container spacing={2} sx={{ maxWidth: "1200px", margin: "0 auto", marginTop: "50px", marginLeft: "50px" }}>
                    {/* Team Details */}
                    <Grid item xs={12}>
                        <TeamDetails team={team} />
                    </Grid>

                    {/* PlayerTable and GamesHistory side by side */}
                    <Grid container spacing={2} sx={{ marginTop: "20px" }}>
                        {/* Player Table */}
                        <Grid item xs={12} sm={6}>
                            <Paper sx={{ p: 2, boxShadow: 2, borderRadius: "12px", backgroundColor: "white" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
                                    Players
                                </Typography>
                                <PlayersTable players={players} />
                            </Paper>
                        </Grid>

                        {/* Game History */}
                        <Grid item xs={12} sm={6}>
                            <Paper sx={{ p: 2, boxShadow: 2, borderRadius: "12px", backgroundColor: "white" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
                                    Game History
                                </Typography>
                                {loading ? (
                                    <CircularProgress />
                                ) : (
                                    <GamesHistory team={team} games={gamesHistory} />
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
