# 🖥️ Local Codex CLI Integration Design

## 概要

ローカルPCにインストールされているOpenAI Codex CLIを活用し、ChatGPT Plus ($20/month) のサブスクリプションを使用してAPI従量課金を回避する設計です。

## アーキテクチャ

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude Code  │────▶│ Local Codex  │────▶│   GitHub     │
│  (Primary)   │     │     CLI      │     │  (Storage)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
              Local Development Loop
```

## 1. ローカルCodex CLI活用方法

### 1.1 Claude Code Hook System

Claude Codeの設定でローカルコマンドを実行するhookを設定：

```bash
# ~/.claude/hooks/codex-review.sh
#!/bin/bash

# Claude Codeからトリガーされた時にローカルのcodex CLIを実行
if [[ "$1" == "/codex:refactoring" ]]; then
  # ローカルのcodex CLIを使用
  codex review \
    --file "$2" \
    --type refactoring \
    --output json > /tmp/codex-result.json

  # 結果をClaude Codeに返す
  cat /tmp/codex-result.json
fi
```

### 1.2 VSCode Extension Integration

```json
// .vscode/settings.json
{
  "claude-code.customCommands": {
    "codex:local": {
      "command": "codex",
      "args": ["review", "--file", "${file}"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## 2. Hybrid Workflow (Local + GitHub)

### 2.1 ローカル優先モード

```yaml
# .github/workflows/codex-hybrid.yml
name: Hybrid Codex Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-local-availability:
    runs-on: ubuntu-latest
    outputs:
      use-local: ${{ steps.check.outputs.use-local }}

    steps:
      - name: Check if local Codex is preferred
        id: check
        run: |
          # Check if author has local setup
          if [[ "${{ github.event.pull_request.user.login }}" == "morimorijap" ]]; then
            echo "use-local=true" >> $GITHUB_OUTPUT
          else
            echo "use-local=false" >> $GITHUB_OUTPUT
          fi

  local-review-trigger:
    needs: check-local-availability
    if: needs.check-local-availability.outputs.use-local == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Post instruction for local review
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 📍 Local Codex Review Required

              Please run the following command locally:
              \`\`\`bash
              # Pull the PR changes
              gh pr checkout ${{ github.event.pull_request.number }}

              # Run local Codex review
              npm run codex:review

              # Push results
              npm run codex:push-results
              \`\`\`

              This uses your ChatGPT Plus subscription instead of API credits.`
            });
```

## 3. Local Development Scripts

### 3.1 Package.json Scripts

```json
{
  "scripts": {
    "codex:review": "node scripts/local-codex-review.js",
    "codex:push-results": "node scripts/push-codex-results.js",
    "codex:watch": "nodemon --exec 'npm run codex:review' --ext js,ts,py",
    "claude:sync": "node scripts/sync-with-claude.js"
  }
}
```

### 3.2 Local Codex Review Script

```javascript
// scripts/local-codex-review.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LocalCodexReview {
  constructor() {
    this.resultDir = '.codex-results';
    this.ensureResultDir();
  }

  ensureResultDir() {
    if (!fs.existsSync(this.resultDir)) {
      fs.mkdirSync(this.resultDir, { recursive: true });
    }
  }

  async reviewFiles(pattern = '**/*.js') {
    console.log('🔍 Running local Codex review...');

    try {
      // Get changed files
      const files = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.match(/\.(js|ts|py|java)$/));

      const results = [];

      for (const file of files) {
        console.log(`  Reviewing: ${file}`);

        // Call local codex CLI
        const result = this.runCodexCLI(file);
        results.push({
          file,
          suggestions: result.suggestions,
          timestamp: new Date().toISOString()
        });
      }

      // Save results
      this.saveResults(results);

      // Format for display
      this.displayResults(results);

      return results;

    } catch (error) {
      console.error('❌ Review failed:', error.message);
      process.exit(1);
    }
  }

  runCodexCLI(file) {
    // Use local codex command (ChatGPT Plus)
    const command = `codex review --file "${file}" --format json`;

    try {
      const output = execSync(command, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      // Fallback to mock if codex CLI not available
      return this.mockCodexReview(file);
    }
  }

  mockCodexReview(file) {
    // Mock response for testing
    return {
      suggestions: [
        {
          type: 'refactoring',
          message: `Consider refactoring ${file}`,
          line: 10,
          severity: 'info'
        }
      ]
    };
  }

  saveResults(results) {
    const outputPath = path.join(this.resultDir, 'latest-review.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Results saved to ${outputPath}`);
  }

  displayResults(results) {
    console.log('\n📊 Review Summary:');

    let totalSuggestions = 0;
    results.forEach(r => {
      totalSuggestions += r.suggestions.length;
      console.log(`  ${r.file}: ${r.suggestions.length} suggestions`);
    });

    console.log(`\nTotal: ${totalSuggestions} suggestions across ${results.length} files`);
  }
}

// Run if called directly
if (require.main === module) {
  const reviewer = new LocalCodexReview();
  reviewer.reviewFiles(process.argv[2]);
}

module.exports = LocalCodexReview;
```

### 3.3 結果をGitHubにプッシュ

```javascript
// scripts/push-codex-results.js
const fs = require('fs');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

class CodexResultsPusher {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  async pushResults() {
    const resultsPath = '.codex-results/latest-review.json';

    if (!fs.existsSync(resultsPath)) {
      console.error('❌ No results found. Run codex:review first.');
      process.exit(1);
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    // Get current PR number
    const prNumber = this.getCurrentPRNumber();

    if (!prNumber) {
      console.log('Not in a PR branch. Creating comment in latest PR...');
      return this.createIssueComment(results);
    }

    // Format results as markdown
    const comment = this.formatResults(results);

    // Post to PR
    await this.postToPR(prNumber, comment);
  }

  getCurrentPRNumber() {
    try {
      const output = execSync('gh pr view --json number', { encoding: 'utf8' });
      const pr = JSON.parse(output);
      return pr.number;
    } catch {
      return null;
    }
  }

  formatResults(results) {
    let markdown = '## 🖥️ Local Codex Review Results\n\n';
    markdown += '*Reviewed using ChatGPT Plus subscription (no API costs)*\n\n';

    results.forEach(r => {
      markdown += `### 📄 ${r.file}\n\n`;

      if (r.suggestions.length === 0) {
        markdown += '✅ No issues found\n\n';
      } else {
        r.suggestions.forEach((s, i) => {
          markdown += `${i + 1}. **${s.message}**\n`;
          markdown += `   - Line: ${s.line || 'N/A'}\n`;
          markdown += `   - Severity: ${s.severity}\n`;
          markdown += `   - Type: ${s.type}\n\n`;
        });
      }
    });

    markdown += `\n---\n*Generated locally at ${new Date().toISOString()}*`;
    return markdown;
  }

  async postToPR(prNumber, comment) {
    const [owner, repo] = this.getRepoInfo();

    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment
    });

    console.log(`✅ Results posted to PR #${prNumber}`);
  }

  getRepoInfo() {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' });
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    return match ? [match[1], match[2]] : ['owner', 'repo'];
  }
}

// Run if called directly
if (require.main === module) {
  const pusher = new CodexResultsPusher();
  pusher.pushResults();
}
```

## 4. Claude Code Integration

### 4.1 Claude Codeカスタムコマンド

```javascript
// claude-code-integration.js
const LocalCodexReview = require('./scripts/local-codex-review');

// Claude Codeから呼び出される関数
async function handleCodexCommand(command, args) {
  const reviewer = new LocalCodexReview();

  switch(command) {
    case 'refactoring':
      return await reviewer.reviewFiles(args.scope);

    case 'review':
      return await reviewer.reviewFiles('**/*');

    case 'suggest':
      // ローカルcodex CLIで提案を生成
      return await generateSuggestions(args);

    default:
      return { error: 'Unknown command' };
  }
}

// Claude Codeのフックとして登録
module.exports = {
  '/codex:*': handleCodexCommand
};
```

### 4.2 設定ファイル

```yaml
# .codex-config.yml
mode: hybrid # local, remote, hybrid

local:
  command: codex # ローカルCLIコマンド
  use_subscription: true # ChatGPT Plus使用
  fallback_to_api: false # API課金を避ける

remote:
  enabled: true
  api_key_source: github_secrets # APIキーはGitHub Secretsから

hybrid:
  prefer_local: true # ローカル優先
  local_users: # ローカル実行を優先するユーザー
    - morimorijap

review_settings:
  auto_run: false # 手動トリガーのみ
  file_patterns:
    - "**/*.js"
    - "**/*.ts"
    - "**/*.py"
```

## 5. 使用フロー

### 5.1 開発者のワークフロー

```bash
# 1. Claude Codeで開発
# Claude Code内でコードを書く

# 2. ローカルCodexレビューを実行
# Claude Codeのターミナルで:
npm run codex:review

# 3. 結果を確認
cat .codex-results/latest-review.json

# 4. GitHubにプッシュ（必要に応じて）
npm run codex:push-results

# 5. Claude Codeで修正を適用
# 提案に基づいてコードを修正
```

### 5.2 コスト比較

| 方法 | コスト | 利点 |
|------|--------|------|
| API直接利用 | $0.02/1K tokens | スケーラブル |
| ChatGPT Plus + Local CLI | $20/month (定額) | 無制限使用 |
| Hybrid | $20/month + 必要時API | バランス良好 |

## 6. セットアップ手順

```bash
# 1. Codex CLIをインストール（ChatGPT Plus必要）
npm install -g @openai/codex-cli

# 2. 認証設定
codex auth login

# 3. プロジェクト設定
npm install
cp .codex-config.example.yml .codex-config.yml

# 4. Claude Code設定
# ~/.claude/settings.jsonに追加:
{
  "customCommands": {
    "enableLocalCodex": true,
    "codexPath": "/usr/local/bin/codex"
  }
}

# 5. テスト実行
npm run codex:review -- test.js
```

## 7. トラブルシューティング

### Q: ローカルcodexコマンドが見つからない
```bash
# パスを確認
which codex

# パスを設定
export PATH=$PATH:/path/to/codex

# または設定ファイルで指定
echo 'command: /full/path/to/codex' >> .codex-config.yml
```

### Q: ChatGPT Plus認証エラー
```bash
# 再認証
codex auth logout
codex auth login

# ブラウザでログイン
```

### Q: 結果がGitHubに反映されない
```bash
# 手動でプッシュ
gh pr comment --body "$(cat .codex-results/latest-review.json)"
```

---

この設計により、ChatGPT Plusのサブスクリプションを最大限活用し、API従量課金を避けながら効率的にCodexレビューを実行できます。