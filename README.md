# 🤖 Claude Code × OpenAI Codex Collaboration System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-blue)](https://github.com/morimorijap/colab_claude_codex/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

AI同士が協調してコードレビューと改善提案を行う、GitHub統合型の開発支援システムです。Claude CodeとOpenAI Codex CLIが連携し、Pull Requestベースで高品質なコードレビューを実現します。

## 🌟 特徴

### 🎯 主要機能
- **AI協調レビュー**: Claude CodeとCodex CLIが異なる視点からコードを分析
- **自動PR管理**: GitHub Actionsによる完全自動化されたワークフロー
- **スラッシュコマンド**: `/codex:refactoring`などの直感的なコマンド
- **スマート提案**: リスクレベルと信頼度に基づく提案の自動適用
- **合意形成マージ**: 複数の承認条件による安全な自動マージ

### 🔧 技術スタック
- GitHub Actions (CI/CD)
- Node.js (Actions実装)
- OpenAI API (Codex分析)
- Claude Code (メイン開発)
- SuperClaude Framework (拡張機能)

## 📋 前提条件

- GitHub アカウント
- OpenAI API キー（Codex アクセス用）
- Node.js 18+ (ローカル開発用)
- Git 2.0+

## 🚀 クイックスタート

### 1. リポジトリのフォーク/クローン

```bash
# フォーク後にクローン
git clone git@github.com:YOUR_USERNAME/colab_claude_codex.git
cd colab_claude_codex

# またはテンプレートとして使用
gh repo create my-ai-collab --template morimorijap/colab_claude_codex
```

### 2. セットアップ方法を選択

#### 🖥️ オプションA: ローカルCodex CLI（推奨 - ChatGPT Plus利用者）

```bash
# 依存関係インストール
npm install

# Codex CLIの確認
npm run codex:check

# ローカル設定
cp .codex-config.yml .codex-config.local.yml
# .codex-config.local.ymlを編集してユーザー名を追加
```

**メリット**:
- ✅ API課金なし（ChatGPT Plus $20/月で使い放題）
- ✅ 高速なローカル実行
- ✅ オフライン作業可能

#### ☁️ オプションB: GitHub Actions（API利用）

リポジトリの Settings > Secrets and variables > Actions で以下を設定:

| Secret名 | 説明 | 取得方法 |
|---------|------|----------|
| `OPENAI_API_KEY` | OpenAI API キー | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `GITHUB_TOKEN` | GitHub トークン（自動生成） | 設定不要 |

### 3. ワークフローの有効化

```bash
# GitHub Actionsを有効化
gh workflow enable "Codex AI Review"
gh workflow enable "Hybrid Codex Review" # ローカル優先
gh workflow enable "Merge Consensus"
gh workflow enable "Cleanup Old Branches"
```

## 💡 使用方法

### 🖥️ ローカル実行（ChatGPT Plus利用）

1. **コード変更後、ローカルでレビュー実行**
```bash
# Claude Codeのターミナルで実行
npm run codex:local-review

# 結果を確認
cat .codex-results/latest-review.md
```

2. **結果をGitHub PRに投稿**
```bash
npm run codex:push-results
```

### ☁️ GitHub Actions経由の実行

PRコメントでコマンドを実行:
```
/codex:review --local  # ローカル実行を促す
/codex:review --remote # API経由で実行
```

### 基本的なワークフロー

1. **開発ブランチで作業**
```bash
git checkout -b feature/my-feature
# コードを編集
git add .
git commit -m "feat: 新機能の実装"
git push origin feature/my-feature
```

2. **Pull Requestを作成**
```bash
gh pr create --title "新機能の追加" --body "詳細説明"
```

3. **Codexレビューをトリガー**

PRコメントで以下のコマンドを使用:
```
/codex:refactoring --focus readability
```

### スラッシュコマンド一覧

