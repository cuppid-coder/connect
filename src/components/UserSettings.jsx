import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faPalette,
  faUser,
  faLock,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../hooks/useTheme";
import "../styles/components/UserSettings.css";

const UserSettings = () => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    compactMode,
    setCompactMode,
    currentTheme,
  } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    publicProfile: true,
    language: "en",
    timezone: "UTC",
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    theme: "light",
    fontSize: "medium",
    colorScheme: "blue",
    compactMode: false,
    twoFactorAuth: false,
    emailUpdates: true,
    dataSharing: false,
  });

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "theme") {
      setTheme(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Settings updated:", formData);
  };

  const renderProfileSettings = () => (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="publicProfile"
            name="publicProfile"
            checked={formData.publicProfile}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="publicProfile">
            Public Profile
          </label>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Language</label>
        <select
          className="form-select"
          name="language"
          value={formData.language}
          onChange={handleInputChange}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Timezone</label>
        <select
          className="form-select"
          name="timezone"
          value={formData.timezone}
          onChange={handleInputChange}
        >
          <option value="UTC">UTC</option>
          <option value="EST">EST</option>
          <option value="PST">PST</option>
        </select>
      </div>
    </form>
  );

  const renderNotificationSettings = () => (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="emailNotifications"
            name="emailNotifications"
            checked={formData.emailNotifications}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="emailNotifications">
            Email Notifications
          </label>
        </div>
      </div>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="pushNotifications"
            name="pushNotifications"
            checked={formData.pushNotifications}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="pushNotifications">
            Push Notifications
          </label>
        </div>
      </div>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="taskReminders"
            name="taskReminders"
            checked={formData.taskReminders}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="taskReminders">
            Task Reminders
          </label>
        </div>
      </div>
    </form>
  );

  const renderThemeSettings = () => (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Theme</label>
        <select
          className="form-select"
          name="theme"
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            handleInputChange(e);
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">System Default</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Font Size</label>
        <select
          className="form-select"
          name="fontSize"
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            handleInputChange(e);
          }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="compactMode"
            name="compactMode"
            checked={compactMode}
            onChange={(e) => {
              setCompactMode(e.target.checked);
              handleInputChange(e);
            }}
          />
          <label className="form-check-label" htmlFor="compactMode">
            Compact Mode
          </label>
        </div>
        <small className="text-muted d-block mt-1">
          Reduces padding and margins throughout the interface
        </small>
      </div>
    </form>
  );

  const renderAccountSettings = () => (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="twoFactorAuth"
            name="twoFactorAuth"
            checked={formData.twoFactorAuth}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="twoFactorAuth">
            Two-Factor Authentication
          </label>
        </div>
      </div>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="emailUpdates"
            name="emailUpdates"
            checked={formData.emailUpdates}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="emailUpdates">
            Email Updates
          </label>
        </div>
      </div>
      <div className="form-group">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="dataSharing"
            name="dataSharing"
            checked={formData.dataSharing}
            onChange={handleInputChange}
          />
          <label className="form-check-label" htmlFor="dataSharing">
            Data Sharing
          </label>
        </div>
      </div>
      <button className="btn btn-danger">Delete Account</button>
    </form>
  );

  return (
    <div className="settings-container">
      <div className="mb-4">
        <button
          className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FontAwesomeIcon icon={faUser} className="me-2" />
          Profile
        </button>
        <button
          className={`tab-button ${
            activeTab === "notifications" ? "active" : ""
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notifications
        </button>
        <button
          className={`tab-button ${activeTab === "theme" ? "active" : ""}`}
          onClick={() => setActiveTab("theme")}
        >
          <FontAwesomeIcon icon={faPalette} className="me-2" />
          Theme
        </button>
        <button
          className={`tab-button ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <FontAwesomeIcon icon={faLock} className="me-2" />
          Account
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "profile" && renderProfileSettings()}
        {activeTab === "notifications" && renderNotificationSettings()}
        {activeTab === "theme" && renderThemeSettings()}
        {activeTab === "account" && renderAccountSettings()}
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="btn btn-primary"
          onClick={handleSubmit}
        >
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
