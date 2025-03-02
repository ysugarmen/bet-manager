import React, { useState } from "react";
import { Paper, TextField, Button, Typography, Switch, FormControlLabel, CircularProgress } from "@mui/material";

export default function BettingLeagueForm({ onSubmit, loading, error }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        public: true,
        group_picture: "",
    });

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 500, margin: "auto", mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                Create a Betting League
            </Typography>

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="League Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Description (optional)"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Group Picture URL (optional)"
                    name="group_picture"
                    value={formData.group_picture}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />

                <FormControlLabel
                    control={<Switch checked={formData.public} onChange={handleChange} name="public" />}
                    label="Public League"
                />

                {error && <Typography color="error">{error}</Typography>}

                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Create League"}
                </Button>
            </form>
        </Paper>
    );
}
