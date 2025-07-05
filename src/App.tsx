import { useState, useRef, useEffect } from "react";
import { VoiceRecognitionService } from "./services/VoiceRecognitionService";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [speechText, setSpeechText] = useState("");
  const [error, setError] = useState("");
  
  const voiceServiceRef = useRef<VoiceRecognitionService | null>(null);

  useEffect(() => {
    // VoiceRecognitionServiceを初期化
    voiceServiceRef.current = new VoiceRecognitionService(
      {
        silenceThreshold: 0.01,
        silenceDuration: 1500,
        sampleRate: 44100
      },
      {
        onSpeechStart: () => {
          console.log("音声検出開始");
          setSpeechText("音声を検出中...");
        },
        onSpeechEnd: (audioBlob) => {
          console.log("音声検出終了", audioBlob);
          setSpeechText("音声を処理中...");
          // 将来的にここで音声をテキストに変換する処理を実装予定
          // 今は仮の処理として、数秒後にテキストを表示
          setTimeout(() => {
            setSpeechText("音声からテキストへの変換が完了しました");
          }, 1000);
        },
        onError: (errorMessage) => {
          console.error("音声認識エラー:", errorMessage);
          setError(errorMessage);
          setIsListening(false);
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        }
      }
    );

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, []);

  const handleStartTranslation = async () => {
    if (!apiKey.trim()) {
      alert("APIキーを入力してください");
      return;
    }
    
    setIsTranslating(true);
    setError("");
    
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.startListening();
        setIsListening(true);
        console.log("翻訳を開始しました");
      }
    } catch (error) {
      console.error("マイクアクセスエラー:", error);
      setError("マイクへのアクセスに失敗しました");
      setIsTranslating(false);
    }
  };

  const handleStopTranslation = () => {
    setIsTranslating(false);
    setIsListening(false);
    setSpeechText("");
    setVolume(0);
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    
    console.log("翻訳を停止しました");
  };

  return (
    <div className="app p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Translator</h1>
      
      <div className="api-key-section mb-6">
        <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
          APIキー:
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="APIキーを入力してください"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="control-section">
        <div className="flex gap-4">
          <button
            onClick={handleStartTranslation}
            disabled={isTranslating || !apiKey.trim()}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              isTranslating || !apiKey.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isTranslating ? "翻訳中..." : "翻訳開始"}
          </button>
          
          <button
            onClick={handleStopTranslation}
            disabled={!isTranslating}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              !isTranslating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            停止
          </button>
        </div>
        
        {isTranslating && (
          <div className="mt-4 text-center text-sm text-gray-600">
            翻訳処理中です...
          </div>
        )}
        
        {/* 音声認識状態の表示 */}
        {isListening && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">音声認識中</span>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-blue-600">音量: {Math.round(volume * 100)}%</span>
              </div>
            </div>
            {speechText && (
              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                {speechText}
              </div>
            )}
          </div>
        )}
        
        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
