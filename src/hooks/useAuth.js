import { useState, useCallback, useEffect } from "react";
import { api } from "../services/api";
import socketService from "../services/socketService";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      // If we have a token, we're doing an auto-login
      if (credentials.token) {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
          throw new Error("No saved user data found");
        }
        const userData = JSON.parse(savedUser);
        socketService.connect(credentials.token);
        setUser(userData);
        return userData;
      }

      if (!credentials.email || !credentials.password) {
        throw new Error("Email and password are required");
      }

      const { user: userData, token } = await api.login(credentials);

      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Connect socket with token
      socketService.connect(token);

      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error("Name, email and password are required");
      }

      const { user: newUser, token } = await api.register(userData);

      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Connect socket with token
      socketService.connect(token);

      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) {
        // Update user status to offline
        await api.updateStatus(user._id, "offline");
      }

      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Disconnect and cleanup socket
      socketService.cleanup();

      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local data even if the API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      socketService.cleanup();
      setUser(null);
      throw error;
    }
  }, [user]);

  // Handle offline status before window unload
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = async () => {
      try {
        await api.updateStatus(user._id, "offline");
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};
