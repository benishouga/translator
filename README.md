# Real-Time Translator

音声認識とリアルタイム翻訳を行うWebアプリケーションです。マイクから音声を取得し、OpenAI APIを使用してテキストに変換し、日本語⇔英語の翻訳を行います。

🌐 **デモサイト**: [https://benishouga.github.io/translator/](https://benishouga.github.io/translator/)

## 機能

### 🎤 音声認識
- リアルタイム音声認識（OpenAI Whisper API）
- 自動言語検出または日本語・英語の指定
- 音量レベルの可視化
- 無音検出による自動区切り

### 🌍 翻訳機能
- 日本語 → 英語の翻訳
- 英語 → 日本語の翻訳
- 自動言語判定による双方向翻訳
- 高精度翻訳（OpenAI GPT-4.1）

### 🔊 音声出力
- 翻訳結果の自動音声読み上げ（OpenAI TTS）
- ストリーミング音声出力
- 自然な音声合成

### 💬 チャット履歴
- 認識した音声と翻訳結果を履歴表示
- タイムスタンプ付き
- 自動スクロール

## 技術スタック

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS
- **音声認識**: OpenAI Whisper API
- **翻訳**: OpenAI GPT-4.1
- **音声合成**: OpenAI TTS API
- **リンター**: ESLint + TypeScript ESLint

## セットアップ

### 必要な環境
- Node.js 18以上
- OpenAI API キー

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/benishouga/translator.git
cd translator

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションにアクセス。

## 使用方法

1. **APIキーの入力**: OpenAI APIキーを入力フィールドに設定
2. **言語選択**: 元言語を選択（未指定・日本語・英語）
3. **翻訳開始**: 「翻訳開始」ボタンをクリック
4. **音声入力**: マイクに向かって話す
5. **結果確認**: 音声認識結果と翻訳結果がチャット履歴に表示

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
```

### GitHub Pagesにデプロイ

```bash
npm run deploy
```

## プロジェクト構成

```
src/
├── App.tsx                 # メインアプリケーション
├── main.tsx               # エントリーポイント
├── index.css              # スタイル
├── services/              # サービス層
│   ├── RealTimeTranslatorService.ts    # 統合翻訳サービス
│   ├── VoiceRecognitionService.ts      # 音声認識サービス
│   ├── SpeechToTextService.ts          # 音声→テキスト変換
│   ├── TranslationService.ts           # 翻訳サービス
│   └── TextToSpeechService.ts          # テキスト→音声変換
└── types/
    └── ChatTypes.ts       # 型定義
```

## API使用量について

このアプリケーションは以下のOpenAI APIを使用します：

- **Whisper API**: 音声認識（$0.006/分）
- **GPT-4.1**: 翻訳処理
- **TTS API**: 音声合成（$15.00/1M文字）

使用量に応じて課金されるため、APIキーの管理にご注意ください。

## ブラウザサポート

- Chrome 88+
- Firefox 84+
- Safari 14+
- Edge 88+

**注意**: マイクアクセスにはHTTPS環境が必要です。

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## トラブルシューティング

### マイクアクセスエラー
- ブラウザでマイクアクセス許可を確認
- HTTPS環境でアクセスしているか確認

### API エラー
- OpenAI APIキーが正しく設定されているか確認
- APIクォータが残っているか確認

### 音声が認識されない
- マイクが正常に動作しているか確認
- 音量レベルが適切か確認（画面上の音量表示を参照）
