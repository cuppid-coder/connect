import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faAt,
  faTasks,
  faUsers,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import useOnClickOutside from "../hooks/useOnClickOutside";
import { api } from "../services/api";
import "../styles/components/NotificationMenu.css";

const NotificationMenu = ({ onClose, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const menuRef = useRef(null);

  useOnClickOutside(menuRef, onClose);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      const unreadCount =
        data.notifications?.filter((n) => !n.read).length || 0;
      onUpdateUnreadCount(unreadCount);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [onUpdateUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead([notificationId]);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      const newUnreadCount = notifications.filter((n) => !n.read).length - 1;
      onUpdateUnreadCount(newUnreadCount);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
      onUpdateUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "MENTION":
        return { icon: faAt, className: "mention" };
      case "TASK_ASSIGNED":
      case "TASK_COMPLETED":
        return { icon: faTasks, className: "task" };
      case "TEAM_INVITE":
      case "TEAM_JOIN":
        return { icon: faUsers, className: "team" };
      default:
        return { icon: faBell, className: "" };
    }
  };

  if (loading) {
    return (
      <div ref={menuRef} className="notifications-menu">
        <div className="notifications-loading">Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={menuRef} className="notifications-menu">
        <div className="notifications-error">{error}</div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="notifications-menu">
      <div className="notifications-header">
        <span className="header-title">Notifications</span>
        {notifications.some((n) => !n.read) && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleMarkAllAsRead}
          >
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const { icon, className } = getNotificationIcon(notification.type);
            return (
              <div
                key={notification._id}
                className={`notification-item ${
                  !notification.read ? "unread" : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification._id);
                  }
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className={`notification-icon ${className}`}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div className="notification-content">
                  <div className="notification-text">
                    {notification.content}
                  </div>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, h:mm a"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <FontAwesomeIcon icon={faInbox} className="empty-icon" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationMenu;
