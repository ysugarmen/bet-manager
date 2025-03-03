import React, { useContext, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemIcon,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn"; // Betting icon
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import TableChartIcon from '@mui/icons-material/TableChart';
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const drawerWidth = 160;
const collapsedWidth = 60; // Width when sidebar is collapsed

const NavbarDrawer = ({ open, toggleDrawer }) => {
  const { logout } = useContext(AuthContext);
  const [openBets, setOpenBets] = useState(false);

  // ✅ Handle opening both drawer and bets menu
  const handleBetsClick = () => {
    if (!open) {
      toggleDrawer(); // Open the drawer if it's closed
    }
    setOpenBets(true); // Expand "My Bets" section
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${collapsedWidth}px)`,
          ml: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
          transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
          backgroundColor: "#042240",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap>
            Bet Manager
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
        }}
      >
        <Toolbar />
        <List sx={{ flexGrow: 1 }}>
          {/* Home Link */}
          <ListItem button component={Link} to="/home">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" sx={{ display: open ? "block" : "none" }} />
          </ListItem>

          {/* My Bets Section */}
          <ListItem button onClick={handleBetsClick}>
            <ListItemIcon>
              <MonetizationOnIcon />
            </ListItemIcon>
            <ListItemText primary="My Bets" sx={{ display: open ? "block" : "none" }} />
            {openBets ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={openBets} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button component={Link} to="/bets">
                <ListItemText inset primary="Upcoming Games" />
              </ListItem>
              <ListItem button component={Link} to="/bets-history">
                <ListItemText inset primary="Bets History" />
              </ListItem>
            </List>
          </Collapse>

          {/* Betting Leagues Section */}
          <ListItem button onClick={handleBetsClick}>
            <ListItemIcon>
              <TableChartIcon />
            </ListItemIcon>
            <ListItemText primary="Betting Leagues" sx={{ display: open ? "block" : "none" }} />
            {openBets ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={openBets} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button component={Link} to="/betting-leagues/public">
                <ListItemText inset primary="Leagues" />
              </ListItem>
            </List>
          </Collapse>
        </List>

        {/* Logout Button at the Bottom */}
        <List sx={{ marginTop: "auto" }}>
          <ListItem button onClick={logout}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ display: open ? "block" : "none" }} />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default NavbarDrawer;
