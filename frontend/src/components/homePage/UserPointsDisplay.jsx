import React, { useState, useEffect } from "react";
import { Typography, CircularProgress, Paper } from "@mui/material";
import apiClient from "../../api/apiClient.js";

function UserPointsDisplay( userId ) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPoints = async () => {
        try {
          const response = await apiClient.get(`/users/${userId.userId}/points`);
          setPoints(response.data.points);
        } catch (error) {
          console.error("Failed to fetch user points:", error);
        } finally {
          setLoading(false);
        }
      };

      if (userId) {
        fetchUserPoints();
      }
  }, [userId]);

  return (
    <Paper
      sx={{
        p: 2,
        boxShadow: 2,
        borderRadius: "12px",
        backgroundColor: "white",
        textAlign: "center",
        marginBottom: 2, // Adds spacing below the component
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
        Your Points
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#007bff" }}>
          {points ?? "0"}
        </Typography>
      )}
    </Paper>
  );
}
export default UserPointsDisplay;
