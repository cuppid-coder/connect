# Project and Task Management API Documentation

## Base URL
```
http://localhost:5000/api
```

## Project Management

### Project Endpoints

#### Get All Projects
- **URL**: `/projects`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `status` (optional): Filter by status
  - `priority` (optional): Filter by priority
  - `team` (optional): Filter by team ID
  - `search` (optional): Search in project name and description
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date
- **Success Response**:
  ```json
  {
    "projects": [
      {
        "name": "string",
        "description": "string",
        "status": "planning|active|on-hold|completed|cancelled",
        "startDate": "date",
        "endDate": "date",
        "team": { "name": "string" },
        "manager": { "name": "string", "avatar": "string" },
        "members": [{ "name": "string", "avatar": "string" }]
      }
    ],
    "totalPages": "number",
    "currentPage": "number"
  }
  ```

#### Create Project
- **URL**: `/projects`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "startDate": "date",
    "endDate": "date",
    "teamId": "string",
    "members": ["userId"],
    "tags": ["string"],
    "priority": "low|medium|high|urgent",
    "budget": {
      "allocated": "number",
      "currency": "string"
    }
  }
  ```
- **Success Response**: Returns the created project object

#### Get Project by ID
- **URL**: `/projects/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: Returns detailed project object including tasks

#### Update Project
- **URL**: `/projects/:id`
- **Method**: `PUT`
- **Authentication**: Required (Project Manager only)
- **Request Body**: Any project fields to update
- **Success Response**: Returns updated project object

#### Delete Project
- **URL**: `/projects/:id`
- **Method**: `DELETE`
- **Authentication**: Required (Project Manager only)
- **Success Response**: `{ "message": "Project deleted successfully" }`

#### Project Member Management
- **Add Member**:
  - **URL**: `/projects/:id/members`
  - **Method**: `POST`
  - **Body**: `{ "userId": "string", "role": "string" }`

- **Remove Member**:
  - **URL**: `/projects/:id/members`
  - **Method**: `DELETE`
  - **Body**: `{ "userId": "string" }`

## Task Management

### Task Endpoints

#### Get Tasks
- **URL**: `/tasks`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `status` (optional): Filter by status
  - `priority` (optional): Filter by priority
  - `project` (optional): Filter by project ID
  - `assignee` (optional): Filter by assignee ID
  - `search` (optional): Search in task title and description
  - `dueDate` (optional): Filter by due date
  - `tags` (optional): Filter by tags (comma-separated)
- **Success Response**:
  ```json
  {
    "tasks": [
      {
        "title": "string",
        "description": "string",
        "status": "todo|in_progress|review|completed|blocked",
        "priority": "low|medium|high|urgent",
        "project": { "name": "string" },
        "assignees": [{ "name": "string", "avatar": "string" }],
        "dueDate": "date"
      }
    ],
    "totalPages": "number",
    "currentPage": "number",
    "totalTasks": "number"
  }
  ```

#### Create Task
- **URL**: `/tasks`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "projectId": "string",
    "assignees": ["userId"],
    "priority": "low|medium|high|urgent",
    "dueDate": "date",
    "tags": ["string"],
    "estimated": "number",
    "dependencies": [{ "task": "taskId", "type": "blocks|blocked_by" }],
    "subtasks": [{ "title": "string", "completed": "boolean" }]
  }
  ```
- **Success Response**: Returns the created task object

#### Get Task by ID
- **URL**: `/tasks/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: Returns detailed task object

#### Update Task
- **URL**: `/tasks/:id`
- **Method**: `PUT`
- **Authentication**: Required
- **Request Body**: Any task fields to update
- **Success Response**: Returns updated task object

#### Delete Task
- **URL**: `/tasks/:id`
- **Method**: `DELETE`
- **Authentication**: Required (Task Creator or Project Manager only)
- **Success Response**: `{ "message": "Task deleted successfully" }`

### Time Tracking

#### Start Time Tracking
- **URL**: `/tasks/:id/time/start`
- **Method**: `POST`
- **Body**: `{ "description": "string" }`

#### Stop Time Tracking
- **URL**: `/tasks/:id/time/stop`
- **Method**: `POST`

### Comments and Subtasks

#### Add Comment
- **URL**: `/tasks/:id/comments`
- **Method**: `POST`
- **Body**: `{ "content": "string" }`

#### Update Subtask
- **URL**: `/tasks/:id/subtasks`
- **Method**: `PUT`
- **Body**: `{ "subtaskId": "string", "completed": "boolean" }`

## Client Integration Guide

### Setting Up the Client

1. Install the required dependencies:
```bash
npm install axios @tanstack/react-query
```

