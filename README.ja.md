# IIIF MCP Server v1.1.0

IIIF (International Image Interoperability Framework) 統合のための MCP (Model Context Protocol) サーバー。

## v1.1.0の新機能

- **iiif-image-fetch**: サイズ制約付きの実際のIIIF画像データ取得
- **iiif-manifest-canvases**: フィルタリングオプション付きマニフェスト内の全キャンバスリスト
- **iiif-canvas-info**: 特定のキャンバスの詳細情報取得
- **単一ファイルバンドル**: npm不要のesbuildによる配布オプション

## 実装状況

### コア機能
- [x] **検索**: IIIF リソース内検索のための Content Search API 統合
  - ✅ IIIF ドキュメント内の全文検索
  - ✅ Search API v0, v1, v2 をサポート
  - ✅ NC State University の IIIF コレクションでテスト済み
  - ✅ Claude Desktop へのデプロイ成功
- [x] **メタデータ取得**: Presentation API 経由でマニフェストとコレクションのメタデータを取得
  - ✅ IIIF Presentation API v2 と v3 フォーマットの両方をサポート
  - ✅ 柔軟なプロパティ選択
  - ✅ 多言語ラベルサポート
  - ✅ 複雑なメタデータ構造（HTML、ネストされたプロパティ）の処理
- [x] **画像操作**: Image API 経由で指定された領域、サイズ、回転で画像を取得
  - ✅ すべての IIIF Image API パラメータによる URL 構築
  - ✅ パラメータ検証（region、size、rotation、quality、format）
  - ✅ v2/v3 サポート付き画像情報取得
  - ✅ 包括的なエラーハンドリング

### 拡張機能

#### 画像データ操作 (v1.1.0)
- [x] **画像データ取得**: 実際の画像コンテンツをBase64として取得
  - ✅ 完全な IIIF Image API パラメータサポート
  - ✅ 自動サイズ制約（最大1500px、100万ピクセル）
  - ✅ パーセンテージ座標による領域抽出
- [x] **キャンバスナビゲーション**: 強化されたマニフェスト探索
  - ✅ フィルタリングオプション付き全キャンバスリスト
  - ✅ 詳細なキャンバス情報取得
  - ✅ 複数画像キャンバスのサポート

### 拡張機能（計画中）

#### コレクション管理
- [x] **コレクションリスト**: 利用可能なすべてのコレクションを取得
- [x] **コレクションコンテンツ**: コレクション内のマニフェストをリスト
- [x] **階層ナビゲーション**: ネストされたコレクション構造をナビゲート

#### アノテーション操作
- [x] **アノテーション検索**: コンテンツまたはタイプでアノテーションを検索
- [x] **テキスト抽出**: リソースからすべてのテキストアノテーションを取得
- [x] **多言語サポート**: 複数言語のアノテーションを処理

#### 構造ナビゲーション
- [ ] **範囲取得**: チャプター/セクション構造を取得
- [ ] **ページシーケンス**: ページ順序とシーケンスをナビゲート
- [ ] **目次生成**: 範囲構造から目次を作成

#### コンテンツ状態管理
- [ ] **ビュー保存**: Content State API を使用して特定のリソースビューを保存
- [ ] **ブックマーク**: ブックマークを作成・管理
- [ ] **引用リンク**: 共有可能な参照リンクを生成

#### 変更追跡
- [x] **更新監視**: Change Discovery API 経由でリソースの変更を追跡
- [x] **アクティビティストリームナビゲーション**: 変更アクティビティをナビゲート
- [x] **アクティビティ処理**: 変更情報を抽出してフォーマット

#### アクセス制御
- [x] **完全な認証サポート**: IIIF Authorization Flow API の完全実装
  - ✅ Cookie ベース認証フロー
  - ✅ トークンベース認証フロー
  - ✅ 外部認証検出
  - ✅ 自動期限処理付きセッション管理
  - ✅ アクセス検証用プローブサービス
  - ✅ 認証ヘッダー付き保護リソースアクセス
  - ✅ セッションクリーンアップ付きログアウト機能
  - ✅ Auth API v1 と v2 フォーマットの両方をサポート
  - ✅ テスト用 IIIF Auth Demonstrator との互換性

#### メディア処理
- [x] **AV コンテンツ**: オーディオ/ビデオリソースをサポート
- [x] **メディア情報**: 技術メタデータを抽出
- [x] **チャプターナビゲーション**: 時間ベースの範囲をサポート
- [ ] **3D モデル**: 3D コンテンツタイプを処理
- [ ] **PDF エクスポート**: IIIF リソースから PDF を生成

## インストール

### 標準インストール
```bash
npm install
npm run build
```

### 単一ファイルバンドル (v1.1.0+)
```bash
npm run bundle
# iiif-mcp-bundle.js を作成 - デプロイ時に npm install 不要
```

## 使用方法

### MCP サーバーとして

MCP クライアント設定に追加：

#### 標準インストール
```json
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["/path/to/mcp_iiif/dist/index.js"]
    }
  }
}
```

#### 単一ファイルバンドル (v1.1.0+)
```json
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["/path/to/iiif-mcp-bundle.js"]
    }
  }
}
```

## 利用可能なツール

このサーバーは以下の IIIF 仕様に基づいたツールを実装しています：
- IIIF Image API 3.0
- IIIF Presentation API 3.0
- IIIF Content Search API 2.0
- IIIF Change Discovery API 1.0
- IIIF Authorization Flow API 2.0
- IIIF Content State API 1.0

### ツールの詳細

各ツールの詳細な使用方法とパラメータについては、英語版 README を参照してください。

## 開発

```bash
npm run dev  # 開発モードで実行
npm test     # テストを実行
```

## 今後の拡張

計画中の改善とアーキテクチャの拡張については、[FUTURE_ENHANCEMENTS.md](./FUTURE_ENHANCEMENTS.md) を参照してください。

## ライセンス

MIT