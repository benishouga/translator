import { useState, useRef, useEffect } from "react";
import { RealTimeTranslatorService } from "./services/RealTimeTranslatorService";
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
  
  const translatorServiceRef = useRef<RealTimeTranslatorService | null>(null);

  useEffect(() => {
    // RealTimeTranslatorServiceを初期化
    translatorServiceRef.current = new RealTimeTranslatorService(
      {
        apiKey: apiKey,
        sourceLanguage: sourceLanguage || undefined,
        voiceConfig: {
          silenceThreshold: 0.01,
          silenceDuration: 1500,
          sampleRate: 44100
        }
      },
      {
        onSpeechStart: () => {
          console.log("音声検出開始");
          setSpeechText("音声を検出中...");
        },
        onSpeechProcessing: () => {
          console.log("音声処理中");
          setSpeechText("音声を処理中...");
          setIsProcessing(true);
        },
        onSpeechRecognized: (text) => {
          console.log("音声認識完了:", text);
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            text: text,
            timestamp: new Date(),
            type: 'user'
          };
          setChatHistory(prev => [...prev, newMessage]);
          setSpeechText("");
          setIsProcessing(false);
        },
        onTranslationComplete: (result) => {
          console.log("翻訳完了:", result);
          const translationMessage: ChatMessage = {
            id: `trans-${Date.now()}`,
            text: result.translatedText,
            timestamp: new Date(),
            type: 'translation',
            originalText: result.originalText,
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage
          };
          setChatHistory(prev => [...prev, translationMessage]);
        },
        onError: (errorMessage) => {
          console.error("音声認識エラー:", errorMessage);
          setError(errorMessage);
          setIsListening(false);
          setIsProcessing(false);
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        },
        onStatusChange: (status) => {
          setIsListening(status.isListening);
          setIsProcessing(status.isProcessing);
          if (status.currentText) {
            setSpeechText(status.currentText);
          }
        }
      }
    );

    return () => {
      if (translatorServiceRef.current) {
        translatorServiceRef.current.destroy();
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
      if (translatorServiceRef.current) {
        await translatorServiceRef.current.startListening();
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
    
    if (translatorServiceRef.current) {
      translatorServiceRef.current.stopListening();
    }
    
    console.log("翻訳を停止しました");
  };

  return (
    <div className="app min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Real-Time Translator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 設定パネル */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">設定</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-2 text-gray-600">
                    APIキー:
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="APIキーを入力してください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="sourceLanguage" className="block text-sm font-medium mb-2 text-gray-600">
                    元言語:
                  </label>
                  <select
                    id="sourceLanguage"
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">未指定（自動検出）</option>
                    <option value="ja">日本語</option>
                    <option value="en">英語</option>
                  </select>
                </div>
              </div>
            </div>

            {/* コントロールパネル */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">コントロール</h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleStartTranslation}
                  disabled={isTranslating || !apiKey.trim()}
                  className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                    isTranslating || !apiKey.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg"
                  }`}
                >
                  {isTranslating ? "翻訳中..." : "翻訳開始"}
                </button>
                
                <button
                  onClick={handleStopTranslation}
                  disabled={!isTranslating}
                  className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                    !isTranslating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg"
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
            </div>

            {/* 音声認識状態 */}
            {isListening && (
              <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-blue-700">音声認識中</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm text-blue-600 font-medium">音量: {Math.round(volume * 100)}%</span>
                  </div>
                </div>
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
            )}

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 rounded-lg shadow-md p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-red-700 mb-2">エラー</h3>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}
          </div>

          {/* チャット履歴パネル */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">認識した音声</h2>
              
              {chatHistory.length > 0 ? (
                <div className="h-96 lg:h-[600px] overflow-y-auto space-y-3 pr-2">
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border transition-shadow ${
                        message.type === 'translation' 
                          ? 'bg-blue-50 border-blue-200 hover:shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      {message.type === 'translation' ? (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">元テキスト ({message.sourceLanguage === 'ja' ? '日本語' : '英語'}):</span>
                          </div>
                          <div className="text-gray-700 mb-3 p-2 bg-white rounded border">
                            {message.originalText}
                          </div>
                          <div className="text-sm text-blue-600 mb-2">
                            <span className="font-medium">翻訳結果 ({message.targetLanguage === 'ja' ? '日本語' : '英語'}):</span>
                          </div>
                          <div className="text-gray-800 font-medium leading-relaxed">
                            {message.text}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-800 leading-relaxed">{message.text}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          message.type === 'translation' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {message.type === 'translation' ? '翻訳' : '音声認識'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-96 lg:h-[600px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎤</div>
                    <p className="text-lg">音声認識を開始してください</p>
                    <p className="text-sm mt-2">認識された音声がここに表示されます</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
