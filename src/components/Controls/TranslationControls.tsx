interface TranslationControlsProps {
  readonly isTranslating: boolean;
  readonly apiKey: string;
  readonly audioInputMode: 'microphone' | 'system';
  readonly systemAudioStream: MediaStream | null;
  readonly onStartTranslation: () => void;
  readonly onStopTranslation: () => void;
}

export default function TranslationControls({
  isTranslating,
  apiKey,
  audioInputMode,
  systemAudioStream,
  onStartTranslation,
  onStopTranslation
}: TranslationControlsProps) {
  const canStart = apiKey.trim() && 
    (audioInputMode === 'microphone' || (audioInputMode === 'system' && systemAudioStream));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">翻訳コントロール</h2>
      
      <div className="flex space-x-4">
        {!isTranslating ? (
          <button
            onClick={onStartTranslation}
            disabled={!canStart}
            className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors ${
              canStart
                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            翻訳開始
          </button>
        ) : (
          <button
            onClick={onStopTranslation}
            className="flex-1 px-6 py-3 rounded-md font-medium bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-colors"
          >
            翻訳停止
          </button>
        )}
      </div>
      
      {!canStart && (
        <div className="mt-3 text-sm text-gray-500">
          {!apiKey.trim() && <p>• APIキーを入力してください</p>}
          {audioInputMode === 'system' && !systemAudioStream && (
            <p>• システム音声を設定してください</p>
          )}
        </div>
      )}
    </div>
  );
}
