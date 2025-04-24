# API Patterns and Conventions

## Resource Organization

### Endpoints Structure
- `/api/[resource]` - Base route for resource (e.g., /api/projects)
- `/api/[resource]/:id` - Resource by ID
- `/api/[resource]/:id/[sub-resource]` - Sub-resources (e.g., /api/projects/:id/comments)

### HTTP Methods
- GET: Retrieve resources
- POST: Create new resources
- PUT: Update existing resources
- DELETE: Remove resources

## Access Control Patterns

### Visibility Levels
1. **Projects**
   - `public`: Accessible to all users
   - `private`: Only accessible to project members
   - `team_only`: Accessible to team members

2. **Tasks**
   - `public`: Accessible to all users
   - `private`: Only accessible to assignees and creator
   - `project`: Accessible to project members
   - `team`: Accessible to team members

3. **Teams**
   - `public`: Anyone can see and join
   - `private`: Only visible to members
   - `request_to_join`: Visible to all, requires approval to join

### Access Control Implementation
```javascript
// Example of visibility check in middleware
if (resource.visibility === 'private') {
  if (!isMember) return forbidden();
} else if (resource.visibility === 'team_only') {
  if (!isTeamMember) return forbidden();
}
```

## Real-time Communication Patterns

### Socket Room Structure
- `project:${projectId}` - Project-specific updates
- `task:${taskId}` - Task-specific updates
- `team:${teamId}` - Team-wide notifications
- `notifications:${userId}` - User's personal notifications
- `contacts:${userId}` - Contact-related updates

### Comment System
1. **Room Joining Pattern**
```javascript
socket.join(`project:${projectId}:comments`);
socket.join(`task:${taskId}:comments`);
```

2. **Real-time Events**
- `comment_typing`
- `comment_typing_stopped`
- `new_comment`
- `comment_edited`
- `comment_deleted`

## Notification System

### Notification Types
- Task-related: `TASK_ASSIGNED`, `TASK_COMPLETED`, `TASK_COMMENT`
- Project-related: `PROJECT_UPDATE`, `PROJECT_COMMENT`
- Team-related: `TEAM_INVITE`, `TEAM_JOIN`
- Social: `MENTION`, `COMMENT`, `CONTACT_REQUEST`

### Notification Structure
```javascript
{
  recipient: userId,
  type: NOTIFICATION_TYPE,
  title: "Human readable title",
  content: "Detailed message",
  reference: {
    model: "Model name",
    id: referenceId
  }
}
```

## Data Access Patterns

### Middleware Chain
1. Authentication (`authMiddleware`)
2. Resource Access Validation (`validateProjectAccess`, `validateTaskAccess`)
3. Route Handler

### Population Patterns
```javascript
// Standard population pattern
Model.findById(id)
  .populate("team", "name members")
  .populate("manager", "name avatar email")
  .populate("members.user", "name avatar email")
```

## Error Handling Patterns

### Standard Error Response
```javascript
{
  message: "Error description",
  error: process.env.NODE_ENV === "development" ? error.message : undefined
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error