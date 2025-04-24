# Data Models and Schema Conventions

## Schema Design Patterns

### Base Fields
All models include these base fields:
```javascript
{
  timestamps: true, // Adds createdAt and updatedAt
  // Common fields in all schemas
  _id: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Relationship Types

1. **Direct References**
```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}
```

2. **Embedded Documents**
```javascript
{
  comments: [{
    user: ObjectId,
    content: String,
    createdAt: Date
  }]
}
```

3. **Embedded Arrays**
```javascript
{
  tags: [String],
  members: [{ type: ObjectId, ref: 'User' }]
}
```

## Model-Specific Patterns

### User Model
- Authentication fields (firebaseUID)
- Profile information
- Relationships (teams, contacts)
- Preferences and settings
- Online status tracking

### Team Model
- Hierarchical structure (leader, members)
- Visibility control
- Join request handling
- Metrics tracking
- Project aggregation

### Project Model
- Team association
- Member management
- Task organization
- Progress tracking
- Access control
- Time and budget tracking
- Real-time commenting

### Task Model
- Project association
- Assignment system
- Status workflow
- Time tracking
- Dependencies
- Subtasks
- Comments
- Visibility control

## Indexing Patterns

### Text Search Indexes
```javascript
// Example text index
schema.index({
  name: "text",
  description: "text",
  tags: "text"
});
```

### Compound Indexes
```javascript
// Example compound indexes
schema.index({ "members.user": 1 });
schema.index({ team: 1, status: 1 });
schema.index({ project: 1, assignees: 1 });
```

## Data Validation

### Required Fields
```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  }
}
```

### Enums
```javascript
{
  status: {
    type: String,
    enum: ["todo", "in_progress", "review", "completed"],
    default: "todo"
  }
}
```

### Custom Validation
```javascript
{
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: "End date must be after start date"
    }
  }
}
```

## Middleware Patterns

### Pre-save Hooks
```javascript
schema.pre("save", async function(next) {
  if (this.isModified("status")) {
    // Update related documents
    await updateRelatedDocs();
  }
  next();
});
```

### Post-save Hooks
```javascript
schema.post("save", async function(doc) {
  // Send notifications
  await notifySubscribers(doc);
});
```

## Instance Methods

### Common Patterns
```javascript
// Calculation methods
schema.methods.calculateProgress = async function() {
  // Calculate and return progress
};

// Status update methods
schema.methods.updateStatus = async function(newStatus) {
  // Update status and handle side effects
};

// Metrics update methods
schema.methods.updateMetrics = async function() {
  // Update various metrics
};
```

## Static Methods

### Query Helpers
```javascript
schema.statics.findByMember = function(userId) {
  return this.find({ "members.user": userId });
};
```

## Virtuals

### Computed Fields
```javascript
schema.virtual("displayName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});
```

## Security Patterns

### Data Sanitization
```javascript
{
  name: {
    type: String,
    trim: true,
    maxLength: 100,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s-_]+$/.test(v);
      }
    }
  }
}
```

### Sensitive Data
```javascript
schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.sensitiveField;
  return obj;
};
```