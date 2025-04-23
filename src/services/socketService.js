import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.socket.connected) return;

    this.socket = io("http://localhost:5000", {
      auth: { token },
    });

    // Reconnect with auth token
    this.socket.on("connect_error", (error) => {
      if (error.message === "Authentication required") {
        const token = localStorage.getItem("token");
        if (token) {
          this.socket.auth = { token };
          this.socket.connect();
        }
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.socket) return;

    // Store callback in listeners map
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    } else {
      // Remove all listeners for this event
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.forEach((cb) => this.socket.off(event, cb));
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  cleanup() {
    // Remove all listeners
    this.listeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        if (this.socket) {
          this.socket.off(event, callback);
        }
      });
    });
    this.listeners.clear();
    this.disconnect();
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
