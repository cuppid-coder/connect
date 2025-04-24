import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './Analytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [workspaceData, setWorkspaceData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/workspace');
        const data = await response.json();
        setWorkspaceData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  if (isLoading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!workspaceData) {
    return <div className="error-state">Failed to load analytics data</div>;
  }

  const { projects, tasks, timeTracking, users } = workspaceData;

  // Chart configurations
  const projectStatusConfig = {
    labels: projects.byStatus.map(s => s._id),
    datasets: [{
      label: 'Projects by Status',
      data: projects.byStatus.map(s => s.count),
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
    }]
  };

  const taskProgressConfig = {
    labels: tasks.byStatus.map(s => s._id),
    datasets: [{
      label: 'Tasks by Status',
      data: tasks.byStatus.map(s => s.count),
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.3
    }]
  };

  const userPerformanceConfig = {
    labels: users.taskDistribution.map(u => u.name),
    datasets: [{
      label: 'Task Completion Rate (%)',
      data: users.taskDistribution.map(u => u.completionRate),
      backgroundColor: 'rgba(37, 99, 235, 0.8)',
    }]
  };

  const timeTrackingConfig = {
    labels: ['Estimated', 'Actual'],
    datasets: [{
      data: [timeTracking.totalEstimated, timeTracking.totalActual],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(37, 99, 235, 0.8)'
      ],
    }]
  };

  return (
    <div className="analytics">
      <header className="analytics-header">
        <h1>Workspace Analytics</h1>
        <div className="period-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </header>

      <div className="metrics-overview">
        <div className="metric-card">
          <h3>Projects</h3>
          <div className="metric-numbers">
            <div className="metric">
              <span className="label">Total</span>
              <span className="value">{projects.total}</span>
            </div>
            <div className="metric">
              <span className="label">Active</span>
              <span className="value highlight">{projects.active}</span>
            </div>
            <div className="metric">
              <span className="label">Completed</span>
              <span className="value success">{projects.completed}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Tasks</h3>
          <div className="metric-numbers">
            <div className="metric">
              <span className="label">Total</span>
              <span className="value">{tasks.total}</span>
            </div>
            <div className="metric">
              <span className="label">In Progress</span>
              <span className="value highlight">{tasks.inProgress}</span>
            </div>
            <div className="metric">
              <span className="label">Completed</span>
              <span className="value success">{tasks.completed}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Time Tracking</h3>
          <div className="metric-numbers">
            <div className="metric">
              <span className="label">Estimated</span>
              <span className="value">{timeTracking.totalEstimated}h</span>
            </div>
            <div className="metric">
              <span className="label">Actual</span>
              <span className="value highlight">{timeTracking.totalActual}h</span>
            </div>
            <div className="metric">
              <span className="label">Efficiency</span>
              <span className="value">
                {Math.round((timeTracking.totalEstimated / timeTracking.totalActual) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <section className="chart-section">
          <h2>Project Status Distribution</h2>
          <div className="chart-container">
            <Bar 
              data={projectStatusConfig}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </section>

        <section className="chart-section">
          <h2>Task Progress Overview</h2>
          <div className="chart-container">
            <Line 
              data={taskProgressConfig}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </section>

        <section className="chart-section">
          <h2>Team Performance</h2>
          <div className="chart-container">
            <Bar 
              data={userPerformanceConfig}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                },
                scales: {
                  y: { beginAtZero: true, max: 100 }
                }
              }}
            />
          </div>
        </section>

        <section className="chart-section">
          <h2>Time Tracking Analysis</h2>
          <div className="chart-container">
            <Doughnut 
              data={timeTrackingConfig}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
