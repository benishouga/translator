import { useState, useRef, useEffect } from "react";
import { VoiceRecognitionService } from "./services/VoiceRecognitionService";
import { SpeechToTextService } from "./services/SpeechToTextService";
import type { ChatMessage } from "./types/ChatTypes";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [speechText, setSpeechText] = useState("");
  const [error, setError] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<string>("");
  
  const voiceServiceRef = useRef<VoiceRecognitionService | null>(null);
  const speechToTextServiceRef = useRef<SpeechToTextService | null>(null);

  useEffect(() => {
    // SpeechToTextServiceを初期化
    speechToTextServiceRef.current = new SpeechToTextService({
      apiKey: apiKey,
      model: "whisper-1",
      language: sourceLanguage || undefined // 空文字の場合はundefinedで自動検出
    });

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
          setIsProcessing(true);
          
          (async () => {
            try {
              if (speechToTextServiceRef.current) {
                // APIキーを更新
                speechToTextServiceRef.current.updateApiKey(apiKey);
                
                // 音声をテキストに変換
                const transcribedText = await speechToTextServiceRef.current.convertAudioToText(audioBlob);
                
                if (transcribedText.trim()) {
                  // チャット履歴に追加
                  const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    text: transcribedText,
                    timestamp: new Date(),
                    type: 'user'
                  };
                  
                  setChatHistory(prev => [...prev, newMessage]);
                  setSpeechText("");
                } else {
                  setSpeechText("音声が認識できませんでした");
                }
              }
            } catch (error) {
              console.error("音声変換エラー:", error);
              setError(error instanceof Error ? error.message : "音声変換に失敗しました");
              setSpeechText("");
            } finally {
              setIsProcessing(false);
            }
          })();
        },
        onError: (errorMessage) => {
          console.error("音声認識エラー:", errorMessage);
          setError(errorMessage);
          setIsListening(false);
          setIsProcessing(false);
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
  }, [apiKey, sourceLanguage]);

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

      <div className="language-section mb-6">
        <label htmlFor="sourceLanguage" className="block text-sm font-medium mb-2">
          元言語:
        </label>
        <select
          id="sourceLanguage"
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">未指定（自動検出）</option>
          <option value="ja">日本語</option>
          <option value="en">英語</option>
        </select>
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
            {isProcessing && (
              <div className="text-sm text-blue-600 mt-2">
                音声を処理中...
              </div>
            )}
          </div>
        )}
        
        {/* チャット履歴 */}
        {chatHistory.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">認識した音声:</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className="p-3 bg-gray-50 rounded-md border"
                >
                  <div className="text-sm text-gray-700">{message.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
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
