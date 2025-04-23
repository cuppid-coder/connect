import { useState, useEffect } from "react";
import { TaskContext } from "./context";
import { api } from "../services/api";

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.taskApi.getAllTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task) => {
    try {
      const newTask = await api.taskApi.createTask(task);
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const result = await api.taskApi.deleteTask(taskId);
      if (result.message === "Task deleted successfully") {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const updatedTask = await api.taskApi.updateTask(taskId, {
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        addTask,
        deleteTask,
        updateTaskStatus,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
