import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUser,
  faCog,
  faSignOutAlt,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import NotificationMenu from "./NotificationMenu";
import "../styles/components/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.notifications?.unread) {
      setUnreadCount(user.notifications.unread);
    }
  }, [user]);

  const handleProfileClick = () => {
    navigate("/profile");
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/" className="navbar-brand">
          Connect
        </a>

        <div className="navbar-controls">
          <button
            className="nav-button theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          </button>

          <button
            className={`nav-button ${showNotifications ? "active" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          <div className="position-relative">
            <div
              className="avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>

            {showUserMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={handleProfileClick}>
                  <FontAwesomeIcon icon={faUser} />
                  Profile
                </div>
                <div className="dropdown-item" onClick={handleSettingsClick}>
                  <FontAwesomeIcon icon={faCog} />
                  Settings
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
                </div>
              </div>
            )}
          </div>

          {showNotifications && (
            <NotificationMenu
              onClose={() => setShowNotifications(false)}
              onUpdateUnreadCount={(count) => setUnreadCount(count)}
            />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
