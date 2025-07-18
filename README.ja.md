# IIIF MCP サーバー

IIIF (International Image Interoperability Framework) 統合のための MCP (Model Context Protocol) サーバー。

## 実装状況

### コア機能
- [x] **検索**: IIIF リソース内検索のための Content Search API 統合
  - ✅ IIIF ドキュメント内の全文検索
  - ✅ Search API v0, v1, v2 をサポート
  - ✅ 構造化された検索結果
  - ✅ 検索結果のハイライト表示

- [x] **マニフェスト**: IIIF マニフェストのナビゲーションと検査
  - ✅ メタデータ抽出
  - ✅ キャンバス一覧
  - ✅ アノテーション取得
  - ✅ 構造情報（目次）

- [x] **画像**: IIIF Image API サポート
  - ✅ 画像情報の取得
  - ✅ 動的な画像操作URL生成
  - ✅ リージョン、サイズ、回転、品質、フォーマットのパラメータ
  - ✅ パラメータ検証

- [x] **コレクション**: IIIF コレクションのナビゲーション
  - ✅ コレクションの階層探索
  - ✅ マニフェストとサブコレクションの検出
  - ✅ メタデータ抽出

- [x] **アノテーション**: アノテーションデータへのアクセス
  - ✅ マニフェストからアノテーションURLを抽出
  - ✅ 言語別のテキストアノテーション取得
  - ✅ 構造化されたアノテーション情報

- [x] **認証**: IIIF Authentication API サポート
  - ✅ 認証情報の分析
  - ✅ Cookie/Token/External認証のサポート
  - ✅ ユーザー名・パスワードによる直接認証
  - ✅ 手動トークン認証
  - ✅ ログアウト機能
  - ✅ プローブサービス統合

### 認証について

#### ⚠️ CLI 認証の制限事項

コマンドライン環境の性質上、ブラウザベースの認証には固有の制限があります：

1. **Cookie の分離**: ブラウザの認証セッションはCLIプロセスと共有できません
   - ブラウザでログインすると、Cookie はブラウザのコンテキストに保存されます
   - CLI（Node.js）プロセスはこれらのブラウザ Cookie にアクセスできません
   - これは最新のブラウザとオペレーティングシステムのセキュリティ機能です

2. **IIIF 認証の設計**: IIIF Auth API はブラウザベースのビューアー向けに設計されています
   - 安全なトークン交換のために postMessage API と iframe に依存しています
   - これらのブラウザ API は Node.js CLI 環境では利用できません

#### CLI での推奨認証方法

1. **直接認証**（CLI での推奨方法）：
   ```json
   {
     "action": "authenticate",
     "resourceUrl": "https://example.org/protected-manifest.json",
     "username": "your-username",
     "password": "your-password"
   }
   ```

2. **手動トークン認証**：
   ```json
   {
     "action": "authenticate",
     "resourceUrl": "https://example.org/protected-manifest.json",
     "token": "your-access-token"
   }
   ```

3. **インタラクティブブラウザ認証**（限定的なサポート）：
   - ログインのためにブラウザを開きます
   - ⚠️ セッションを自動的にキャプチャすることはできません
   - ログイン後に表示されるトークンを提供するサービスにのみ適しています

#### IIIF Auth Demonstrator でのテスト
- ベースURL: `https://iiifauth.digtest.co.uk/`
- テスト認証情報: `username=username, password=password`
- 保護されたマニフェストの例: `https://iiifauth.digtest.co.uk/manifestcookie.json`

#### 完全な認証サポートのために
Cookie と postMessage を使用した完全な IIIF 認証フローを適切に処理できるブラウザベースの IIIF ビューアー（Mirador、Universal Viewer）の使用を検討してください。

### 🚧 iiif-range（近日公開）

IIIF リソース内の構造的範囲（章、セクション）のナビゲート。

## 開発

```bash
pnpm install   # 依存関係のインストール
pnpm run dev   # 開発モードで実行
pnpm test      # テストの実行
pnpm run build # ビルド
```

## 今後の機能拡張

計画中の改善点やアーキテクチャの機能拡張の詳細については、[FUTURE_ENHANCEMENTS.md](./FUTURE_ENHANCEMENTS.md) を参照してください。

主な検討領域：
- ローカルプロキシサーバーを介した完全なブラウザベース認証サポート
- CLI 環境向けの強化された Cookie 管理
- 追加の IIIF API 機能

## 貢献

新機能を実装する際は：
1. この README の実装状況を更新
2. 詳細なパラメータドキュメントを追加
3. 使用例を含める
4. 新機能のテストを作成
5. フォーマットされたテキストと構造化された JSON 出力の両方をサポート

## ライセンス

MIT