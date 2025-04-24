# Real-time Communication and Event Patterns

## WebSocket Architecture

### Connection Management
- Authentication using JWT tokens
- Automatic reconnection handling
- Room-based communication
- User presence tracking

### Socket Manager Structure
```javascript
class SocketManager {
  constructor(io) {
    this.io = io;
    this.chatRooms = new Map();
    this.userSockets = new Map();
    this.notificationRooms = new Map();
    this.onlineUsers = new Map();
    this.projectRooms = new Map();
  }
}
```

## Room Management

### Room Types
1. **User-Specific Rooms**
   - `notifications:${userId}` - Personal notifications
   - `contacts:${userId}` - Contact updates
   - `presence:${userId}` - Online status updates

2. **Project Rooms**
   - `project:${projectId}` - Project updates
   - `project:${projectId}:comments` - Project comments
   - `project:${projectId}:activity` - Project activity

3. **Task Rooms**
   - `task:${taskId}` - Task updates
   - `task:${taskId}:comments` - Task comments
   - `task:${taskId}:time` - Time tracking updates

4. **Team Rooms**
   - `team:${teamId}` - Team-wide updates
   - `team:${teamId}:chat` - Team chat

### Room Lifecycle
```javascript
// Joining rooms
socket.join(`project:${projectId}`);
socket.join(`notifications:${userId}`);

// Leaving rooms
socket.leave(`project:${projectId}`);
```

## Event Patterns

### Comment Events
1. **Typing Indicators**
```javascript
{
  event: 'typing_comment',
  data: {
    userId: string,
    userName: string,
    timestamp: Date
  }
}
```

2. **Comment Updates**
```javascript
{
  event: 'new_comment',
  data: {
    id: string,
    content: string,
    user: Object,
    timestamp: Date,
    mentions: string[]
  }
}
```

### Notification Events
1. **Resource Updates**
```javascript
{
  event: 'resource_updated',
  data: {
    type: string, // 'project', 'task', etc.
    id: string,
    changes: Object,
    updatedBy: string
  }
}
```

2. **User Activities**
```javascript
{
  event: 'user_activity',
  data: {
    userId: string,
    action: string,
    resource: Object,
    timestamp: Date
  }
}
```

## Real-time Features

### Presence System
1. **Status Updates**
```javascript
{
  event: 'status_change',
  data: {
    userId: string,
    status: 'online' | 'offline' | 'away',
    lastSeen: Date
  }
}
```

2. **Activity Tracking**
```javascript
{
  event: 'user_active',
  data: {
    userId: string,
    location: string, // e.g., 'project:123'
    activity: string
  }
}
```

### Collaboration Features
1. **Comment Thread Updates**
- Real-time comment posting
- Typing indicators
- Mention notifications
- Edit/delete notifications

2. **Task Updates**
- Status changes
- Assignment changes
- Progress updates
- Time tracking updates

3. **Project Updates**
- Member activities
- Resource changes
- Progress tracking
- Deadline notifications

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  // Handle connection errors
});
```

### Event Errors
```javascript
socket.on('error', (error) => {
  // Handle event errors
});
```

## Performance Patterns

### Room Management
- Clean up rooms when empty
- Limit room sizes
- Implement room timeouts

### Event Throttling
```javascript
// Implement debouncing for typing indicators
const debounceTyping = debounce((socket, data) => {
  socket.to(roomId).emit('typing', data);
}, 300);
```

### Connection Pooling
- Maintain connection pools
- Implement reconnection strategies
- Handle connection limits

## Security Patterns

### Authentication
```javascript
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    // Verify token and attach user
    socket.user = verifiedUser;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### Room Access Control
```javascript
// Verify room access before joining
socket.on('join_room', async (roomId) => {
  if (await canAccessRoom(socket.user, roomId)) {
    socket.join(roomId);
  }
});
```

### Event Validation
```javascript
// Validate event data before processing
socket.on('send_message', (data) => {
  if (validateMessageData(data)) {
    processMessage(data);
  }
});
```