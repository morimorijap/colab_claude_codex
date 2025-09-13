# 📦 セットアップガイド

このガイドでは、Claude Code × OpenAI Codex協業システムの詳細なセットアップ手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [初期セットアップ](#初期セットアップ)
3. [GitHub設定](#github設定)
4. [API設定](#api設定)
5. [ローカル開発環境](#ローカル開発環境)
6. [動作確認](#動作確認)
7. [高度な設定](#高度な設定)

## 前提条件

### 必須要件

- **GitHub アカウント**: [GitHub](https://github.com)でアカウントを作成
- **Git**: バージョン2.0以上
- **Node.js**: バージョン18以上（ローカル開発用）
- **OpenAI APIアクセス**: [OpenAI Platform](https://platform.openai.com)でアカウント作成

### 推奨要件

- **GitHub CLI**: `gh`コマンドツール
- **VS Code**: 推奨エディタ
- **Docker**: コンテナ環境（オプション）

### 環境確認

```bash
# Gitバージョン確認
git --version
# 出力例: git version 2.39.0

# Node.jsバージョン確認
node --version
# 出力例: v18.17.0

# GitHub CLI確認（オプション）
gh --version
# 出力例: gh version 2.35.0
```

## 初期セットアップ

### 1. リポジトリの準備

#### オプション A: テンプレートとして使用（推奨）

```bash
# GitHub CLIを使用
gh repo create my-ai-project \
  --template morimorijap/colab_claude_codex \
  --public \
  --clone

cd my-ai-project
```

#### オプション B: フォークして使用

```bash
# GitHubでフォーク後
git clone git@github.com:YOUR_USERNAME/colab_claude_codex.git
cd colab_claude_codex

# アップストリームを設定
git remote add upstream git@github.com:morimorijap/colab_claude_codex.git
```

#### オプション C: 既存プロジェクトに追加

```bash
# 既存プロジェクトのディレクトリで
cd your-existing-project

# 必要なファイルをダウンロード
curl -L https://github.com/morimorijap/colab_claude_codex/archive/main.zip -o codex.zip
unzip codex.zip
cp -r colab_claude_codex-main/.github .
rm -rf colab_claude_codex-main codex.zip
```

### 2. 依存関係のインストール

```bash
# package.jsonを作成（新規プロジェクトの場合）
npm init -y

# GitHub Actions用の依存関係をインストール
npm install --save-dev @actions/core @actions/github

# 開発ツールをインストール（オプション）
npm install --save-dev eslint prettier jest
```

## GitHub設定

### 1. リポジトリ設定

#### Secrets設定

1. GitHubリポジトリページを開く
2. Settings → Secrets and variables → Actions
3. "New repository secret"をクリック
4. 以下のSecretsを追加:

```yaml
OPENAI_API_KEY: sk-xxxxxxxxxxxxxxxxxxxxxxxx
# 注: GITHUB_TOKENは自動的に提供されます
```

#### Permissions設定

1. Settings → Actions → General
2. "Workflow permissions"セクション
3. "Read and write permissions"を選択
4. "Allow GitHub Actions to create and approve pull requests"にチェック

### 2. Branch Protection Rules（オプション）

```bash
# GitHub CLIで設定
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["continuous-integration"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

### 3. Webhooks設定（高度な使用）

外部サービスと連携する場合:

1. Settings → Webhooks → Add webhook
2. Payload URL: `https://your-service.com/webhook`
3. Content type: `application/json`
4. Events: Pull requests, Pull request reviews, Issue comments

## API設定

### OpenAI API設定

#### 1. APIキーの取得

1. [OpenAI Platform](https://platform.openai.com)にログイン
2. API Keys → Create new secret key
3. キーをコピー（一度しか表示されません）

#### 2. 使用制限の設定（推奨）

```bash
# 月間使用上限を設定
curl https://api.openai.com/v1/usage_limits \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "soft_limit_usd": 50.0,
    "hard_limit_usd": 100.0
  }'
```

#### 3. ローカル環境変数設定

```bash
# .envファイルを作成
cat > .env << EOF
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
EOF

# .envを.gitignoreに追加
echo ".env" >> .gitignore
```

## ローカル開発環境

### 1. 開発サーバーのセットアップ

```bash
# 開発用スクリプトを作成
cat > scripts/dev-server.js << 'EOF'
const express = require('express');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());

// Webhookエンドポイント
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', req.body);

  // ローカルでActionsを実行
  if (req.body.action === 'opened' && req.body.pull_request) {
    console.log('PR opened, triggering local review...');
    // ローカルでレビュー処理を実行
  }

  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Dev server running on http://localhost:3000');
});
EOF

# 起動
node scripts/dev-server.js
```

### 2. ローカルActionsテスト

```bash
# actを使用してローカルでActionsをテスト
# インストール: brew install act (macOS)

# ワークフローをローカルで実行
act pull_request \
  -s OPENAI_API_KEY=$OPENAI_API_KEY \
  -s GITHUB_TOKEN=$GITHUB_TOKEN

# 特定のジョブを実行
act -j codex-analysis
```

### 3. モックCodex CLIセットアップ

```bash
# モックCLIを作成
cat > scripts/mock-codex-cli.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');

// モック分析結果
const mockAnalysis = {
  timestamp: new Date().toISOString(),
  review_type: 'comprehensive',
  suggestions: [
    {
      type: 'refactoring',
      severity: 'warning',
      file: 'src/example.js',
      line: 10,
      message: 'Consider extracting this logic to a separate function',
      confidence: 0.85
    }
  ]
};

// 結果を出力
fs.writeFileSync('analysis.json', JSON.stringify(mockAnalysis, null, 2));
console.log('Mock analysis complete');
EOF

chmod +x scripts/mock-codex-cli.js
```

## 動作確認

### 1. GitHub Actions確認

```bash
# ワークフローの状態確認
gh workflow list

# 実行履歴確認
gh run list

# 特定の実行ログ確認
gh run view <run-id> --log
```

### 2. テストPR作成

```bash
# テストブランチ作成
git checkout -b test/setup-verification

# テストファイル作成
echo "// Test file for Codex review" > test.js
echo "function longFunction() {" >> test.js
echo "  // This is a very long function that should trigger a suggestion" >> test.js
echo "  console.log('test');" >> test.js
echo "}" >> test.js

# コミット&プッシュ
git add test.js
git commit -m "test: Add test file for Codex review"
git push origin test/setup-verification

# PR作成
gh pr create \
  --title "Test: Setup Verification" \
  --body "Testing Codex integration" \
  --label "codex-review"
```

### 3. レビュートリガー

PRページでコメント:
```
/codex:review --depth quick
```

### 4. 結果確認

```bash
# PR状態確認
gh pr status

# コメント確認
gh pr view --comments
```

## 高度な設定

### カスタムレビュールール

`config/review-rules.yaml`を作成:

```yaml
rules:
  javascript:
    patterns:
      - name: "large-function"
        regex: "function\\s+\\w+\\s*\\([^)]*\\)\\s*{[^}]{200,}"
        message: "Function exceeds 200 characters"
        severity: "warning"

      - name: "console-log"
        regex: "console\\.(log|debug)"
        message: "Remove debug statements"
        severity: "error"

  python:
    patterns:
      - name: "missing-docstring"
        regex: "def\\s+\\w+\\([^)]*\\):\\s*[^\"']"
        message: "Function missing docstring"
        severity: "warning"
```

### 環境別設定

```bash
# 開発環境
cp .env.example .env.development
# ステージング環境
cp .env.example .env.staging
# 本番環境
cp .env.example .env.production

# 環境変数で切り替え
NODE_ENV=development node scripts/dev-server.js
```

### パフォーマンスチューニング

```yaml
# .github/workflows/codex-review.yml
env:
  MAX_DIFF_SIZE: 10000  # 最大差分サイズ
  ANALYSIS_TIMEOUT: 300  # タイムアウト（秒）
  MAX_SUGGESTIONS: 20   # 最大提案数
  CACHE_DURATION: 3600  # キャッシュ期間（秒）
```

## トラブルシューティング

### 一般的な問題と解決方法

#### 1. "OPENAI_API_KEY is not set"

```bash
# Secretが正しく設定されているか確認
gh secret list

# 再設定
gh secret set OPENAI_API_KEY
```

#### 2. "Permission denied" エラー

```bash
# リポジトリ権限確認
gh api repos/:owner/:repo

# Actions権限を再設定
gh api repos/:owner/:repo/actions/permissions \
  --method PUT \
  --field enabled=true \
  --field allowed_actions=all
```

#### 3. ワークフローが実行されない

```bash
# ワークフローの有効化
gh workflow enable "Codex AI Review"

# 手動実行でテスト
gh workflow run "Codex AI Review"
```

### ログとデバッグ

```bash
# 詳細ログを有効化
export ACTIONS_RUNNER_DEBUG=true
export ACTIONS_STEP_DEBUG=true

# ローカルでデバッグ実行
act -v pull_request
```

## 次のステップ

1. [API.md](API.md) - API仕様の詳細
2. [CONTRIBUTING.md](CONTRIBUTING.md) - プロジェクトへの貢献方法
3. [Examples](../examples/) - 使用例とベストプラクティス

## サポート

問題が解決しない場合:

1. [GitHub Issues](https://github.com/morimorijap/colab_claude_codex/issues)で報告
2. [GitHub Discussions](https://github.com/morimorijap/colab_claude_codex/discussions)で質問
3. [Discord Community](https://discord.gg/ai-collab)で相談（コミュニティ）

---

**Setup completed? Let's start collaborating with AI! 🚀**