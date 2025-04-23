import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMessage } from "../hooks/useMessage";
import { useAuth } from "../hooks/useAuth";
import "../styles/components/TeamChat.css";

const TeamChat = ({ teamId }) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const {
    chats,
    typing,
    sendMessage,
    joinChat,
    leaveChat,
    setTyping: emitTyping,
    stopTyping: emitStopTyping,
    markAsRead,
  } = useMessage();
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chat = chats[teamId];
  const messages = useMemo(() => chat?.messages || [], [chat?.messages]);

  useEffect(() => {
    joinChat(teamId);
    return () => {
      leaveChat(teamId);
    };
  }, [teamId, joinChat, leaveChat]);

  useEffect(() => {
    if (chat?.messages && messages && teamId && user._id) {
      markAsRead(messages, teamId, user._id);
    }
  }, [chat?.messages, markAsRead, messages, teamId, user._id]);

  const handleTyping = () => {
    emitTyping(teamId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(teamId);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(teamId, message);
      setMessage("");
      emitStopTyping(teamId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="team-chat">
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message-bubble ${
              msg.sender === user._id ? "mine" : ""
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typing[teamId] && (
        <div className="typing-indicator">Someone is typing...</div>
      )}

      <div className="input-container">
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TeamChat;
