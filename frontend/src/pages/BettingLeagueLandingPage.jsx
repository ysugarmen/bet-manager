import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, CssBaseline, Paper, Grid } from "@mui/material";
import LeagueDetails from "../components/bettingLeaguePage/BettingLeagueDetails";
import LeagueActions from "../components/bettingLeaguePage/BettingLeagueActions";
import Leadboard from "../components/bettingLeaguePage/Leadboard";
import NavbarDrawer from "../components/general/NavbarDrawer";
import GroupChat from "../components/bettingLeaguePage/GroupChat";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function BettingLeagueLandingPage() {
    const { leagueId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [league, setLeague] = useState(null);
    const [manager, setManager] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ✅ Fetch league, leaderboard, and posts data
    const fetchLeagueData = useCallback(async () => {
        setLoading(true);
        try {
            const leagueResponse = await apiClient.get(`/betting-leagues/${leagueId}`);
            setLeague(leagueResponse.data);

            const managerResponse = await apiClient.get("/users/user", { params: { user_id: leagueResponse.data.manager_id } });
            setManager(managerResponse.data);

        } catch (error) {
            console.error("Error fetching league data:", error);
            setError("Failed to load league details.");
        } finally {
            setLoading(false);
        }
    }, [leagueId]);

    useEffect(() => {
        fetchLeagueData();
    }, [fetchLeagueData]);

    const handleUpdateLeague = () => {};

    const handleDeleteLeague = async () => {
        if (window.confirm("Are you sure you want to delete this league?")) {
            try {
                await apiClient.delete(`/betting-leagues/${leagueId}`);
                navigate("/public-leagues");
            } catch (error) {
                console.error("Error deleting league:", error);
            }
        }
    };

    const handleRemoveUser = async (userId) => {
        try {
            await apiClient.post(`/betting-leagues/${leagueId}/leave/${userId}`);
            fetchLeagueData();
        } catch (error) {
            console.error("Error removing user:", error);
        }
    };

    const handleLeaveLeague = async () => {
        if (window.confirm("Are you sure you want to leave this league?")) {
            try {
                await apiClient.post(`/betting-leagues/${leagueId}/leave/${user.id}`);
                navigate("/betting-leagues/public");
            } catch (error) {
                console.error("Error leaving league:", error);
            }
        }
    };

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
                    {/* Top Row - League Details and League Actions */}
                    <Grid item xs={12}>
                        {loading ? (
                            <CircularProgress />
                        ) : error ? (
                            <Typography color="error">{error}</Typography>
                        ) : (
                            <Paper sx={{ p: 3, display: "flex", alignItems: "center" }}>
                                {/* LeagueDetails on left (70%) */}
                                <Box sx={{ flex: 0.7 }}>
                                    <LeagueDetails league={league} manager={manager} />
                                </Box>

                                {/* LeagueActions on right (30%) */}
                                <Box sx={{ flex: 0.3 }}>
                                    <LeagueActions
                                        league={league}
                                        user={user}
                                        manager={manager}
                                        onUpdate={handleUpdateLeague}
                                        onDelete={handleDeleteLeague}
                                        onRemoveUser={handleRemoveUser}
                                        onLeave={handleLeaveLeague}
                                    />
                                </Box>
                            </Paper>
                        )}
                    </Grid>

                    {/* Bottom Row - Posts and Leaderboard in separate papers */}
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {/* Posts Section */}
                            <Grid item xs={12} sm={8}>
                            <GroupChat leagueId={leagueId} user={user} />
                            </Grid>

                            {/* Leaderboard Section */}
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 3 }}>
                                    <Leadboard league={league} />
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
