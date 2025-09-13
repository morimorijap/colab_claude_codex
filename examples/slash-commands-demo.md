# Slash Commands Demo

This document shows practical examples of using slash commands in PR comments.

## Basic Commands

### 1. Quick Review

```
/codex:review
```

**Result**: Performs a standard code review focusing on common issues.

### 2. Thorough Review

```
/codex:review --depth thorough
```

**Result**: Deep analysis including architecture, performance, and security.

### 3. Security Audit

```
/codex:review --depth security
```

**Result**: Focuses specifically on security vulnerabilities and best practices.

## Refactoring Commands

### 1. Module-Level Refactoring

```
/codex:refactoring --scope module --focus readability
```

**Example Output**:
```markdown
## 🔧 Refactoring Suggestions

### Module: src/api/users.js

1. **Extract Common Logic**
   - Lines 45-67, 89-111, 145-167 contain duplicate code
   - Suggestion: Create shared utility function

2. **Simplify Nested Conditions**
   - Lines 78-95 have 4 levels of nesting
   - Suggestion: Use early returns and guard clauses

3. **Improve Naming**
   - Variable `d` on line 23 should be `userData`
   - Function `proc` should be `processUserData`
```

### 2. Performance-Focused Refactoring

```
/codex:refactoring --focus performance
```

**Example Output**:
```markdown
## ⚡ Performance Optimization Suggestions

1. **Database Query Optimization**
   ```javascript
   // Current: Multiple queries
   const user = await getUser(id);
   const posts = await getUserPosts(id);
   const comments = await getUserComments(id);

   // Suggested: Single joined query
   const userData = await getUserWithRelations(id, ['posts', 'comments']);
   ```

2. **Caching Opportunity**
   - Frequently accessed data on lines 34-45
   - Suggestion: Implement Redis caching

3. **Algorithm Improvement**
   - O(n²) loop on line 67
   - Suggestion: Use Map for O(n) lookup
```

## Suggestion Commands

### 1. Problem-Specific Solutions

```
/codex:suggest --problem "API response time is over 2 seconds" --constraints "no new dependencies,maintain backward compatibility"
```

**Example Output**:
```markdown
## 💡 Suggested Solutions

### Problem: Slow API Response

Given constraints:
- ✅ No new dependencies
- ✅ Maintain backward compatibility

### Solution 1: Implement Response Caching
```javascript
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getCachedData(key, fetchFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### Solution 2: Pagination Implementation
```javascript
async function getPaginatedResults(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return await db.query(
    'SELECT * FROM table LIMIT ? OFFSET ?',
    [limit, offset]
  );
}
```

### Solution 3: Database Index Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
```
```

### 2. Architecture Suggestions

```
/codex:suggest --problem "monolithic service is hard to maintain" --constraints "gradual migration,no downtime"
```

**Example Output**:
```markdown
## 🏗️ Architecture Migration Strategy

### Gradual Microservices Migration

#### Phase 1: Extract Authentication Service (Week 1-2)
```yaml
services:
  auth-service:
    responsibilities:
      - User authentication
      - Token management
      - Session handling
    api:
      - POST /auth/login
      - POST /auth/logout
      - GET /auth/verify
```

#### Phase 2: Implement API Gateway (Week 3)
```javascript
// Simple API Gateway implementation
const express = require('express');
const httpProxy = require('http-proxy-middleware');

const app = express();

// Route to auth service
app.use('/auth', httpProxy({
  target: 'http://auth-service:3001',
  changeOrigin: true
}));

// Route to main app (legacy)
app.use('/', httpProxy({
  target: 'http://legacy-app:3000',
  changeOrigin: true
}));
```

#### Phase 3: Database Separation (Week 4-5)
- Use database views for shared data
- Implement event sourcing for data sync
- No downtime migration strategy included
```

## Combined Commands

### Complex Review Request

```
/codex:review --depth thorough
/codex:refactoring --scope file --focus patterns
/codex:suggest --problem "test coverage is only 40%" --constraints "use existing test framework"
```

This triggers:
1. Comprehensive code review
2. Pattern-based refactoring suggestions
3. Test improvement recommendations

## Special Commands

### 1. Compare Multiple AI Models

```
/codex:compare --models gpt4,claude --problem "optimize database schema"
```

**Result**: Gets suggestions from multiple AI models for comparison.

### 2. Auto-Apply Safe Suggestions

```
/codex:apply --risk low --confidence 0.9
```

**Result**: Automatically applies low-risk, high-confidence suggestions.

### 3. Generate Documentation

```
/codex:document --type api --format openapi
```

**Result**: Generates API documentation in OpenAPI format.

## Interactive Workflow

### Step-by-Step Refactoring

```
User: /codex:refactoring --scope function getUserData

Codex: Here are 3 refactoring suggestions...

User: Apply suggestion 1 and 3

Codex: Applied. Running tests...

User: /codex:review --depth quick

Codex: All tests pass. Code quality improved by 15%.
```

## Command Chaining

### Automated Improvement Cycle

```
/codex:review --depth quick && \
/codex:apply --risk low && \
/codex:test --coverage && \
/codex:merge --if-passes
```

This chain:
1. Reviews code quickly
2. Applies low-risk fixes
3. Runs tests with coverage
4. Merges if all tests pass

## Error Handling

### When Commands Fail

```
User: /codex:refactoring --scope undefined

Codex: ❌ Error: Invalid scope 'undefined'

Available scopes:
- file: Single file refactoring
- function: Function-level refactoring
- module: Module-wide refactoring
- project: Project-wide refactoring

Example: /codex:refactoring --scope module
```

## Best Practices

1. **Start with Quick Review**
   ```
   /codex:review --depth quick
   ```

2. **Request Specific Help**
   ```
   /codex:suggest --problem "specific issue description"
   ```

3. **Apply Incrementally**
   ```
   /codex:apply --risk low
   # Test
   /codex:apply --risk medium
   # Test
   ```

4. **Document Decisions**
   ```
   /codex:document --decisions "why we chose this approach"
   ```

## Troubleshooting

### Command Not Working

```
/codex:debug --last-command
```

Shows debug information about the last command execution.

### Rate Limited

```
/codex:status
```

Shows current rate limit status and when you can retry.

### Cancel Running Analysis

```
/codex:cancel
```

Cancels any running analysis for the current PR.