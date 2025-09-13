# 📝 ドキュメント整合性修正リスト

## 概要

ドキュメント全体の整合性検証により発見された問題と修正方針です。

## 🔴 至急修正が必要な項目

### 1. 廃止されたAPIモデル参照の更新

**問題**: OpenAI Codexが廃止され、`code-davinci-002`は利用不可

**修正方針**:
- ChatGPT APIモデル（`gpt-4`、`gpt-3.5-turbo`）への移行
- ローカルChatGPT CLI利用を主軸に変更
- モック実装を実際のChatGPT統合に置き換え

**影響ファイル**:
- `config/ai-models.yaml`
- `.github/workflows/codex-review.yml`
- `DESIGN.md`

### 2. package.jsonスクリプトの修正

**問題**: READMEに記載のコマンドが動作しない

**修正内容**:
```json
{
  "scripts": {
    "codex:check": "node scripts/local-codex-review.js --check",
    "codex:review": "node scripts/local-codex-review.js"
  }
}
```

### 3. 設定ファイルテンプレートの作成

**問題**: `.codex-config.example.yml`が存在しない

**修正**: テンプレートファイルを作成し、READMEの手順を更新

## 🟡 中期的な修正項目

### 4. Node.jsバージョンの統一

**現状**:
- ドキュメント: Node.js 18+
- GitHub Actions: Node.js 20
- package.json: >=18.0.0

**修正方針**: Node.js 18を最小要件として統一

### 5. スラッシュコマンドの整理

**問題**: 文書化されているが未実装のコマンド

**対応方針**:
- 実装済み: `/codex:refactoring`, `/codex:review`, `/codex:suggest`
- 未実装（削除または実装）: `/codex:compare`, `/codex:security`, `/codex:apply`

### 6. 実際の統合実装

**現状**: モックとプレースホルダーが混在

**修正方針**:
- ChatGPT API統合の実装
- ローカルCLI実行の実装
- GitHub Actions統合の完成

## 🟢 軽微な修正項目

### 7. 用語の統一

- "Codex CLI" → "ChatGPT CLI"
- "OpenAI Codex" → "ChatGPT/GPT-4"
- 一貫した大文字小文字使用

### 8. 内部リンクの修正

- 存在しないCHANGELOG.mdへの参照を削除
- 相対パスを統一

### 9. サンプルコードの更新

- `console.log`を含むサンプルを修正
- 最新のベストプラクティスに準拠

## 実装の現実性評価

### ✅ 実装可能な機能

1. **ローカルChatGPT CLI統合**
   - ChatGPT Plusサブスクリプションでの利用
   - Webインターフェース経由の手動レビュー

2. **GitHub PR統合**
   - PRコメントとしてのレビュー投稿
   - ラベル管理と自動化

3. **ハイブリッドワークフロー**
   - ローカル/リモートの自動切り替え
   - ユーザー別の設定管理

### ⚠️ 制限事項

1. **OpenAI Codex廃止**
   - 代替: ChatGPT API（GPT-4/GPT-3.5）
   - コードレビュー特化機能の喪失

2. **API制限**
   - レート制限への対応必要
   - コスト管理の重要性

3. **自動適用の制限**
   - 提案の自動適用は慎重に実装
   - 人間のレビュー必須

## 推奨アクションプラン

### Week 1: 緊急修正
- [ ] package.jsonのスクリプト修正
- [ ] 設定ファイルテンプレート作成
- [ ] READMEの更新（実装済み機能のみ記載）

### Week 2-3: 中期修正
- [ ] モデル参照をGPT-4/GPT-3.5に更新
- [ ] Node.jsバージョン統一
- [ ] 未実装コマンドの削除または実装

### Month 1: 長期改善
- [ ] 実際のChatGPT API統合実装
- [ ] ドキュメント自動検証システム導入
- [ ] 継続的なドキュメント更新プロセス確立

## 結論

現在のドキュメントは「概念実証」レベルで、実装との乖離が大きい。優先順位：

1. **即座に動作する最小限の機能に焦点**
2. **ローカルChatGPT Plus利用を主軸に**
3. **段階的に高度な機能を追加**

この方針により、実用的で保守可能なシステムを構築できます。