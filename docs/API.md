# 🔌 API Documentation

Claude Code × OpenAI Codex協業システムのAPI仕様書です。

## 📋 目次

1. [概要](#概要)
2. [Slash Commands API](#slash-commands-api)
3. [GitHub Actions API](#github-actions-api)
4. [Webhook API](#webhook-api)
5. [Codex Integration API](#codex-integration-api)
6. [データモデル](#データモデル)
7. [エラーハンドリング](#エラーハンドリング)

## 概要

### ベースURL

```
GitHub Actions: https://github.com/{owner}/{repo}/actions
Webhook: https://your-server.com/webhook
```

### 認証

```http
Authorization: Bearer {GITHUB_TOKEN}
X-OpenAI-API-Key: {OPENAI_API_KEY}
```

### レート制限

| エンドポイント | 制限 | 期間 |
|--------------|------|------|
| Codex API | 60 requests | 1分 |
| GitHub API | 5000 requests | 1時間 |
| Webhook | 100 requests | 1分 |

## Slash Commands API

### `/codex:refactoring`

コードのリファクタリング提案を要求します。

#### パラメータ

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `scope` | string | No | `file`, `function`, `module` |
| `focus` | string | No | `performance`, `readability`, `patterns` |

#### 使用例

```
/codex:refactoring --scope module --focus readability
```

#### レスポンス

```javascript
{
  "status": "processing",
  "job_id": "refactor-123456",
  "estimated_time": 30,
  "pr_number": 42
}
```

### `/codex:review`

包括的なコードレビューを実行します。

#### パラメータ

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `depth` | string | No | `quick`, `thorough`, `security` |

#### 使用例

```
/codex:review --depth thorough
```

#### レスポンス

```javascript
{
  "status": "completed",
  "suggestions_count": 5,
  "severity_breakdown": {
    "error": 1,
    "warning": 3,
    "info": 1
  }
}
```

### `/codex:suggest`

特定の問題に対する解決策を提案します。

#### パラメータ

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `problem` | string | Yes | 問題の説明 |
| `constraints` | array | No | 制約条件のリスト |

#### 使用例

```
/codex:suggest --problem "API response is slow" --constraints "no external deps,maintain compatibility"
```

## GitHub Actions API

### Workflow Dispatch

#### エンドポイント

```http
POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
```

#### リクエストボディ

```json
{
  "ref": "main",
  "inputs": {
    "review_type": "comprehensive",
    "pr_number": "123",
    "options": {
      "auto_apply": true,
      "risk_threshold": "medium"
    }
  }
}
```

#### レスポンス

```http
HTTP/1.1 204 No Content
```

### Workflow Run Status

#### エンドポイント

```http
GET /repos/{owner}/{repo}/actions/runs/{run_id}
```

#### レスポンス

```json
{
  "id": 123456789,
  "status": "completed",
  "conclusion": "success",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:05:00Z",
  "jobs_url": "https://api.github.com/repos/{owner}/{repo}/actions/runs/123456789/jobs"
}
```

## Webhook API

### PR Event Webhook

#### エンドポイント

```http
POST /webhook/pr
```

#### Headers

```http
X-GitHub-Event: pull_request
X-GitHub-Delivery: uuid
X-Hub-Signature-256: sha256=hash
```

#### リクエストボディ

```json
{
  "action": "opened",
  "number": 123,
  "pull_request": {
    "id": 456789,
    "number": 123,
    "state": "open",
    "title": "Feature: Add new functionality",
    "user": {
      "login": "username",
      "id": 12345
    },
    "head": {
      "ref": "feature-branch",
      "sha": "abc123"
    },
    "base": {
      "ref": "main",
      "sha": "def456"
    }
  }
}
```

#### レスポンス

```json
{
  "status": "accepted",
  "message": "Review triggered",
  "job_id": "review-123456"
}
```

### Comment Event Webhook

#### エンドポイント

```http
POST /webhook/comment
```

#### リクエストボディ

```json
{
  "action": "created",
  "comment": {
    "id": 789012,
    "body": "/codex:review --depth quick",
    "user": {
      "login": "username"
    }
  },
  "issue": {
    "number": 123,
    "pull_request": {
      "url": "https://api.github.com/repos/{owner}/{repo}/pulls/123"
    }
  }
}
```

## Codex Integration API

### Analyze Code

#### エンドポイント

```http
POST /api/codex/analyze
```

#### リクエストボディ

```json
{
  "code": "function example() { return 42; }",
  "language": "javascript",
  "analysis_type": "refactoring",
  "options": {
    "max_suggestions": 10,
    "min_confidence": 0.7
  }
}
```

#### レスポンス

```json
{
  "analysis_id": "analysis-123",
  "timestamp": "2024-01-01T00:00:00Z",
  "suggestions": [
    {
      "id": "sug-001",
      "type": "refactoring",
      "severity": "warning",
      "message": "Consider using arrow function",
      "original_code": "function example() { return 42; }",
      "suggested_code": "const example = () => 42;",
      "confidence": 0.85,
      "impact": {
        "risk": "low",
        "performance": "neutral",
        "readability": "improved"
      }
    }
  ]
}
```

### Apply Suggestions

#### エンドポイント

```http
POST /api/codex/apply
```

#### リクエストボディ

```json
{
  "pr_number": 123,
  "suggestion_ids": ["sug-001", "sug-003"],
  "options": {
    "create_commit": true,
    "commit_message": "Apply Codex suggestions"
  }
}
```

#### レスポンス

```json
{
  "status": "success",
  "applied_count": 2,
  "failed_count": 0,
  "commit_sha": "abc123def456",
  "details": [
    {
      "suggestion_id": "sug-001",
      "status": "applied",
      "file": "src/example.js"
    }
  ]
}
```

## データモデル

### Suggestion Object

```typescript
interface Suggestion {
  id: string;
  type: 'refactoring' | 'optimization' | 'security' | 'style';
  severity: 'error' | 'warning' | 'info';
  file?: string;
  line_start?: number;
  line_end?: number;
  message: string;
  original_code?: string;
  suggested_code?: string;
  explanation?: string;
  confidence: number; // 0.0 - 1.0
  impact: {
    risk: 'low' | 'medium' | 'high';
    performance: 'positive' | 'neutral' | 'negative';
    readability: 'improved' | 'unchanged' | 'degraded';
  };
  breaking_change?: boolean;
}
```

### Analysis Result

```typescript
interface AnalysisResult {
  analysis_id: string;
  timestamp: string; // ISO 8601
  review_type: string;
  pr_number?: number;
  total_suggestions: number;
  suggestions: Suggestion[];
  metadata: {
    files_analyzed: number;
    lines_analyzed: number;
    execution_time: number; // milliseconds
  };
}
```

### Review Comment

```typescript
interface ReviewComment {
  id: number;
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  body: string;
  suggestion?: {
    original: string;
    replacement: string;
  };
  created_at: string;
  updated_at: string;
}
```

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `UNAUTHORIZED` | 401 | 認証失敗 |
| `FORBIDDEN` | 403 | アクセス権限なし |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `RATE_LIMITED` | 429 | レート制限超過 |
| `INVALID_REQUEST` | 400 | 不正なリクエスト |
| `INTERNAL_ERROR` | 500 | サーバーエラー |
| `SERVICE_UNAVAILABLE` | 503 | サービス利用不可 |

### エラー処理例

```javascript
try {
  const response = await fetch('/api/codex/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json();
    switch (error.error.code) {
      case 'RATE_LIMITED':
        // Wait and retry
        await delay(60000);
        return retry();

      case 'UNAUTHORIZED':
        // Refresh token
        await refreshToken();
        return retry();

      default:
        throw new Error(error.error.message);
    }
  }

  return await response.json();

} catch (error) {
  console.error('API Error:', error);
  // Handle network errors
}
```

## Webhookセキュリティ

### 署名検証

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Express.js middleware
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
});
```

## レート制限の処理

### Retry-After ヘッダー

```javascript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

      console.log(`Rate limited. Retrying after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

## SDK使用例

### JavaScript/TypeScript

```typescript
import { CodexClient } from '@colab/codex-client';

const client = new CodexClient({
  apiKey: process.env.OPENAI_API_KEY,
  githubToken: process.env.GITHUB_TOKEN
});

// Analyze PR
const analysis = await client.analyzePR({
  owner: 'morimorijap',
  repo: 'colab_claude_codex',
  prNumber: 123,
  reviewType: 'comprehensive'
});

// Apply suggestions
const result = await client.applySuggestions({
  prNumber: 123,
  suggestionIds: analysis.suggestions
    .filter(s => s.confidence > 0.8)
    .map(s => s.id)
});
```

### Python

```python
from colab_codex import CodexClient

client = CodexClient(
    api_key=os.environ['OPENAI_API_KEY'],
    github_token=os.environ['GITHUB_TOKEN']
)

# Analyze code
analysis = client.analyze_code(
    code=code_content,
    language='python',
    analysis_type='security'
)

# Post review
for suggestion in analysis.suggestions:
    if suggestion.severity == 'error':
        client.post_review_comment(
            pr_number=123,
            suggestion=suggestion
        )
```

## 制限事項

### ファイルサイズ制限

- 単一ファイル: 10MB
- PR全体: 50MB
- 差分: 10,000行

### タイムアウト

- API呼び出し: 30秒
- 分析処理: 5分
- Webhook処理: 10秒

### 並行処理

- 同時分析: 5 PRまで
- 同時提案適用: 10件まで

---

**API Documentation v1.0.0**

更新履歴は[CHANGELOG.md](../CHANGELOG.md)を参照してください。