import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faComment,
  faUsers,
  faCalendar,
  faGear,
  faChevronLeft,
  faChevronRight,
  faChartPie,
  faUser,
  faPalette,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import { usePresence } from "../hooks/usePresence";
import { useTheme } from "../hooks/useTheme";
import "../styles/components/Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { status } = usePresence();
  const { theme } = useTheme();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const navSections = [
    {
      title: "Main",
      items: [
        { icon: faHome, text: "Dashboard", path: "/" },
        { icon: faCalendar, text: "Tasks", path: "/tasks" },
        { icon: faUsers, text: "Teams", path: "/teams" },
        { icon: faComment, text: "Chat", path: "/chat", badge: 3 },
      ],
    },
    {
      title: "Analytics",
      items: [{ icon: faChartPie, text: "Analytics", path: "/analytics" }],
    },
    {
      title: "Personal",
      items: [
        { icon: faUser, text: "Profile", path: "/profile" },
        { icon: faGear, text: "Settings", path: "/settings" },
        { icon: faPalette, text: `Theme: ${theme}`, path: "#", theme: true },
      ],
    },
  ];

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : ""} ${
        !isOpen ? "hidden" : ""
      }`}
    >
      <div className="sidebar-header">
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="Logo" />
          <span className="logo-text">Connect</span>
        </Link>
        <button
          className="toggle-button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      <nav className="nav-menu">
        {navSections.map((section, index) => (
          <div key={index} className="nav-section">
            <h3 className="nav-section-title">{section.title}</h3>
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                to={item.path}
                className={`nav-item ${
                  pathname === item.path ? "active" : ""
                } ${item.theme ? `theme-${theme}` : ""}`}
                onClick={(e) => {
                  if (item.theme) {
                    e.preventDefault();
                  } else if (window.innerWidth <= 768) {
                    onClose();
                  }
                }}
              >
                <span className="nav-item-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span className="nav-item-text">{item.text}</span>
                {item.badge && (
                  <span className="nav-item-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-menu">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              getInitials(user?.name || "")
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Loading..."}</div>
            <div className="user-status">
              <span
                className={`status-indicator ${status || "offline"}`}
              ></span>
              {status || "offline"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
