import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTasks,
  faUsers,
  faCheckCircle,
  faComments,
  faChartLine,
  faChartPie,
  faListAlt,
} from "@fortawesome/free-solid-svg-icons";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "../styles/pages/Analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [activityType, setActivityType] = useState("all");

  // Sample data - replace with actual API calls
  const stats = {
    tasks: 157,
    teams: 12,
    completedTasks: 89,
    messages: 432,
  };

  const taskData = [
    { name: "Mon", tasks: 12 },
    { name: "Tue", tasks: 19 },
    { name: "Wed", tasks: 15 },
    { name: "Thu", tasks: 22 },
    { name: "Fri", tasks: 18 },
    { name: "Sat", tasks: 10 },
    { name: "Sun", tasks: 8 },
  ];

  const pieData = [
    { name: "Completed", value: 89 },
    { name: "In Progress", value: 45 },
    { name: "Todo", value: 23 },
  ];

  const COLORS = ["#22c55e", "#f59e0b", "#3b82f6"];

  const recentActivity = [
    {
      task: "Update dashboard UI",
      assignee: "John Doe",
      status: "completed",
      date: "2025-04-22",
    },
    {
      task: "Implement analytics features",
      assignee: "Jane Smith",
      status: "in-progress",
      date: "2025-04-21",
    },
    {
      task: "Fix notification bugs",
      assignee: "Mike Johnson",
      status: "todo",
      date: "2025-04-20",
    },
  ];

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineChartData = {
    labels: taskData.map((item) => item.name),
    datasets: [
      {
        label: "Tasks",
        data: taskData.map((item) => item.tasks),
        borderColor: "#3b82f6",
        tension: 0.1,
      },
    ],
  };

  const pieChartData = {
    labels: pieData.map((item) => item.name),
    datasets: [
      {
        data: pieData.map((item) => item.value),
        backgroundColor: COLORS,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="analytics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon tasks">
            <FontAwesomeIcon icon={faTasks} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.tasks}</h3>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teams">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.teams}</h3>
            <div className="stat-label">Active Teams</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.completedTasks}</h3>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon messages">
            <FontAwesomeIcon icon={faComments} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.messages}</h3>
            <div className="stat-label">Messages</div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h4 className="chart-title">
              <FontAwesomeIcon icon={faChartLine} className="me-2" />
              Task Progress
            </h4>
            <div className="chart-filters">
              <button
                className={`btn btn-sm ${
                  timeRange === "week" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setTimeRange("week")}
              >
                Week
              </button>
              <button
                className={`btn btn-sm ${
                  timeRange === "month" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setTimeRange("month")}
              >
                Month
              </button>
            </div>
          </div>
          <div style={{ height: "300px" }}>
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4 className="chart-title">
              <FontAwesomeIcon icon={faChartPie} className="me-2" />
              Task Distribution
            </h4>
          </div>
          <div style={{ height: "300px" }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h4 className="chart-title">
            <FontAwesomeIcon icon={faListAlt} className="me-2" />
            Recent Activity
          </h4>
          <div className="chart-filters">
            <button
              className={`btn btn-sm ${
                activityType === "all" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActivityType("all")}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${
                activityType === "tasks" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActivityType("tasks")}
            >
              Tasks
            </button>
            <button
              className={`btn btn-sm ${
                activityType === "teams" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActivityType("teams")}
            >
              Teams
            </button>
          </div>
        </div>

        <table className="activity-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((activity, index) => (
              <tr key={index}>
                <td>{activity.task}</td>
                <td>{activity.assignee}</td>
                <td>
                  <span className={`status-badge ${activity.status}`}>
                    {activity.status.charAt(0).toUpperCase() +
                      activity.status.slice(1)}
                  </span>
                </td>
                <td>{new Date(activity.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
