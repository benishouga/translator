# コンポーネント分割リファクタリング

## 概要
App.tsx が複雑化していたため、責任の分離と再利用性の向上を目的として、コンポーネントを分割しました。

## 実装されたコンポーネント構造

### 1. Settings（設定関連）
- `ApiKeyInput.tsx` - APIキー入力フィールド
- `LanguageSelector.tsx` - 言語選択ドロップダウン
- `AudioInputSettings.tsx` - 音声入力モード選択（マイク/システム音声）
- `MicrophoneSettings.tsx` - マイク設定（デバイス選択、ノイズフィルター）
- `SettingsPanel.tsx` - 設定パネル統合コンポーネント

### 2. Controls（コントロール関連）
- `TranslationControls.tsx` - 翻訳開始/停止ボタン
- `TestPanel.tsx` - テスト機能パネル
- `ControlPanel.tsx` - コントロールパネル統合コンポーネント

### 3. Status（ステータス表示）
- `VoiceStatus.tsx` - 音声認識状態表示
- `ErrorDisplay.tsx` - エラー表示
- `StatusDisplay.tsx` - ステータス表示統合コンポーネント

### 4. Chat（チャット機能）
- `ChatMessage.tsx` - 個別チャットメッセージ
- `ChatHistory.tsx` - チャット履歴表示

### 5. Hooks（カスタムフック）
- `useAudioDevices.tsx` - オーディオデバイス管理
- `useSystemAudio.tsx` - システム音声管理

## 改善された点

### 1. 責任の分離
- 各コンポーネントが単一の責任を持つように設計
- 設定、コントロール、ステータス、チャットが明確に分離

### 2. 再利用性の向上
- 小さなコンポーネントに分割により再利用が容易
- propsインターフェースを明確に定義

### 3. 保守性の向上
- コンポーネントが小さく、理解しやすい
- 変更の影響範囲が明確
- テストが容易

### 4. TypeScript活用
- 全てのpropsを`readonly`として定義
- 型安全性を確保

### 5. カスタムフック
- 複雑なロジックを分離
- 状態管理が整理された

## ファイル構成
```
src/
├── components/
│   ├── Settings/
│   │   ├── ApiKeyInput.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── AudioInputSettings.tsx
│   │   ├── MicrophoneSettings.tsx
│   │   └── SettingsPanel.tsx
│   ├── Controls/
│   │   ├── TranslationControls.tsx
│   │   ├── TestPanel.tsx
│   │   └── ControlPanel.tsx
│   ├── Status/
│   │   ├── VoiceStatus.tsx
│   │   ├── ErrorDisplay.tsx
│   │   └── StatusDisplay.tsx
│   └── Chat/
│       ├── ChatMessage.tsx
│       └── ChatHistory.tsx
├── hooks/
│   ├── useAudioDevices.tsx
│   └── useSystemAudio.tsx
├── App.tsx (リファクタリング後)
└── App_original.tsx (元のファイル)
```

## 移行プロセス
1. 元のApp.tsxを`App_original.tsx`として保存
2. 新しいコンポーネントを段階的に作成
3. カスタムフックで状態管理を抽出
4. 統合テストを実施

## 今後の改善予定
- 共通UIコンポーネント（Button、LoadingSpinner等）の作成
- より詳細な状態管理フック（useTranslator等）の実装
- エラーハンドリングの統一化
- アクセシビリティの向上

## 機能への影響
- 既存の全機能は保持
- UIの動作は変更なし
- システム音声、マイク入力、ノイズフィルタリング等の全機能が正常に動作

このリファクタリングにより、コードの保守性、可読性、拡張性が大幅に向上しました。
