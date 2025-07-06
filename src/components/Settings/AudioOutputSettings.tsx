interface AudioOutputSettingsProps {
  readonly enableAutoSpeak: boolean;
  readonly isTranslating: boolean;
  readonly onAutoSpeakToggle: (enabled: boolean) => void;
}

export default function AudioOutputSettings({
  enableAutoSpeak,
  isTranslating,
  onAutoSpeakToggle
}: AudioOutputSettingsProps) {
  return (
    <div>
      <span className="block text-sm font-medium mb-2 text-gray-600">
        音声出力設定:
      </span>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enableAutoSpeak}
            onChange={(e) => onAutoSpeakToggle(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">翻訳結果を自動で音声出力</span>
        </label>
      </div>
      
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-xs text-gray-600 mb-1">
          💡 音声出力について
        </p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 有効: 翻訳結果が自動で音声出力されます</li>
          <li>• 無効: 翻訳結果はテキストのみで表示されます</li>
          <li>• 音声出力にはOpenAI TTS APIを使用します</li>
        </ul>
      </div>
    </div>
  );
}
