import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlag,
  faClock,
  faUser,
  faTrash,
  faEllipsisV,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useTask } from "../hooks/useTask";
import "../styles/components/TaskCard.css";

const TaskCard = ({ task }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteTask, updateTaskStatus } = useTask();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task._id);
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateTaskStatus(task._id, status);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  return (
    <div className="task-card">
      <div className="card-body">
        <h5 className="card-title">{task.title}</h5>
        <p className="card-text">{task.description}</p>
        <div className="meta-info">
          <span className="text-muted">
            <FontAwesomeIcon icon={faFlag} className="me-2" />
            {task.priority}
          </span>
          <span className="text-muted">
            <FontAwesomeIcon icon={faClock} className="me-2" />
            {task.dueDate}
          </span>
          <span className="text-muted">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            {task.assignee?.name || "Unassigned"}
          </span>
        </div>
      </div>

      <button
        className="menu-button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <FontAwesomeIcon icon={faSpinner} spin />
        ) : (
          <FontAwesomeIcon icon={faEllipsisV} />
        )}
      </button>

      {showMenu && (
        <div className="dropdown-menu show">
          <div className="dropdown-header">Change Status</div>
          <div
            className="dropdown-item"
            onClick={() => handleStatusChange("todo")}
          >
            To Do
          </div>
          <div
            className="dropdown-item"
            onClick={() => handleStatusChange("in-progress")}
          >
            In Progress
          </div>
          <div
            className="dropdown-item"
            onClick={() => handleStatusChange("done")}
          >
            Done
          </div>
          <div className="dropdown-divider" />
          <div className="dropdown-item text-danger" onClick={handleDelete}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete Task
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
