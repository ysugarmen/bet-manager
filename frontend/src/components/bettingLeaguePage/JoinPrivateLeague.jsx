import React, { useState, useContext } from "react";
import { Button, TextField, Typography, Box, Popper, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";

export default function JoinPrivateLeague() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [leagueCode, setLeagueCode] = useState("");
    const [message, setMessage] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleJoinPrivateLeague = async () => {
        if (!leagueCode.trim()) {
            setMessage("⚠️ Please enter a league code.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            // Fetch league ID based on the provided code
            const leagueResponse = await apiClient.get(`/betting-leagues/find-by-code/${leagueCode}`);

            const leagueId = leagueResponse.data.id;
            if (!leagueId) {
                throw new Error("League not found.");
            }

            // Send join request
            await apiClient.post(`/betting-leagues/${leagueId}/join/${user.id}`, {
                code: leagueCode,
            });

            setMessage("✅ Successfully joined! Redirecting...");
            setTimeout(() => {
                navigate(`/betting-leagues/${leagueId}`);
            }, 1500);

            // Close popper after success
            setAnchorEl(null);
        } catch (error) {
            console.error("Error joining private league:", error);
            setMessage("❌ Incorrect code or league not found. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    return (
        <Box sx={{ ml: 2 }}>
            {/* Join Private League Button */}
            <Button variant="contained" color="primary" onClick={handleClick}>
                Join Private League
            </Button>

            {/* Popper Dropdown */}
            <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-end">
                <Paper sx={{ p: 2, mt: 1, boxShadow: 3, borderRadius: "12px", backgroundColor: "white", width: 250 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Enter League Code
                    </Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={leagueCode}
                        onChange={(e) => setLeagueCode(e.target.value)}
                        sx={{ mb: 2 }}
                        disabled={loading}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleJoinPrivateLeague}
                        disabled={loading}
                    >
                        {loading ? "Joining..." : "Join"}
                    </Button>
                    {message && (
                        <Typography sx={{ mt: 1, color: message.includes("✅") ? "green" : "red", fontSize: "0.9rem" }}>
                            {message}
                        </Typography>
                    )}
                </Paper>
            </Popper>
        </Box>
    );
}
