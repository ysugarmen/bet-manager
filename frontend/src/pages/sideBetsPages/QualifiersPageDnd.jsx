import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Paper,
  Toolbar,
  Typography,
  CircularProgress,
} from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import NavbarDrawer from "../../components/general/NavbarDrawer";
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";
import TEAM_LOGOS from "../../constants/TeamLogos";

function DraggableTeam({ team, identifier, moveTeam, showRemoveButton }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "team",
    item: { id: team, identifier },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        padding: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.8rem",
      }}
    >
      <img
        src={TEAM_LOGOS[team]}
        style={{ width: 25, height: 25, marginRight: 8 }}
      />
      {team}
      {showRemoveButton && (
        <Button
          onClick={() => moveTeam(identifier)}
          style={{ marginLeft: "auto" }}
        >
          Remove
        </Button>
      )}
    </div>
  );
}

function DroppableSlot({ index, children, onDrop }) {
  const [, dropRef] = useDrop({
    accept: "team",
    drop: (item) => onDrop(item, index),
  });

  return (
    <div
      ref={dropRef}
      style={{
        padding: 8,
        minHeight: 50,
        backgroundColor: "#f0f0f0",
        margin: 2,
      }}
    >
      {children || `${index + 1}.`}
    </div>
  );
}

export default function QualifiersPageDnd() {
  const user = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [betChoice, setBetChoice] = useState({});
  const [availableTeams, setAvailableTeams] = useState([]);
  const sideBet = location.state?.sideBet;
  const userBet = location.state?.userBet;

  useEffect(() => {
    if (!sideBet) {
      navigate("/side-bets");
    } else {
      setAvailableTeams(
        sideBet.options.filter(
          (team) => !Object.values(userBet?.bet_choice || {}).includes(team)
        )
      );
      setBetChoice(userBet ? userBet.bet_choice : {});
    }
  }, [sideBet, userBet, navigate]);

  const handleRemoveTeam = (index) => {
    const newBetChoice = { ...betChoice };
    const removedTeam = newBetChoice[index];
    delete newBetChoice[index];
    setBetChoice(newBetChoice);
    setAvailableTeams((prev) => [...prev, removedTeam]);
  };

  const handleDrop = (item, slotIndex) => {
    const teamName = item.id;
    if (!Object.values(betChoice).includes(teamName)) {
      const newBetChoice = { ...betChoice, [slotIndex]: teamName };
      setBetChoice(newBetChoice);

      const newAvailableTeams = availableTeams.filter((t) => t !== teamName);
      setAvailableTeams(newAvailableTeams);
    }
  };

  const handleBetSubmission = async () => {
    try {
      await apiClient.post(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: betChoice ,
      });
      alert("Bet submitted successfully!");
      navigate("/side-bets");
    } catch (error) {
      console.error("Error submitting bet:", error);
    }
  };

  const handleBetEdit = async () => {
    try {
      await apiClient.put(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: { choice: betChoice },
      });
      alert("Bet edited successfully!");
      navigate("/side-bets");
    } catch (error) {
      console.error("Error editing bet: ", error);
    }
  };

  if (!sideBet) {
    return <CircularProgress />;
  }

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: "5px",
    padding: "5px",
  };

  const teamCardStyle = {
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    whiteSpace: "normal",
    border: "1px solid #848484",
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box
        sx={{
          display: "flex",
          padding: 3,
          height: "100vh",
        }}
      >
        <CssBaseline />
        <NavbarDrawer
          open={sidebarOpen}
          toggleDrawer={() => setSidebarOpen(!sidebarOpen)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Toolbar />
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Your Selected Qualifiers
              </Typography>
              <Paper sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index}>
                    <DroppableSlot
                      key={index}
                      index={index}
                      onDrop={handleDrop}
                    >
                      {betChoice[index] && (
                        <DraggableTeam
                          team={betChoice[index]}
                          identifier={index}
                          moveTeam={handleRemoveTeam}
                          showRemoveButton={true}
                        />
                      )}
                    </DroppableSlot>
                  </div>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Available Teams
              </Typography>
              <Paper
                sx={{ flexGrow: 1, p: 2, ...gridStyle, overflowY: "hidden" }}
              >
                {availableTeams.map((team, index) => (
                  <div key={team} style={teamCardStyle}>
                    <DraggableTeam
                      team={team}
                      identifier={index}
                      moveTeam={() => {}}
                      showRemoveButton={false}
                    />
                  </div>
                ))}
              </Paper>
            </Grid>
          </Grid>
          <Button
            onClick={userBet? handleBetEdit : handleBetSubmission}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={Object.keys(betChoice).length < 8}
          >
            {userBet ? "Update Bet" : "Place Bet"}
          </Button>
        </Box>
      </Box>
    </DndProvider>
  );
}
