# 🤝 コントリビューションガイド

Claude Code × OpenAI Codex協業システムへの貢献を歓迎します！このガイドでは、プロジェクトへの貢献方法について説明します。

## 📋 目次

1. [行動規範](#行動規範)
2. [貢献の方法](#貢献の方法)
3. [開発環境のセットアップ](#開発環境のセットアップ)
4. [コーディング規約](#コーディング規約)
5. [Pull Requestプロセス](#pull-requestプロセス)
6. [Issue報告](#issue報告)
7. [コミットメッセージ規約](#コミットメッセージ規約)

## 行動規範

### 基本原則

- **敬意**: すべての参加者に対して敬意を持って接する
- **包括性**: 多様な背景を持つ人々を歓迎する
- **建設的**: 批判は建設的に、解決策を提案する
- **協力的**: 共同で問題を解決し、知識を共有する

### 禁止事項

- ハラスメント、差別的な言動
- 個人攻撃や侮辱的なコメント
- プライバシーの侵害
- その他、プロフェッショナルでない行為

## 貢献の方法

### 貢献のタイプ

#### 🐛 バグ報告
- 再現手順を明確に記載
- エラーメッセージやログを含める
- 環境情報（OS、Node.jsバージョンなど）を提供

#### ✨ 新機能の提案
- 機能の目的と利点を説明
- 実装方法の概要を提供
- 既存機能への影響を考慮

#### 📝 ドキュメント改善
- 誤字脱字の修正
- 説明の改善や追加
- 翻訳の提供

#### 🔧 コード改善
- パフォーマンス最適化
- リファクタリング
- テストの追加

## 開発環境のセットアップ

### 1. リポジトリのフォーク

```bash
# GitHubでフォーク後
git clone git@github.com:YOUR_USERNAME/colab_claude_codex.git
cd colab_claude_codex

# アップストリームを追加
git remote add upstream git@github.com:morimorijap/colab_claude_codex.git
```

### 2. ブランチの作成

```bash
# 最新のmainを取得
git checkout main
git pull upstream main

# 機能ブランチを作成
git checkout -b feature/your-feature-name
# または
git checkout -b fix/bug-description
```

### 3. 開発環境の準備

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# テストを実行
npm test

# リントチェック
npm run lint
```

## コーディング規約

### JavaScript/TypeScript

```javascript
// ✅ Good
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad
function calc(i) {
  let s = 0;
  for(let x of i) s += x.price;
  return s;
}
```

### 命名規則

```javascript
// Variables and functions: camelCase
const userProfile = {};
function getUserData() {}

// Classes: PascalCase
class UserController {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Files: kebab-case
// user-profile.js
// api-controller.js
```

### コメント規約

```javascript
/**
 * Calculate the total price of items
 * @param {Array<{price: number}>} items - Array of items with price
 * @returns {number} Total price
 */
function calculateTotal(items) {
  // Filter out items with invalid prices
  const validItems = items.filter(item => item.price > 0);

  // Calculate sum using reduce
  return validItems.reduce((sum, item) => sum + item.price, 0);
}
```

### GitHub Actions YAML

```yaml
# ジョブ名は明確に
name: Descriptive Workflow Name

# トリガーは具体的に
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'src/**'
      - 'tests/**'

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      # ステップ名は動作を説明
      - name: Checkout code
        uses: actions/checkout@v4

      # 環境変数は明示的に
      - name: Run tests
        env:
          NODE_ENV: test
        run: npm test
```

## Pull Requestプロセス

### 1. PR作成前のチェックリスト

- [ ] コードがビルドできる（`npm run build`）
- [ ] すべてのテストがパス（`npm test`）
- [ ] リントエラーなし（`npm run lint`）
- [ ] 必要なドキュメントを更新
- [ ] コミットメッセージが規約に従っている

### 2. PR作成

```bash
# 変更をコミット
git add .
git commit -m "feat: Add new feature"

# プッシュ
git push origin feature/your-feature-name

# PRを作成
gh pr create \
  --title "feat: Add amazing feature" \
  --body "## Description\n\nDetailed description\n\n## Changes\n- Change 1\n- Change 2"
```

### 3. PRテンプレート

```markdown
## 概要
<!-- 変更の概要を簡潔に説明 -->

## 変更内容
<!-- 主な変更点をリスト化 -->
-
-
-

## 種類
<!-- 該当するものにチェック -->
- [ ] 🐛 バグ修正
- [ ] ✨ 新機能
- [ ] 📝 ドキュメント
- [ ] ♻️ リファクタリング
- [ ] 🎨 UI/UX改善
- [ ] ⚡ パフォーマンス改善

## テスト
<!-- テスト方法を説明 -->

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] セルフレビューを実施した
- [ ] コメントを追加した（特に複雑な部分）
- [ ] ドキュメントを更新した
- [ ] 変更によって警告が発生しない
- [ ] テストを追加した
- [ ] すべてのテストがパスする
```

### 4. レビュープロセス

1. **自動レビュー**: Codex AIが自動的にコードをレビュー
2. **人間のレビュー**: メンテナーがレビュー
3. **修正**: フィードバックに基づいて修正
4. **承認**: レビュー承認後、自動マージ

## Issue報告

### Issueテンプレート

#### バグ報告

```markdown
## バグの説明
<!-- バグの明確で簡潔な説明 -->

## 再現手順
1. '...'に移動
2. '...'をクリック
3. '...'まスクロール
4. エラーを確認

## 期待される動作
<!-- 期待される動作の説明 -->

## スクリーンショット
<!-- 該当する場合、スクリーンショットを追加 -->

## 環境
- OS: [e.g. macOS 13.0]
- Node.js: [e.g. 18.17.0]
- ブラウザ: [e.g. Chrome 118]

## 追加情報
<!-- その他の関連情報 -->
```

#### 機能リクエスト

```markdown
## 機能の説明
<!-- 提案する機能の明確な説明 -->

## 動機
<!-- なぜこの機能が必要か -->

## 提案する解決策
<!-- どのように実装するか -->

## 代替案
<!-- 検討した他の方法 -->

## 追加情報
<!-- その他の情報や参考資料 -->
```

## コミットメッセージ規約

### Conventional Commits形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| `feat` | 新機能 | `feat: Add user authentication` |
| `fix` | バグ修正 | `fix: Resolve memory leak in parser` |
| `docs` | ドキュメント | `docs: Update API documentation` |
| `style` | フォーマット | `style: Format code with prettier` |
| `refactor` | リファクタリング | `refactor: Simplify error handling` |
| `perf` | パフォーマンス | `perf: Optimize database queries` |
| `test` | テスト | `test: Add unit tests for auth` |
| `chore` | 雑務 | `chore: Update dependencies` |
| `ci` | CI/CD | `ci: Add GitHub Actions workflow` |

### 例

```bash
# 新機能
git commit -m "feat(auth): Add OAuth2 authentication

Implement OAuth2 flow with Google and GitHub providers.
Includes token refresh mechanism and session management.

Closes #123"

# バグ修正
git commit -m "fix(api): Handle null response in error handler

The error handler was crashing when response was null.
Added null check and appropriate error message.

Fixes #456"

# Breaking Change
git commit -m "feat(api)!: Change API response format

BREAKING CHANGE: API responses now use camelCase instead of snake_case.
Migration guide available in docs/migration.md"
```

## リリースプロセス

### バージョニング

[Semantic Versioning](https://semver.org/)に従います:

- **MAJOR**: 互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### リリース手順

1. **リリースブランチ作成**
```bash
git checkout -b release/v1.2.0
```

2. **バージョン更新**
```bash
npm version minor
```

3. **CHANGELOG更新**
```bash
# CHANGELOG.mdを更新
```

4. **リリースPR作成**
```bash
gh pr create --title "Release v1.2.0" --label release
```

5. **タグ作成とリリース**
```bash
git tag v1.2.0
git push origin v1.2.0
gh release create v1.2.0 --generate-notes
```

## サポートとコミュニケーション

### 質問がある場合

1. **ドキュメント確認**: まずドキュメントを確認
2. **既存Issue検索**: 同様の問題がないか検索
3. **Discussions**: [GitHub Discussions](https://github.com/morimorijap/colab_claude_codex/discussions)で質問
4. **Issue作成**: 新しい問題の場合はIssueを作成

### コミュニティ

- **Discord**: [AI Collaboration Community](https://discord.gg/ai-collab)
- **Twitter**: [@ai_collab_dev](https://twitter.com/ai_collab_dev)
- **Blog**: [dev.to/ai-collaboration](https://dev.to/ai-collaboration)

## ライセンス

このプロジェクトに貢献することで、あなたの貢献がMITライセンスの下でライセンスされることに同意したものとみなされます。

---

**Thank you for contributing! 🎉**

あなたの貢献がこのプロジェクトをより良いものにします。