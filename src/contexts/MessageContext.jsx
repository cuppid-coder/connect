import { useState, useCallback, useEffect, useReducer } from "react";
import { useAuth } from "../hooks/useAuth";
import { MessageContext } from "./context";
import socketService from "../services/socketService";
import { api } from "../services/api";

const messageReducer = (state, action) => {
  switch (action.type) {
    case "SET_CHATS": {
      return {
        ...state,
        chats: action.payload,
      };
    }
    case "ADD_MESSAGE": {
      const { chatId, message } = action.payload;
      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: {
            ...state.chats[chatId],
            messages: [...(state.chats[chatId]?.messages || []), message],
            lastMessage: message,
          },
        },
      };
    }
    case "SET_ACTIVE_CHAT": {
      return {
        ...state,
        activeChatId: action.payload,
      };
    }
    case "SET_LOADING": {
      return {
        ...state,
        loading: action.payload,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload,
      };
    }
    default:
      return state;
  }
};

export function MessageProvider({ children }) {
  const [state, dispatch] = useReducer(messageReducer, {
    chats: {},
    activeChatId: null,
    loading: false,
    error: null,
  });
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const [typingUsers, setTypingUsers] = useState({});

  const handleNewMessage = useCallback((message) => {
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        chatId: message.chatId,
        message,
      },
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.filter((u) => u._id !== currentUser?._id));
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, [currentUser]);

  const fetchUserChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const data = await api.getUserChats(currentUser._id);
      dispatch({ type: "SET_CHATS", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const token = localStorage.getItem("token");
      socketService.connect(token);

      fetchUserChats();
      fetchUsers();

      socketService.emit("user_connected", { userId: currentUser._id });

      socketService.on("new_message", handleNewMessage);
      socketService.on("user_typing", ({ chatId, userId }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), userId],
        }));
      });
      socketService.on("user_stop_typing", ({ chatId, userId }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter((id) => id !== userId),
        }));
      });

      return () => {
        socketService.off("new_message");
        socketService.off("user_typing");
        socketService.off("user_stop_typing");
      };
    }
  }, [currentUser, fetchUserChats, fetchUsers, handleNewMessage]);

  const joinChat = useCallback((chatId) => {
    socketService.emit("join_chat", chatId);
  }, []);

  const leaveChat = useCallback((chatId) => {
    socketService.emit("leave_chat", chatId);
  }, []);

  const createChat = async ({ users: selectedUsers, name, type }) => {
    try {
      const chatData = {
        users: [...selectedUsers.map((u) => u._id), currentUser._id],
        type,
        name,
      };

      const newChat = await api.createChat(chatData);

      dispatch({
        type: "SET_CHATS",
        payload: {
          ...state.chats,
          [newChat.chatId]: {
            lastMessage: newChat,
            messages: [],
          },
        },
      });

      return newChat.chatId;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      throw err;
    }
  };

  const sendMessage = async (chatId, content) => {
    try {
      const message = await api.sendMessage({ chatId, content });

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          chatId,
          message,
        },
      });

      return message;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      throw err;
    }
  };

  const emitTyping = useCallback((chatId) => {
    socketService.emit("typing", { chatId });
  }, []);

  const emitStopTyping = useCallback((chatId) => {
    socketService.emit("stop_typing", { chatId });
  }, []);

  const markAsRead = async (chatId, messageIds) => {
    try {
      await api.markMessagesAsRead({ messageIds });
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  return (
    <MessageContext.Provider
      value={{
        chats: state.chats,
        activeChatId: state.activeChatId,
        loading: state.loading,
        error: state.error,
        users,
        typing: typingUsers,
        joinChat,
        leaveChat,
        createChat,
        sendMessage,
        setTyping: emitTyping,
        stopTyping: emitStopTyping,
        markAsRead,
        setActiveChat: (chatId) =>
          dispatch({ type: "SET_ACTIVE_CHAT", payload: chatId }),
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}
