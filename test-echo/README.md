# Test Echo MCP Server

最小限のMCPサーバー実装です。`echo`ツールのみを提供します。

## Claude Desktop設定

```json
{
  "mcpServers": {
    "test-echo": {
      "command": "node",
      "args": ["C:\\path\\to\\test-echo\\dist\\index.js"]
    }
  }
}
```

## ビルド

```bash
npm install
npm run build
```

## 動作確認

Claude Desktopで：
- "echo hello world" と入力してツールが呼び出されるか確認