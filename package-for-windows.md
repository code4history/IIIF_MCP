# Windows用インストール手順

## 1. 必要なファイルの準備

このディレクトリから以下のファイル/フォルダをコピーしてください：
- `dist/` フォルダ（ビルド済みのJSファイル）
- `package.json`
- `node_modules/` フォルダ（依存関係）

または、以下のコマンドでアーカイブを作成：
```bash
npm run build
tar -czf mcp-iiif-windows.tar.gz dist package.json node_modules
```

## 2. Windowsでの配置

1. 適当な場所にフォルダを作成（例：`C:\Users\[YourName]\mcp-servers\iiif\`）
2. 上記のファイルをそのフォルダに配置

## 3. Claude Desktop設定

Claude Desktopの設定ファイルを編集します：

**設定ファイルの場所：**
`%APPDATA%\Claude\claude_desktop_config.json`

**設定内容：**
```json
{
  "mcpServers": {
    "iiif": {
      "command": "node",
      "args": ["C:\\Users\\[YourName]\\mcp-servers\\iiif\\dist\\index.js"]
    }
  }
}
```

注意：パスの`\`は`\\`にエスケープする必要があります。

## 4. 動作確認

1. Claude Desktopを再起動
2. チャット画面で以下のように使用：

```
IIIFで「manuscript」を検索してください。
検索サービスURL: https://iiif.lib.harvard.edu/manifests/drs:48309543/svc/searchwithin
```

## トラブルシューティング

### Node.jsがインストールされていない場合
1. https://nodejs.org/ からNode.jsをダウンロード・インストール
2. コマンドプロンプトで `node --version` を実行して確認

### 依存関係の再インストールが必要な場合
```cmd
cd C:\Users\[YourName]\mcp-servers\iiif
npm install --production
```

### ログの確認
Claude Desktopのログで、MCPサーバーが正常に起動しているか確認できます。