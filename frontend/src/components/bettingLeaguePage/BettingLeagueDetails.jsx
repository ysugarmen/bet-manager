import React from "react";
import { Paper, Typography, Box} from "@mui/material";

export default function LeagueDetails({ league, manager }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {league.name}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, color: "gray" }}>
                {league.description || "No description provided."}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Manager:</strong> {manager ? manager.username : "Loading..."}
            </Typography>
            <Typography variant="body2">
                <strong>Members:</strong> {league.members.length}
            </Typography>
        </Box>
    );
}
