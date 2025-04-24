import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, projectsRes, teamsRes, notificationsRes] = await Promise.all([
          fetch('/api/tasks?limit=5'),
          fetch('/api/projects?limit=5'),
          fetch('/api/teams'),
          fetch('/api/notifications?unreadOnly=true&limit=5')
        ]);

        const [tasksData, projectsData, teamsData, notificationsData] = await Promise.all([
          tasksRes.json(),
          projectsRes.json(),
          teamsRes.json(),
          notificationsRes.json()
        ]);

        setTasks(tasksData.tasks);
        setProjects(projectsData.projects);
        setTeams(teamsData);
        setNotifications(notificationsData.notifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="actions">
            <Link to="/tasks/new" className="btn btn-primary">New Task</Link>
            <Link to="/projects/new" className="btn">New Project</Link>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="tasks-section card">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <Link to="/tasks" className="view-all">View All</Link>
          </div>
          <div className="task-list">
            {tasks.map(task => (
              <Link to={`/tasks/${task._id}`} key={task._id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`status status-${task.status}`}>{task.status}</span>
                </div>
                <div className="task-meta">
                  <span className={`priority priority-${task.priority}`}>{task.priority}</span>
                  <span className="due-date">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </Link>
            ))}
            {tasks.length === 0 && (
              <p className="empty-state">No tasks available</p>
            )}
          </div>
        </section>

        <section className="projects-section card">
          <div className="section-header">
            <h2>Active Projects</h2>
            <Link to="/projects" className="view-all">View All</Link>
          </div>
          <div className="project-list">
            {projects.map(project => (
              <Link to={`/projects/${project._id}`} key={project._id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <span className={`status status-${project.status}`}>{project.status}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{width: `${project.progress}%`}}
                    title={`${project.progress}% complete`}
                  />
                </div>
                <div className="project-meta">
                  <span>{project.tasks?.length || 0} tasks</span>
                  <span>{project.members?.length || 0} members</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="empty-state">No projects available</p>
            )}
          </div>
        </section>

        <section className="teams-section card">
          <div className="section-header">
            <h2>My Teams</h2>
            <Link to="/teams" className="view-all">View All</Link>
          </div>
          <div className="team-list">
            {teams.map(team => (
              <Link to={`/teams/${team._id}`} key={team._id} className="team-card">
                <div className="team-header">
                  <h3>{team.name}</h3>
                  {team.isPrivate && <span className="private-badge">Private</span>}
                </div>
                <div className="team-meta">
                  <span>{team.members?.length || 0} members</span>
                  <span>{team.metrics?.totalProjects || 0} projects</span>
                </div>
              </Link>
            ))}
            {teams.length === 0 && (
              <p className="empty-state">No teams available</p>
            )}
          </div>
        </section>

        <section className="notifications-section card">
          <div className="section-header">
            <h2>Recent Notifications</h2>
            <Link to="/notifications" className="view-all">View All</Link>
          </div>
          <div className="notification-list">
            {notifications.map(notification => (
              <div key={notification._id} className="notification-item">
                <h4>{notification.title}</h4>
                <p>{notification.content}</p>
                <time>{new Date(notification.createdAt).toLocaleString()}</time>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="empty-state">No new notifications</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;