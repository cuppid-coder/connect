import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPencilAlt,
  faCheck,
  faPlus,
  faClock,
  faCheckCircle,
  faCog,
  faCamera,
  faFileAlt,
  faUsers,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import UserSettings from "../components/UserSettings";
import { useTheme } from "../hooks/useTheme";
import "../styles/pages/Profile.css";

const Profile = () => {
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    bio: "Software Developer",
    location: "San Francisco, CA",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
  });

  const handleEditToggle = () => {
    if (editMode) {
      // Save changes
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle avatar upload
      console.log("Uploading avatar:", file);
    }
  };

  const stats = [
    { label: "Tasks Completed", value: 124 },
    { label: "Projects", value: 12 },
    { label: "Teams", value: 5 },
    { label: "Experience", value: "2y" },
  ];

  const activities = [
    {
      type: "task",
      content: "Completed UI design for dashboard",
      date: "2h ago",
      completed: true,
    },
    {
      type: "project",
      content: "Started new project 'Connect'",
      date: "1d ago",
      completed: false,
    },
    {
      type: "team",
      content: "Joined Design team",
      date: "3d ago",
      completed: true,
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "task":
        return faFileAlt;
      case "project":
        return faCog;
      case "team":
        return faUsers;
      default:
        return faCalendarAlt;
    }
  };

  return (
    <div className="container py-4">
      <section className="profile-section">
        <label htmlFor="avatar-input" className="avatar-upload">
          {profileData.avatar ? (
            <img src={profileData.avatar} alt={profileData.name} />
          ) : (
            <FontAwesomeIcon icon={faUser} size="3x" />
          )}
          <div className="upload-overlay">
            <FontAwesomeIcon icon={faCamera} className="upload-icon" />
          </div>
          <input
            type="file"
            id="avatar-input"
            hidden
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </label>

        <div className={`edit-mode ${editMode ? "active" : ""}`}>
          {editMode ? (
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg text-center"
                name="name"
                value={profileData.name}
                onChange={handleChange}
              />
              <textarea
                className="form-control mt-2 text-center"
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                rows="2"
              />
            </div>
          ) : (
            <div className="text-center mb-4">
              <h3>{profileData.name}</h3>
              <p className="text-muted">{profileData.bio}</p>
            </div>
          )}
        </div>

        <div className="profile-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <button className="btn btn-primary me-2" onClick={handleEditToggle}>
            <FontAwesomeIcon
              icon={editMode ? faCheck : faPencilAlt}
              className="me-2"
            />
            {editMode ? "Save Changes" : "Edit Profile"}
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowSettings(true)}
          >
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Settings
          </button>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-header">
          <h4>Recent Activity</h4>
          <div className="activity-filters">
            <button className="btn btn-outline-primary btn-sm">All</button>
            <button className="btn btn-outline-primary btn-sm">Tasks</button>
            <button className="btn btn-outline-primary btn-sm">Projects</button>
          </div>
        </div>

        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <FontAwesomeIcon icon={getActivityIcon(activity.type)} />
              </div>
              <div className="activity-content">
                <div>{activity.content}</div>
                <div className="activity-meta">
                  <span>{activity.date}</span>
                  {activity.completed && (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="completed-indicator"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Profile;
