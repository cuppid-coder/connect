import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import socketService from "../services/socketService";

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    if (user) {
      // Listen for user status updates
      socketService.on("user_status_changed", ({ userId, status }) => {
        setOnlineUsers((prev) => {
          const updated = new Map(prev);
          updated.set(userId, status);
          return updated;
        });
      });

      // Set up window focus/blur handlers for away status
      const handleFocus = () => {
        socketService.emit("user_connected", { userId: user._id });
      };

      const handleBlur = () => {
        socketService.emit("user_away");
      };

      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);

      return () => {
        socketService.off("user_status_changed");
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
      };
    }
  }, [user]);

  const isOnline = useCallback(
    (userId) => {
      return onlineUsers.get(userId) === "online";
    },
    [onlineUsers]
  );

  const isAway = useCallback(
    (userId) => {
      return onlineUsers.get(userId) === "away";
    },
    [onlineUsers]
  );

  const joinChat = useCallback((chatId) => {
    socketService.emit("join_chat", chatId);
  }, []);

  const leaveChat = useCallback((chatId) => {
    socketService.emit("leave_chat", chatId);
  }, []);

  const joinTeam = useCallback((teamId) => {
    socketService.emit("join_team", teamId);
  }, []);

  const leaveTeam = useCallback((teamId) => {
    socketService.emit("leave_team", teamId);
  }, []);

  return {
    isOnline,
    isAway,
    joinChat,
    leaveChat,
    joinTeam,
    leaveTeam,
  };
};
