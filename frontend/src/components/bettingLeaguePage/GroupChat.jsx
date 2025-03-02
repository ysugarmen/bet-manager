import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Paper, IconButton } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import apiClient from "../../api/apiClient";

const GroupChat = ({ leagueId, user }) => {
  const [messages, setMessages] = useState([]);  // To store chat messages
  const [newMessage, setNewMessage] = useState("");  // To store the current input

  // Fetch chat messages
  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(`/betting-leagues/${leagueId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const response = await apiClient.post(`/betting-leagues/${leagueId}/chat`, {
          user_id: user.id,
          username: user.username,
          content: newMessage
        });
        setMessages([...messages, response.data]); // Add new message to the bottom
        setNewMessage(""); // Clear input
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Update message
  const handleUpdateMessage = async (messageId, updatedContent) => {
    try {
      const response = await apiClient.put(`/betting-leagues/${leagueId}/chat/${messageId}`, {
        user_id: user.id,
        username: user.username,
        content: updatedContent
      });
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId ? { ...msg, content: updatedContent } : msg
      );
      setMessages(updatedMessages);  // Update the message in the state
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await apiClient.delete(`/betting-leagues/${leagueId}/chat/${messageId}`);
      setMessages(messages.filter((msg) => msg.id !== messageId)); // Remove message from state
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [leagueId]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Group Chat</Typography>

      <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 2 }}>
        {messages.length > 0 ? (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 1,
                borderBottom: "1px solid #ccc",
                paddingBottom: "8px",
                position: "relative",
                '&:hover .messageActions': { // Hover effect for the icon buttons container
                  visibility: 'visible'
                },
                '&:hover .timestamp': {
                    visibility: 'hidden'
                }
              }}
            >
              <Typography variant="body1">
                <strong>{message.username}:</strong> {message.content}
                <Typography variant="body2" color="textSecondary" sx={{ float: 'right' }}>
            <Box className="timestamp" sx ={{visibility: 'visible' }}>
                  {new Date(message.timestamp).toLocaleString()}
            </Box>
                </Typography>
              </Typography>

              {/* Edit and Delete Icons */}
              {message.user_id === user.id && (
                <Box className="messageActions" sx={{
                  position: "absolute", top: 0, right: 0, display: "flex", gap: 1,
                  visibility: 'hidden' // Icons hidden by default
                }}>
                  <IconButton
                    onClick={() => handleUpdateMessage(message.id, prompt("Update message:", message.content))}
                    sx={{ padding: 0, color: "lightgray" }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteMessage(message.id)}
                    sx={{ padding: 0, color: "lightgray" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">No messages yet.</Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          placeholder="Type a message..."
          sx={{ mr: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default GroupChat;