2. Configure the API client:
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('firebase_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

3. Create service modules:
```javascript
// src/services/projectService.js
import api from './api';

export const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, data) => api.delete(`/projects/${id}/members`, { data }),
  getAnalytics: (id) => api.get(`/projects/${id}/analytics`)
};

// src/services/taskService.js
export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  startTimeTracking: (id, data) => api.post(`/tasks/${id}/time/start`, data),
  stopTimeTracking: (id) => api.post(`/tasks/${id}/time/stop`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  updateSubtask: (id, data) => api.put(`/tasks/${id}/subtasks`, data)
};
```

4. Use React Query for data management:
```javascript
// src/hooks/useProjects.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

export function useProjects(params) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectService.getProjects(params)
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });
}

// Similar hooks for other operations...
```

### Example Usage

```jsx
// src/components/ProjectList.jsx
import { useProjects, useCreateProject } from '../hooks/useProjects';

function ProjectList() {
  const { data, isLoading } = useProjects({ page: 1, limit: 10 });
  const createProject = useCreateProject();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.projects.map(project => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
}
```

### Error Handling

The API returns standard HTTP status codes:
- 400: Bad Request - Check request parameters
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Server Error - Internal server error

Client-side error handling example:
```javascript
try {
  await projectService.createProject(data);
} catch (error) {
  if (error.response) {
    // Handle specific error status codes
    switch (error.response.status) {
      case 400:
        showValidationError(error.response.data.message);
        break;
      case 403:
        showPermissionError();
        break;
      default:
        showGeneralError();
    }
  }
}
```

## Real-time Updates

The system supports real-time updates through WebSocket connections for:
- Task status changes
- New comments
- Time tracking updates
- Project progress updates

Implement real-time features using the socketService:
```javascript
// src/services/socketService.js
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('firebase_token')
  }
});

export const subscribeToProjectUpdates = (projectId, callback) => {
  socket.on(`project:${projectId}`, callback);
  return () => socket.off(`project:${projectId}`, callback);
};

export const subscribeToTaskUpdates = (taskId, callback) => {
  socket.on(`task:${taskId}`, callback);
  return () => socket.off(`task:${taskId}`, callback);
};
```

# Sample Requests

## Project Management Examples

### Create a New Project
```bash
POST /api/projects
{
  "name": "E-commerce Platform",
  "description": "Build a modern e-commerce platform with React and Node.js",
  "startDate": "2025-04-24",
  "endDate": "2025-07-24",
  "teamId": "team_id_here",
  "members": ["user_id_1", "user_id_2"],
  "tags": ["e-commerce", "react", "node"],
  "priority": "high",
  "budget": {
    "allocated": 50000,
    "currency": "USD"
  }
}
```

### Update Project Status
```bash
PUT /api/projects/:id
{
  "status": "active",
  "progress": 35
}
```

### Create a Task
```bash
POST /api/tasks
{
  "title": "Implement User Authentication",
  "description": "Add Firebase authentication with email and social providers",
  "projectId": "project_id_here",
  "assignees": ["user_id_1"],
  "priority": "high",
  "dueDate": "2025-05-01",
  "tags": ["auth", "security"],
  "estimated": 16,
  "dependencies": [],
  "subtasks": [
    {
      "title": "Setup Firebase configuration",
      "completed": false
    },
    {
      "title": "Implement login flow",
      "completed": false
    }
  ]
}
```

### Track Time on Task
```bash
POST /api/tasks/:id/time/start
{
  "description": "Working on login implementation"
}

POST /api/tasks/:id/time/stop
```

### Add Task Comment
```bash
POST /api/tasks/:id/comments
{
  "content": "Authentication flow completed, ready for review"
}
```

# Project Setup Guide

## Prerequisites

1. Node.js (v18 or higher)
2. MongoDB (v6 or higher)
3. Firebase account for authentication

## Backend Setup

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd backend
npm install
```

2. Set up environment variables:
Create a .env file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connect
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_firebase_project_id
```

3. Initialize Firebase Admin SDK:
- Download your Firebase service account key
- Save it as 'firebase-admin.json' in the config directory
- Update firebase.config.js with your credentials

4. Start the development server:
```bash
npm run dev
```

## Frontend Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Configure environment variables:
Create a .env file in the client directory:
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

3. Start the development server:
```bash
npm run dev
```

## Database Setup

The MongoDB schemas will be automatically created when you start the backend server. However, you can manually create the collections:

```javascript
use connect

db.createCollection("projects")
db.createCollection("tasks")
db.createCollection("teams")
db.createCollection("users")
```

## Initial Configuration

1. Configure Firebase Authentication:
   - Enable Email/Password authentication
   - Set up any OAuth providers (Google, GitHub, etc.)
   - Add your domain to authorized domains

2. Set up indexes for better performance:
```javascript
// Projects collection
db.projects.createIndex({ name: "text", description: "text", tags: "text" })
db.projects.createIndex({ team: 1, status: 1 })
db.projects.createIndex({ "members.user": 1 })

// Tasks collection
db.tasks.createIndex({ title: "text", description: "text", tags: "text" })
db.tasks.createIndex({ project: 1, status: 1 })
db.tasks.createIndex({ assignees: 1 })
```

## Testing

The project includes Postman collections for testing:

1. Import the collections from the `tests` directory:
   - auth.postman_collection.json
   - connect.postman_environment.json

2. Update the environment variables in Postman:
   - base_url
   - auth_token

3. Run the test suites to verify the setup

## Deployment Checklist

1. Security Considerations:
   - Update CORS settings in server.js
   - Set secure JWT secrets
   - Enable MongoDB authentication
   - Configure rate limiting

2. Performance Optimization:
   - Enable MongoDB indexes
   - Configure connection pooling
   - Set up caching if needed

3. Monitoring Setup:
   - Configure error logging
   - Set up performance monitoring
   - Enable usage analytics

## Common Issues and Solutions

1. Authentication Issues:
   - Verify Firebase configuration
   - Check JWT token expiration
   - Confirm CORS settings

2. Database Connection:
   - Check MongoDB connection string
   - Verify network access
   - Confirm database user permissions

3. Real-time Updates:
   - Check WebSocket connection
   - Verify socket.io configuration
   - Confirm client subscription to events