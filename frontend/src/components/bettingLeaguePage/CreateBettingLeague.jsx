import React, { useState, useContext } from "react";
import BettingLeagueForm from "./CreateBettingLeagueForm";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function CreateBettingLeague({ onClose }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.post("/betting-leagues/", {
                ...formData,
                manager_id: user.id,
            });
            const newLeagueId = response.data.id;

            onClose(); // ✅ Close modal after success
            navigate(`/betting-leagues/${newLeagueId}`);
        } catch (error) {
            console.error("Error creating league:", error);
            setError("Failed to create league");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", textAlign: "center" }}>

            {loading ? (
                <CircularProgress />
            ) : (
                <BettingLeagueForm onSubmit={handleSubmit} loading={loading} error={error} />
            )}

            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

            <Button variant="outlined" color="primary" onClick={onClose} sx={{ color: "#1560bd", mt: 2 }}>
                Cancel
            </Button>
        </Box>
    );
}
