import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import TEAM_LOGOS from "../../constants/TeamLogos";

const TeamDetails = ({ team }) => {
    if (!team) return null; // ✅ Handle cases where team is undefined

    const teamLogo = TEAM_LOGOS[team.name] || TEAM_LOGOS["Default"]; // ✅ Fallback for missing logos

    return (
        <Paper sx={{ p: 3, boxShadow: 3, borderRadius: "12px", textAlign: "center", backgroundColor: "white" }}>
            {/* ✅ Team Logo */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                <img
                    src={teamLogo}
                    alt={`${team.name} logo`}
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "contain" }}
                />
            </Box>

            {/* ✅ Team Name */}
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {team.name}
            </Typography>
        </Paper>
    );
};

export default TeamDetails;
