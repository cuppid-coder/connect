import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFilter,
  faSort,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import { useTheme } from "../hooks/useTheme";
import { useTask } from "../hooks/useTask";
import "../styles/pages/Tasks.css";

const Tasks = () => {
  const { currentTheme } = useTheme();
  const { tasks, loading, error } = useTask();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");

  const filteredTasks = tasks
    .filter((task) =>
      filterPriority === "all" ? true : task.priority === filterPriority
    )
    .sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return a.priority === "high" ? -1 : 1;
    });

  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === "todo"),
    "in-progress": filteredTasks.filter(
      (task) => task.status === "in-progress"
    ),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  };

  const renderTaskColumn = (status, tasks) => (
    <div className="task-column">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            {status === "todo"
              ? "To Do"
              : status === "in-progress"
              ? "In Progress"
              : "Completed"}
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task._id} task={task} />)
          ) : (
            <p className="text-muted text-center mb-0">No tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: currentTheme.text }}>Tasks</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          New Task
        </button>
      </div>

      {showCreateForm && <TaskForm onSubmit={() => setShowCreateForm(false)} />}

      <div className="filter-bar d-flex gap-3 align-items-center">
        <div className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faFilter} />
          <select
            className="form-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
        <div className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faSort} />
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      <div className="row g-2 w-100 m-0">
        <div className="col-lg-4 col-md-12 p-1">
          {renderTaskColumn("todo", tasksByStatus.todo)}
        </div>
        <div className="col-lg-4 col-md-12 p-1">
          {renderTaskColumn("in-progress", tasksByStatus["in-progress"])}
        </div>
        <div className="col-lg-4 col-md-12 p-1">
          {renderTaskColumn("completed", tasksByStatus.completed)}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
