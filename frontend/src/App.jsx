import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/general/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import BetsPage from "./pages/BetsPage";
import BetsHistoryPage from "./pages/BetsHistoryPage";
import PublicBettingLeaguePage from "./pages/PublicBettingLeaguePage";
import BettingLeagueLandingPage from "./pages/BettingLeagueLandingPage";

const App = () => {
  return (
    <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/bets" element={<ProtectedRoute><BetsPage /></ProtectedRoute>} />
          <Route path="/bets-history" element={<ProtectedRoute><BetsHistoryPage /></ProtectedRoute>} />
          <Route path="/betting-leagues/public" element={<ProtectedRoute><PublicBettingLeaguePage /></ProtectedRoute>} />
          <Route path="/betting-leagues/:leagueId" element={<ProtectedRoute><BettingLeagueLandingPage /></ProtectedRoute>} />
        </Routes>
    </AuthProvider>
  );
};

export default App;
