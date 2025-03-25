import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  CssBaseline,
  Button,
  Toolbar,
  Grid,
  Paper,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import NavbarDrawer from "../../components/general/NavbarDrawer";
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";
import TEAM_LOGOS from "../../constants/TeamLogos";

export default function QualifiersPage() {
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

  // **🛠 Handle Removing a Team**
  const handleRemoveTeam = (index) => {
    if (!betChoice[index]) return;
    const removedTeam = betChoice[index];

    setBetChoice((prev) => {
      const updatedChoice = { ...prev };
      delete updatedChoice[index];
      return updatedChoice;
    });

    setAvailableTeams((prev) => [...prev, removedTeam]);
  };

  const onDragStart = () => {
    console.log("Drag has started");
  };

  // **🚀 Handle Drag & Drop**
  const onDragEnd = (result) => {
    console.log("Drag result:", result); // ✅ Debugging if this function is being called
    const { source, destination } = result;

    if (!destination) return; // Dropped outside a valid area

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    if (sourceId === destId && source.index === destination.index) return; // No actual move

    // **Move from bank to table**
    if (sourceId === "team-bank" && destId === "qualifiers-table") {
      const selectedTeam = availableTeams[source.index];

      if (betChoice[destination.index + 1]) return; // Prevent overwriting an occupied slot

      setBetChoice((prev) => ({
        ...prev,
        [destination.index + 1]: selectedTeam,
      }));

      setAvailableTeams((prev) => prev.filter((t) => t !== selectedTeam));
    }

    // **Reordering inside the table**
    if (sourceId === "qualifiers-table" && destId === "qualifiers-table") {
      const updatedBetChoice = { ...betChoice };
      const movedTeam = updatedBetChoice[source.index + 1];

      delete updatedBetChoice[source.index + 1];

      if (updatedBetChoice[destination.index + 1]) return;

      updatedBetChoice[destination.index + 1] = movedTeam;
      setBetChoice(updatedBetChoice);
    }

    // **Move from table back to bank**
    if (sourceId === "qualifiers-table" && destId === "team-bank") {
      const removedTeam = betChoice[source.index + 1];

      setBetChoice((prev) => {
        const updatedChoice = { ...prev };
        delete updatedChoice[source.index + 1];
        return updatedChoice;
      });

      setAvailableTeams((prev) => [...prev, removedTeam]);
    }
  };

  const handleBetSubmission = async () => {
    if (Object.keys(betChoice).length < 8) return;

    try {
      await apiClient.post(`/side-bets/user/${user.user.id}/${sideBet.id}`, {
        bet_choice: betChoice,
      });

      alert("Bet submitted successfully!");
      navigate("/side-bets");
    } catch (error) {
      console.error("Error submitting bet: ", error);
    }
  };

  if (!sideBet) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ display: "flex", padding: 3, height: "100vh", overflow: "hidden" }}>
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
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Your Selected Qualifiers
              </Typography>
              <Paper sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
                <Droppable droppableId="qualifiers-table">
                  {(provided) => (
                    <Grid
                      container
                      spacing={2}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {Array.from({ length: 8 }).map((_, index) => {
                        const team = betChoice[index + 1];
                        return (
                          <Draggable
                            key={team || `slot-${index}`}
                            draggableId={team || `slot-${index}`}
                            index={index}
                            isDragDisabled={!team}
                          >
                            {(provided) => (
                              <Grid
                                item
                                xs={12}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={() => handleRemoveTeam(index + 1)}
                                  disabled={!team}
                                >
                                  {team ? (
                                    <>
                                      <img
                                        src={TEAM_LOGOS[team]}
                                        alt={team}
                                        style={{
                                          width: 30,
                                          height: 30,
                                          marginRight: 8,
                                        }}
                                      />
                                      {team}
                                    </>
                                  ) : (
                                    `#${index + 1} - Empty`
                                  )}
                                </Button>
                              </Grid>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Available Teams
              </Typography>
              <Paper sx={{ flexGrow: 1, p: 2 }}>
                <Droppable droppableId="team-bank" direction="horizontal">
                  {(provided) => (
                    <Grid
                      container
                      spacing={2}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      {...provided.dragHandleProps}
                      style={{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(100, 360 / Math.ceil(Math.sqrt(availableTeams.length)))}px, 1fr))`  // Adjusting size based on the number of teams
                      }}
                    >
                      {availableTeams.map((team, index) => (
                        <Draggable key={team} draggableId={team} index={index}>
                          {(provided) => {
                            return (
                              <Grid
                                item
                                style={{ width: '100%' }}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Button variant="outlined" fullWidth>
                                  <img
                                    src={TEAM_LOGOS[team]}
                                    alt={team}
                                    style={{
                                      width: 24, // smaller icons
                                      height: 24,
                                      marginRight: 8,
                                    }}
                                  />
                                  {team}
                                </Button>
                              </Grid>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          </Grid>
        </DragDropContext>
        <Button
          onClick={handleBetSubmission}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          disabled={Object.keys(betChoice).length < 8}
        >
          Place Bet
        </Button>
      </Box>
    </Box>
  );
}
