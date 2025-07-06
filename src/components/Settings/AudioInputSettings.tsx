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
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• 他のブラウザタブの音声を翻訳できます</li>
            <li>• YouTube、Netflix、会議アプリなどに対応</li>
            <li>• 音声付きのタブ/アプリを選択してください</li>
          </ul>
        </div>
      )}
    </div>
  );
}
