interface AudioInputSettingsProps {
  readonly audioInputMode: 'microphone' | 'system';
  readonly systemAudioStream: MediaStream | null;
  readonly isTranslating: boolean;
  readonly onMicrophoneSelect: () => void;
  readonly onSystemAudioStart: () => void;
  readonly onSystemAudioStop: () => void;
}

export default function AudioInputSettings({ 
  audioInputMode, 
  systemAudioStream, 
  isTranslating, 
  onMicrophoneSelect, 
  onSystemAudioStart, 
  onSystemAudioStop 
}: AudioInputSettingsProps) {
  return (
    <div>
      <span className="block text-sm font-medium mb-2 text-gray-600">
        音声入力モード:
      </span>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="audioInputMode"
            value="microphone"
            checked={audioInputMode === 'microphone'}
            onChange={(e) => {
              if (e.target.checked) {
                onMicrophoneSelect();
              }
            }}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">マイクロフォン</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="audioInputMode"
            value="system"
            checked={audioInputMode === 'system'}
            onChange={(e) => {
              if (e.target.checked) {
                onSystemAudioStart();
              }
            }}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm">システム音声（他のアプリ/ブラウザタブ）</span>
        </label>
      </div>
      
      {audioInputMode === 'system' && systemAudioStream && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-700 mb-2">
            ✓ システム音声が接続されています
          </p>
          <p className="text-xs text-green-600 mb-2">
            選択したアプリ/タブの音声がリアルタイムで翻訳されます
          </p>
          <div className="text-xs text-green-600 mb-2">
            <p className="font-semibold">🎵 動画・音楽コンテンツでの最適化:</p>
            <ul className="mt-1 space-y-1 text-green-500">
              <li>• BGMや効果音を考慮した適応的音声検出</li>
              <li>• 最大15秒で自動区切り（長すぎる録音を防止）</li>
              <li>• 会話の自然な区切りを検出</li>
            </ul>
          </div>
          <button
            onClick={onSystemAudioStop}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            disabled={isTranslating}
          >
            システム音声を停止
          </button>
        </div>
      )}
      
      {audioInputMode === 'system' && !systemAudioStream && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700 mb-2">
            💡 システム音声を選択すると、画面共有ダイアログが表示されます。
          </p>
          <ul className="text-xs text-blue-600 space-y-1 mb-3">
            <li>• 他のブラウザタブの音声を翻訳できます</li>
            <li>• YouTube、Netflix、会議アプリなどに対応</li>
            <li>• 音声付きのタブ/アプリを選択してください</li>
            <li>• BGMや効果音がある動画でも適切に音声を区切ります</li>
          </ul>
          <button
            onClick={onSystemAudioStart}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            disabled={isTranslating}
          >
            再度システム音声を設定
          </button>
        </div>
      )}
    </div>
  );
}
