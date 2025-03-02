import React from "react";
import { Typography } from "@mui/material";
import BetCard from "./BetCard";

const UserBetsHistory = ({ bets }) => {
    return (
        <>
            <Typography variant="h4" gutterBottom>
                Bet History
            </Typography>
            {bets?.length > 0 ? (
                bets.map((bet) =>
                    bet.game ? (
                        <BetCard key={bet.id} game={bet.game} betChoice={bet.bet_choice} showEdit={false} />
                    ) : (
                        <Typography key={bet.id} color="error">
                            Game not found for bet {bet.id}
                        </Typography>
                    )
                )
            ) : (
                <Typography>No bet history yet.</Typography>
            )}
        </>
    );
};

export default UserBetsHistory;
