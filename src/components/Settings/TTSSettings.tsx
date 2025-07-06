interface TTSSettingsProps {
  readonly enableAutoSpeak: boolean;
  readonly isTranslating: boolean;
  readonly onEnableAutoSpeakChange: (enabled: boolean) => void;
}

export default function TTSSettings({
  enableAutoSpeak,
  isTranslating,
  onEnableAutoSpeakChange
}: TTSSettingsProps) {
  return (
    <div>
      <span className="block text-sm font-medium mb-2 text-gray-600">
        音声出力設定:
      </span>
      
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={enableAutoSpeak}
          onChange={(e) => onEnableAutoSpeakChange(e.target.checked)}
          className="text-blue-600 focus:ring-blue-500"
          disabled={isTranslating}
        />
        <span className="text-sm">翻訳結果を自動で音声出力</span>
      </label>
      
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-xs text-gray-600 mb-1">
          💡 この設定により、翻訳結果の音声読み上げを制御できます。
        </p>
        <p className="text-xs text-gray-500">
          OFF にすると、翻訳結果は画面表示のみになります。
        </p>
      </div>
    </div>
  );
}
