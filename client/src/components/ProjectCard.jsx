import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCheckCircle,
  faEdit,
  faEllipsisH,
  faTasks,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import "../styles/components/ProjectCard.css";

const ProjectCard = ({ project, onEdit, onViewDetails }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "active";
      case "completed":
        return "completed";
      case "on hold":
        return "on-hold";
      default:
        return "";
    }
  };

  const calculateProgress = () => {
    if (!project.tasks?.length) return 0;
    const completedTasks = project.tasks.filter(
      (task) => task.completed
    ).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  return (
    <div className="project-card">
      <div className="project-header">
        <h3 className="project-title">{project.name}</h3>
        <div className="project-meta">
          <span className={`project-status ${getStatusClass(project.status)}`}>
            <FontAwesomeIcon
              icon={project.status === "Completed" ? faCheckCircle : faEdit}
            />
            {project.status}
          </span>
          <span>
            <FontAwesomeIcon icon={faCalendar} className="me-1" />
            {format(new Date(project.startDate), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <div className="project-body">
        <p className="project-description">{project.description}</p>

        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-value">{calculateProgress()}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <div className="project-team">
          <div className="team-header">Team Members</div>
          <div className="team-members">
            {project.team.map((member) => (
              <div key={member._id} className="member-avatar">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="project-footer">
        <div className="project-stats">
          <div className="stat-item">
            <FontAwesomeIcon icon={faTasks} />
            {project.tasks?.length || 0} Tasks
          </div>
          <div className="stat-item">
            <FontAwesomeIcon icon={faUsers} />
            {project.team?.length || 0} Members
          </div>
        </div>

        <div className="project-actions">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onEdit(project)}
          >
            <FontAwesomeIcon icon={faEdit} className="me-1" />
            Edit
          </button>
          <button
            className="btn btn-sm btn-icon btn-outline-secondary"
            onClick={() => onViewDetails(project)}
          >
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
