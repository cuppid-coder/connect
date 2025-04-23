import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faExclamationTriangle,
  faTasks,
  faUsers,
  faCheckCircle,
  faChartLine,
  faCompass,
  faBullhorn,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import "../styles/pages/Home.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: currentTheme.text,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: currentTheme.border,
        },
        ticks: {
          color: currentTheme.text,
        },
      },
      y: {
        grid: {
          color: currentTheme.border,
        },
        ticks: {
          color: currentTheme.text,
        },
      },
    },
  };

  const lineChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Tasks Completed",
        data: [5, 8, 6, 9, 7, 4, 6],
        borderColor: currentTheme.primary,
        tension: 0.1,
      },
    ],
  };

  const doughnutData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        data: [12, 8, 15],
        backgroundColor: ["#dc3545", "#0d6efd", "#198754"],
      },
    ],
  };

  const upcomingDeadlines = [
    {
      id: 1,
      title: "Implement user authentication",
      deadline: "2025-04-21",
      urgent: true,
    },
    {
      id: 2,
      title: "Update homepage design",
      deadline: "2025-04-25",
      urgent: false,
    },
    {
      id: 3,
      title: "Fix navigation bug",
      deadline: "2025-04-23",
      urgent: true,
    },
  ];

  const recommendedProjects = [
    {
      id: 1,
      name: "Open Source CMS",
      stars: 234,
      description: "A modern content management system built with React",
      tags: ["react", "typescript", "nodejs"],
    },
    {
      id: 2,
      name: "Task Management API",
      stars: 187,
      description: "RESTful API for task management applications",
      tags: ["api", "nodejs", "mongodb"],
    },
  ];

  const formatDeadline = (date) => {
    const deadline = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 0) return "Overdue";
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="dashboard-container">
      <h2 className="welcome-text">Welcome back, {user?.name || "User"}</h2>

      <div className="dashboard-grid">
        <div className="main-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon tasks">
                <FontAwesomeIcon icon={faTasks} />
              </div>
              <div className="stat-content">
                <h3>35</h3>
                <p>Total Tasks</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teams">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="stat-content">
                <h3>8</h3>
                <p>Active Teams</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completed">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-content">
                <h3>12</h3>
                <p>Completed This Week</p>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <div className="chart-card">
              <div className="chart-header">
                <h4>
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  Task Progress
                </h4>
              </div>
              <div className="chart-body">
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="side-section">
          <div className="deadlines-card">
            <h4>
              <FontAwesomeIcon icon={faClock} className="me-2" />
              Upcoming Deadlines
            </h4>
            {upcomingDeadlines.map((task) => (
              <div
                key={task.id}
                className={`deadline-item ${task.urgent ? "urgent" : ""}`}
              >
                <div className="deadline-content">
                  <h6>{task.title}</h6>
                  <small className="deadline-date">
                    {formatDeadline(task.deadline)}
                  </small>
                </div>
                {task.urgent && (
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="urgent-icon"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="distribution-card">
            <h4>Task Distribution</h4>
            <div className="distribution-chart">
              <Doughnut
                data={doughnutData}
                options={{ maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-section">
        <div className="recent-activity">
          <h4>
            <FontAwesomeIcon icon={faBullhorn} className="me-2" />
            Recent Activity
          </h4>
          <div className="activity-list">
            <div className="activity-item">
              <strong>Task Created:</strong> Update homepage design
              <small className="activity-time">2 hours ago</small>
            </div>
            <div className="activity-item">
              <strong>Task Completed:</strong> Fix navigation bug
              <small className="activity-time">4 hours ago</small>
            </div>
            <div className="activity-item">
              <strong>Task Updated:</strong> Add user authentication
              <small className="activity-time">Yesterday</small>
            </div>
          </div>
        </div>

        <div className="discover-section">
          <h4>
            <FontAwesomeIcon icon={faCompass} className="me-2" />
            Discover Projects
          </h4>
          <div className="project-recommendations">
            {recommendedProjects.map((project) => (
              <div key={project.id} className="recommended-project">
                <div className="project-header">
                  <h6>{project.name}</h6>
                  <div className="project-stars">
                    <FontAwesomeIcon icon={faStar} className="star-icon" />
                    {project.stars}
                  </div>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
