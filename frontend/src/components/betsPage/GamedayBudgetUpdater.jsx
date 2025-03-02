import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import apiClient from "../../api/apiClient";

const GamedayBudgetUpdater = ({ userId, selectedDate }) => {
    const [gamedayBudget, setGamedayBudget] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedDate) {
            fetchGamedayBudget();
        }
    }, [selectedDate]);

    const fetchGamedayBudget = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/users/${userId}/gameday_budgets/${selectedDate}`);
            setGamedayBudget(response.data.budget);
        } catch (error) {
            console.error("Failed to fetch gameday budget:", error);
            setGamedayBudget(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
            <Typography variant="h6">Gameday Budget</Typography>
            {loading ? (
                <CircularProgress size={24} />
            ) : (
                <Typography variant="body1"><strong>{gamedayBudget} Coins</strong></Typography>
            )}
        </Box>
    );
};

export default GamedayBudgetUpdater;
