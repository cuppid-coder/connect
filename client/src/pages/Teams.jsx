import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faEllipsisV,
  faTasks,
  faComments,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useTeam } from "../hooks/useTeam";
import TeamChat from "../components/TeamChat";
import "../styles/pages/Teams.css";

const Teams = () => {
  const { teams, createTeam } = useTeam();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await createTeam(formData);
      setShowCreateModal(false);
      setFormData({ name: "", description: "" });
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="teams-container">
      <div className="teams-header">
        <h2>Teams</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Team
        </button>
      </div>

      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team._id} className="team-card">
            <div className="team-header">
              <div className="team-avatar">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="team-info">
                <h3 className="team-name">{team.name}</h3>
                <div className="team-meta">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <p className="team-description">{team.description}</p>

            <div className="team-stats">
              <div className="team-stat">
                <div className="stat-value">{team.members.length}</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="team-stat">
                <div className="stat-value">{team.tasks?.length || 0}</div>
                <div className="stat-label">Tasks</div>
              </div>
              <div className="team-stat">
                <div className="stat-value">
                  {team.completedTasks?.length || 0}
                </div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            <div className="team-members">
              <div className="member-avatars">
                {team.members.slice(0, 3).map((member) => (
                  <div key={member._id} className="member-avatar">
                    {member.name.charAt(0)}
                  </div>
                ))}
                {team.members.length > 3 && (
                  <div className="member-avatar">
                    +{team.members.length - 3}
                  </div>
                )}
              </div>
              <span className="member-count">
                {team.members.length} members
              </span>
            </div>

            <div className="team-actions">
              <button className="btn btn-outline-primary btn-sm">
                <FontAwesomeIcon icon={faTasks} className="me-1" />
                Tasks
              </button>
              <button className="btn btn-outline-primary btn-sm">
                <FontAwesomeIcon icon={faComments} className="me-1" />
                Chat
              </button>
              <button className="btn btn-outline-primary btn-sm">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                Events
              </button>
              <button className="btn btn-outline-primary btn-sm ms-auto">
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog create-team-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Team</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateTeam}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Team Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Create Team
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </div>
      )}
    </div>
  );
};

export default Teams;
