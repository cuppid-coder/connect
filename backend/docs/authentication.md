# Authentication and Security Patterns

## Authentication System

### Firebase Authentication Flow
1. **Client-Side Flow**
   - User signs in with Firebase Authentication
   - Firebase returns ID token
   - Token is included in API requests

2. **Server-Side Verification**
   - Verify Firebase ID token
   - Create/sync user in MongoDB
   - Attach user to request object

```javascript
// Auth Middleware Pattern
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

## Access Control System

### Resource Access Middleware
1. **Team Access**
```javascript
const validateTeamMembership = async (req, res, next) => {
  const { teamId } = req.params;
  const user = req.user;
  
  const team = await Team.findById(teamId);
  if (!team.members.includes(user._id)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
```

2. **Project Access**
```javascript
const validateProjectAccess = async (req, res, next) => {
  const { projectId } = req.params;
  const user = req.user;

  const project = await Project.findById(projectId)
    .populate('team');

  // Check visibility settings
  if (project.visibility === 'private') {
    if (!project.members.includes(user._id)) {
      return res.status(403);
    }
  }
  next();
};
```

3. **Task Access**
```javascript
const validateTaskAccess = async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('project');

  // Check task visibility
  if (task.visibility === 'private') {
    if (!task.assignees.includes(req.user._id)) {
      return res.status(403);
    }
  }
  next();
};
```

## Security Patterns

### Request Validation
1. **Input Sanitization**
```javascript
// Sanitize and validate input
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
```

2. **Query Parameters**
```javascript
// Safe query building
const buildQuery = (params) => {
  const query = {};
  if (params.status) query.status = params.status;
  if (params.priority) query.priority = params.priority;
  return query;
};
```

### Data Access Control
1. **Document Level**
```javascript
// Check document ownership
const isOwner = (doc, userId) => {
  return doc.creator.toString() === userId.toString();
};

// Check team membership
const isTeamMember = (team, userId) => {
  return team.members.some(member => 
    member.user.toString() === userId.toString()
  );
};
```

2. **Field Level**
```javascript
// Hide sensitive fields
schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.sensitiveData;
  return obj;
};
```

## WebSocket Security

### Connection Authentication
```javascript
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});
```

### Room Access Control
```javascript
// Verify room access before joining
const canJoinRoom = async (user, roomId) => {
  if (roomId.startsWith('project:')) {
    const projectId = roomId.split(':')[1];
    const project = await Project.findById(projectId);
    return project.members.includes(user._id);
  }
  return false;
};
```

## Rate Limiting

### API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

### WebSocket Rate Limiting
```javascript
// Implement event throttling
const throttle = (socket, event, limit) => {
  const now = Date.now();
  if (!socket.lastEvent || now - socket.lastEvent >= limit) {
    socket.lastEvent = now;
    return true;
  }
  return false;
};
```

## Error Handling

### API Error Responses
```javascript
// Standard error response
const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
};
```

### WebSocket Error Handling
```javascript
socket.on('error', (error) => {
  console.error(`Socket Error: ${error.message}`);
  socket.emit('error', {
    message: "An error occurred",
    code: error.code
  });
});
```