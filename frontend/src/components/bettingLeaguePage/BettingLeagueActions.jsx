import React from "react";
import { Paper, Button, Typography, List, ListItem, ListItemText, Box} from "@mui/material";

export default function LeagueActions({ league, user, manager, onUpdate, onDelete, onRemoveUser, onLeave }) {
    // Ensure manager is not null before comparing
    const isManager = manager && user.id === manager.id;

    return (
        <Box>
            {isManager ? (
                <>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        League Code: {league.code}
                    </Typography>
                    <Button onClick={onUpdate} variant="contained" sx={{ mt: 2, mr: 1 }}>
                        Update League
                    </Button>
                    <Button onClick={onDelete} variant="contained" color="error" sx={{ mt: 2 }}>
                        Delete League
                    </Button>

                    {/* <Typography variant="h6" sx={{ mt: 3, fontWeight: "bold" }}>
                        Remove Members
                    </Typography>
                    <List>
                        {league.members.map((member) =>
                            member.id !== user.id ? (
                                <ListItem key={member.id}>
                                    <ListItemText primary={member.username} />
                                    <Button
                                        onClick={() => onRemoveUser(member.id)}
                                        variant="contained"
                                        color="secondary"
                                    >
                                        Remove
                                    </Button>
                                </ListItem>
                            ) : null
                        )}
                    </List> */}
                </>
            ) : (
                // Fallback for non-manager users
                <Button onClick={onLeave} variant="contained" color="error" sx={{ mt: 2 }}>
                    Leave League
                </Button>
            )}
        </Box>
    );
}
