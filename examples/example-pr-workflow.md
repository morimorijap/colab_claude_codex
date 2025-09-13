# Example PR Workflow

This document demonstrates a complete workflow using the Claude Code × OpenAI Codex collaboration system.

## Scenario: Adding User Authentication Feature

### Step 1: Create Feature Branch

```bash
# Create and checkout feature branch
git checkout -b feature/user-authentication

# Start development
touch src/auth.js
```

### Step 2: Implement Initial Code

```javascript
// src/auth.js
function authenticateUser(username, password) {
  // Simple authentication logic
  const users = {
    'admin': 'admin123',
    'user': 'user456'
  };

  if (users[username] === password) {
    console.log('Authentication successful');
    return { success: true, user: username };
  } else {
    console.log('Authentication failed');
    return { success: false };
  }
}

function createSession(user) {
  const sessionId = Math.random().toString(36);
  const sessions = {};
  sessions[sessionId] = user;
  return sessionId;
}

module.exports = { authenticateUser, createSession };
```

### Step 3: Commit and Push

```bash
git add src/auth.js
git commit -m "feat: Add basic user authentication"
git push origin feature/user-authentication
```

### Step 4: Create Pull Request

```bash
gh pr create \
  --title "Feature: User Authentication System" \
  --body "## Description

  Implements basic user authentication with session management.

  ## Changes
  - Add authentication function
  - Add session creation

  ## Testing
  Manual testing completed

  /codex:review --depth thorough" \
  --label "codex-review,feature"
```

### Step 5: Codex Review Triggered

The GitHub Action automatically runs and posts a review:

```markdown
## 🤖 Codex AI Review Results

**Review Type**: thorough
**Total Suggestions**: 5
**Timestamp**: 2024-01-15T10:30:00Z

### 📊 Analysis Summary

1. **Line 5**: Hardcoded credentials detected
   - Severity: error
   - Confidence: 95%

2. **Line 10**: Missing error handling
   - Severity: warning
   - Confidence: 85%

3. **Line 8,14**: Console.log in production code
   - Severity: warning
   - Confidence: 90%

4. **Line 18**: Weak session ID generation
   - Severity: error
   - Confidence: 92%

5. **Line 19**: Memory leak - sessions never cleared
   - Severity: warning
   - Confidence: 88%

### 💡 Suggestion #1: Remove Hardcoded Credentials

**File**: `src/auth.js:5-7`
**Severity**: ⚠️ Error
**Confidence**: 95%

#### Current Code:
```javascript
const users = {
  'admin': 'admin123',
  'user': 'user456'
};
```

#### Suggested Code:
```suggestion
// Load from secure configuration
const users = await loadUsersFromDatabase();
// Or use environment variables
const users = {
  [process.env.ADMIN_USER]: process.env.ADMIN_PASS
};
```

#### Explanation:
- ✅ **Improvement**: Removes security vulnerability
- 📈 **Performance Impact**: Minimal
- 🛡️ **Security**: Critical improvement
- 📖 **Readability**: Maintains clarity

---
[Accept Suggestion] [Modify] [Dismiss]
```

### Step 6: Developer Reviews Suggestions

Add a comment to the PR:

```
Thanks for the review! I'll apply suggestions 1, 4, and 5.

/codex:suggest --problem "secure session management" --constraints "use JWT,no external database"
```

### Step 7: Codex Provides Additional Suggestions

```markdown
## 🤖 Codex Suggestion: Secure Session Management

Based on your constraints (use JWT, no external database), here's a suggested implementation:

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Store this securely (environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function authenticateUser(username, password) {
  try {
    // In production, fetch from database
    const users = await getUsersFromConfig();

    const user = users[username];
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return { success: false, error: 'Invalid password' };
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { authenticateUser, verifyToken };
```

This implementation:
- ✅ Uses JWT for stateless sessions
- ✅ Implements password hashing with bcrypt
- ✅ Includes error handling
- ✅ No hardcoded credentials
- ✅ Token expiration for security
```

### Step 8: Apply Changes

The developer updates the code based on suggestions:

```bash
# Make changes based on Codex suggestions
vim src/auth.js

# Add dependencies
npm install jsonwebtoken bcrypt

# Commit changes
git add .
git commit -m "refactor: Implement secure authentication with JWT

- Replace hardcoded credentials with secure config
- Add JWT token generation
- Implement bcrypt password hashing
- Add comprehensive error handling

Co-authored-by: Codex AI <codex@openai.com>"

git push origin feature/user-authentication
```

### Step 9: Final Review

Add a comment to trigger final review:

```
Changes applied based on Codex suggestions. Ready for final review.

/codex:review --depth security
```

### Step 10: Codex Approves

```markdown
## ✅ Codex Analysis Complete

**Security Review**: PASSED

No critical security issues found. The implementation now includes:
- ✅ Secure password hashing
- ✅ JWT token management
- ✅ No hardcoded credentials
- ✅ Proper error handling
- ✅ Session expiration

**Label added**: `codex-approved`

The PR is ready for merge.
```

### Step 11: Automatic Merge

The Merge Consensus workflow automatically merges the PR after:
- All checks pass ✅
- Codex approval received ✅
- No merge conflicts ✅

```markdown
## ✅ PR Merged Successfully

**Merge SHA**: abc123def456
**Method**: Squash and merge

This PR was automatically merged after meeting consensus criteria.
```

## Complete Timeline

```
10:00 - Developer creates PR with initial code
10:01 - Codex review triggered automatically
10:02 - 5 suggestions posted as PR comments
10:15 - Developer reviews and requests specific help
10:16 - Codex provides JWT implementation suggestion
10:30 - Developer applies changes and pushes
10:31 - Final security review triggered
10:32 - Codex approves changes
10:33 - PR automatically merged
```

## Metrics

- **Time to Review**: 1 minute
- **Suggestions Provided**: 5
- **Suggestions Applied**: 3
- **Security Issues Fixed**: 2
- **Total PR Time**: 33 minutes

## Key Takeaways

1. **Immediate Feedback**: Codex provides instant code review
2. **Security Focus**: Critical security issues caught early
3. **Collaborative**: Developer can request specific suggestions
4. **Automated**: Merge happens automatically when criteria met
5. **Documented**: All decisions and changes tracked in PR