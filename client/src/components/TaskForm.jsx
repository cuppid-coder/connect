import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useTask } from "../hooks/useTask";
import "../styles/components/TaskForm.css";

const TaskForm = () => {
  const { createTask } = useTask();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignee: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTask(formData);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignee: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
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
    <div className="task-form">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Task Title
          </label>
          <input
            type="text"
            className="form-control"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
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
            placeholder="Enter task description"
            rows="3"
          />
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                className="form-select"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low" className="priority-low">
                  Low
                </option>
                <option value="medium" className="priority-medium">
                  Medium
                </option>
                <option value="high" className="priority-high">
                  High
                </option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="dueDate" className="form-label">
                Due Date
              </label>
              <input
                type="date"
                className="form-control"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="assignee" className="form-label">
                Assignee
              </label>
              <input
                type="text"
                className="form-control"
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="Enter assignee name"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary submit-button"
          disabled={loading}
        >
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
          ) : (
            <FontAwesomeIcon icon={faPlus} className="me-2" />
          )}
          Create Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
