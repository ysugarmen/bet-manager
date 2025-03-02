import React, { useContext, useEffect, useState } from "react";
import { Paper, Typography, CircularProgress, TextField, InputAdornment, Box, CssBaseline, Button, Modal } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BettingLeaguesTable from "../components/bettingLeaguePage/BettingLeaguesTable";
import JoinPrivateLeague from "../components/bettingLeaguePage/JoinPrivateLeague";
import CreateBettingLeague from "../components/bettingLeaguePage/CreateBettingLeague";
import NavbarDrawer from "../components/general/NavbarDrawer";
import { AuthContext } from "../context/AuthContext";
import apiClient from "../api/apiClient";

export default function PublicBettingLeaguePage() {
    const { user } = useContext(AuthContext);
    const [leagues, setLeagues] = useState([]);
    const [userLeagues, setUserLeagues] = useState([]);
    const [filteredLeagues, setFilteredLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [createLeagueOpen, setCreateLeagueOpen] = useState(false); // ✅ State to control modal

    useEffect(() => {
        fetchLeaguesAndUserData();
    }, []);

    const fetchLeaguesAndUserData = async () => {
        try {
            const [leaguesResponse, userResponse] = await Promise.all([
                apiClient.get("/betting-leagues/public"),
                apiClient.get(`/users/user`, {params: {user_id: user.id}})
            ]);

            setLeagues(leaguesResponse.data);
            setFilteredLeagues(leaguesResponse.data);

            if (userResponse.data && Array.isArray(userResponse.data.betting_leagues)) {
                setUserLeagues(userResponse.data.betting_leagues);
            }
        } catch (error) {
            console.error("Error fetching leagues or user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = leagues.filter(league => league.name.toLowerCase().includes(query));
        setFilteredLeagues(filtered);
    };

    return (
        <Box sx={{ display: "flex", width: "100vw", overflowX: "hidden", minHeight: "100vh" }}>
            <CssBaseline />
            <NavbarDrawer open={sidebarOpen} toggleDrawer={() => setSidebarOpen(!sidebarOpen)} />

            <Box component="main" sx={{ flexGrow: 1, p: 2, backgroundColor: "#f8f9fa", position: "relative", mt: 8 }}>
                {/* Title and Buttons Row */}
                <Paper sx={{ p: 2, boxShadow: 3, borderRadius: "12px", backgroundColor: "white", width: "100%", mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
                            Public Betting Leagues
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {/* Join Private League Button */}
                            <JoinPrivateLeague />
                            {/* Create League Button */}
                            <Button sx={{ backgroundColor: "#1560bd", color: "white" }} variant="contained" onClick={() => setCreateLeagueOpen(true)}>
                                Create a New League
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search leagues..."
                    value={searchQuery}
                    onChange={handleSearch}
                    sx={{ mb: 2 }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                />

                {loading ? (
                    <CircularProgress />
                ) : (
                    <BettingLeaguesTable
                        leagues={filteredLeagues}
                        userLeagues={userLeagues}
                        setUserLeagues={setUserLeagues}
                    />
                )}

                {/* ✅ Modal for Creating League */}
                <Modal open={createLeagueOpen} onClose={() => setCreateLeagueOpen(false)}>
                    <Box sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        borderRadius: "12px",
                        width: "50%",
                        maxWidth: "600px",
                        outline: "none",
                    }}>
                        <CreateBettingLeague onClose={() => setCreateLeagueOpen(false)} />
                    </Box>
                </Modal>
            </Box>
        </Box>
    );
}
