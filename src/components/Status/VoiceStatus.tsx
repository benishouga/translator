interface VoiceStatusProps {
  readonly isListening: boolean;
  readonly isProcessing: boolean;
  readonly volume: number;
  readonly speechText: string;
  readonly audioInputMode: 'microphone' | 'system';
}

export default function VoiceStatus({
  isListening,
  isProcessing,
  volume,
  speechText,
  audioInputMode
}: VoiceStatusProps) {
  if (!isListening) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-blue-700">
          {audioInputMode === 'system' ? 'システム音声認識中' : '音声認識中'}
        </span>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
          <span className="text-sm text-blue-600 font-medium">
            音量: {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
      
      {audioInputMode === 'system' && (
        <div className="text-xs text-blue-600 mb-2">
          💡 選択したアプリ/タブの音声を認識中です
        </div>
      )}
      
      {speechText && (
        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
          {speechText}
        </div>
      )}
      
      {isProcessing && (
        <div className="text-sm text-blue-600 mt-3 font-medium">
          音声を処理中...
        </div>
      )}
    </div>
  );
}