| コマンド | 説明 | オプション |
|---------|------|-----------|
| `/codex:refactoring` | リファクタリング提案 | `--scope [file\|function\|module]`<br>`--focus [performance\|readability\|patterns]` |
| `/codex:review` | 包括的なコードレビュー | `--depth [quick\|thorough\|security]` |
| `/codex:suggest` | 特定問題の解決提案 | `--problem <description>`<br>`--constraints <list>` |
| `/codex:security` | セキュリティ重視のレビュー | - |

### 自動マージ条件

以下の条件を満たすとPRが自動マージされます:

- ✅ すべてのチェックがパス
- ✅ マージ競合なし
- ✅ 以下のいずれか:
  - 人間によるApprove
  - `codex-review/*`ブランチ + Codex承認

## 🏗️ アーキテクチャ

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│Claude Code  │────▶│ GitHub  │◀────│OpenAI Codex  │
│(開発)       │     │(調整)    │     │(レビュー)     │
└─────────────┘     └─────────┘     └──────────────┘
```

### ワークフロー詳細

1. **開発フェーズ**: Claude Codeがメイン開発を担当
2. **レビュー要求**: スラッシュコマンドでCodexレビューをトリガー
3. **分析実行**: GitHub ActionsがCodex CLIを呼び出し
4. **提案生成**: CodexがPRコメントとして改善提案を投稿
5. **選択適用**: 開発者が提案を選択し適用
6. **自動マージ**: 条件を満たしたら自動的にマージ

## 📁 プロジェクト構造

```
colab_claude_codex/
├── .github/
│   ├── workflows/           # GitHub Actionsワークフロー
│   │   ├── codex-review.yml    # Codexレビュー処理
│   │   ├── merge-consensus.yml # 自動マージ処理
│   │   └── cleanup.yml         # クリーンアップ処理
│   └── actions/             # カスタムActions
│       ├── post-codex-review/  # レビュー投稿
│       └── suggestion-processor/ # 提案処理
├── docs/                    # ドキュメント
│   ├── API.md                 # API仕様
│   ├── SETUP.md               # 詳細セットアップ
│   └── CONTRIBUTING.md        # 貢献ガイド
├── examples/                # 使用例
└── config/                  # 設定ファイル
```

## 🔧 カスタマイズ

### レビュールールのカスタマイズ

`.github/workflows/codex-review.yml`を編集:

```yaml
env:
  REVIEW_PATTERNS:
    refactoring:
      - pattern: '/function\s+\w+\s*\([^)]*\)\s*{[^}]{100,}/g'
        message: 'Large function detected'
```

### 新しいAIモデルの追加

`config/ai-models.yaml`に追加:

```yaml
models:
  your-model:
    provider: your-provider
    endpoint: https://api.your-provider.com
    capabilities: [review, suggest]
```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。

### 貢献方法

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📊 ロードマップ

- [x] 基本的なGitHub Actions統合
- [x] Codexレビュー機能
- [x] 自動マージシステム
- [ ] 複数AIモデルの同時利用
- [ ] 学習型レビューシステム
- [ ] VS Code拡張機能
- [ ] エンタープライズ機能

## 🐛 トラブルシューティング

### よくある問題

<details>
<summary>Codexレビューが動作しない</summary>

1. GitHub Secretsが正しく設定されているか確認
2. OpenAI APIキーが有効か確認
3. GitHub Actionsが有効になっているか確認

```bash
# デバッグ情報の確認
gh run list --workflow "Codex AI Review"
gh run view <run-id> --log
```
</details>

<details>
<summary>自動マージが実行されない</summary>

1. マージ条件を確認（PRコメントを参照）
2. ブランチ保護ルールを確認
3. 権限設定を確認

```bash
# マージ状態の確認
gh pr status
gh pr checks
```
</details>

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- [OpenAI](https://openai.com) - Codex API
- [Anthropic](https://anthropic.com) - Claude
- [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework)

## 📧 お問い合わせ

- Issues: [GitHub Issues](https://github.com/morimorijap/colab_claude_codex/issues)
- Discussions: [GitHub Discussions](https://github.com/morimorijap/colab_claude_codex/discussions)

---

**Made with ❤️ by the AI Collaboration Community**