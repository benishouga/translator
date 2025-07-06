interface BrowserAudioSettingsProps {
  readonly browserNoiseSuppression: boolean;
  readonly echoCancellation: boolean;
  readonly autoGainControl: boolean;
  readonly isTranslating: boolean;
  readonly onBrowserNoiseSuppressionChange: (enabled: boolean) => void;
  readonly onEchoCancellationChange: (enabled: boolean) => void;
  readonly onAutoGainControlChange: (enabled: boolean) => void;
}

export default function BrowserAudioSettings({
  browserNoiseSuppression,
  echoCancellation,
  autoGainControl,
  isTranslating,
  onBrowserNoiseSuppressionChange,
  onEchoCancellationChange,
  onAutoGainControlChange
}: BrowserAudioSettingsProps) {
  return (
    <div>
      <span className="block text-sm font-medium mb-2 text-gray-600">
        ブラウザ音声処理:
      </span>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={browserNoiseSuppression}
            onChange={(e) => onBrowserNoiseSuppressionChange(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">ブラウザのノイズ抑制</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={echoCancellation}
            onChange={(e) => onEchoCancellationChange(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">エコーキャンセレーション</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoGainControl}
            onChange={(e) => onAutoGainControlChange(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">自動音量調整</span>
        </label>
      </div>
      
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-xs text-gray-600 mb-1">
          💡 これらの設定は、マイクロフォン使用時のみ有効です。
        </p>
        <p className="text-xs text-gray-500">
          システム音声使用時は、元の音声がそのまま処理されます。
        </p>
      </div>
    </div>
  );
}
