const API_BASE_URL = "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return response.json();
  },

  // User endpoints
  updateStatus: async (userId, status) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update status");
    }

    return response.json();
  },

  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update user");
    }

    return response.json();
  },

  // Message endpoints
  getMessages: async (chatId) => {
    const response = await fetch(`${API_BASE_URL}/messages/chat/${chatId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch messages");
    }

    return response.json();
  },

  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send message");
    }

    return response.json();
  },

  // Additional Message endpoints
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch users");
    }

    return response.json();
  },

  markMessagesAsRead: async ({ messageIds }) => {
    const response = await fetch(`${API_BASE_URL}/messages/read`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark messages as read");
    }

    return response.json();
  },

  // Chat endpoints
  createChat: async (chatData) => {
    const response = await fetch(`${API_BASE_URL}/messages/chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(chatData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create chat");
    }

    return response.json();
  },

  getUserChats: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/messages/chats/${userId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch user chats");
    }

    return response.json();
  },

  // Task endpoints
  taskApi: {
    getAllTasks: async () => {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch tasks");
      }

      return response.json();
    },

    createTask: async (taskData) => {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create task");
      }

      return response.json();
    },

    updateTask: async (taskId, updates) => {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update task");
      }

      return response.json();
    },

    deleteTask: async (taskId) => {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete task");
      }

      return response.json();
    },
  },

  // Notification endpoints
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch notifications");
    }

    return response.json();
  },

  markNotificationAsRead: async (notificationIds) => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark notification as read");
    }

    return response.json();
  },

  markAllNotificationsAsRead: async () => {
    const response = await fetch(
      `${API_BASE_URL}/notifications/mark-all-read`,
      {
        method: "PUT",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Failed to mark all notifications as read"
      );
    }

    return response.json();
  },

  // Search endpoints
  globalSearch: async (query) => {
    const response = await fetch(
      `${API_BASE_URL}/search/global?query=${encodeURIComponent(query)}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Global search failed");
    }

    return response.json();
  },

  advancedSearch: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/search/advanced?${queryString}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Advanced search failed");
    }

    return response.json();
  },

  searchMessages: async (query) => {
    const response = await fetch(
      `${API_BASE_URL}/search/messages?query=${encodeURIComponent(query)}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Message search failed");
    }

    return response.json();
  },
};
