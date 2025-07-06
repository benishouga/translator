import { useState, useRef, useEffect } from "react";
import { RealTimeTranslatorService } from "./services/RealTimeTranslatorService";
import type { ChatMessage } from "./types/ChatTypes";
import { useAudioDevices } from "./hooks/useAudioDevices";
import { useSystemAudio } from "./hooks/useSystemAudio";
import SettingsPanel from "./components/Settings/SettingsPanel";
import ControlPanel from "./components/Controls/ControlPanel";
import StatusDisplay from "./components/Status/StatusDisplay";
import ChatHistory from "./components/Chat/ChatHistory";

function App() {
  // 基本状態
  const [apiKey, setApiKey] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [speechText, setSpeechText] = useState("");
  const [error, setError] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<string>("");
  const [noiseFilterEnabled, setNoiseFilterEnabled] = useState<boolean>(true);
  const [audioInputMode, setAudioInputMode] = useState<'microphone' | 'system'>('microphone');
  
  // カスタムフック
  const { audioDevices, selectedDeviceId, setSelectedDeviceId, updateAudioDevices } = useAudioDevices();
  const { systemAudioStream, startSystemAudio, stopSystemAudio } = useSystemAudio();
  
  // サービス管理
  const translatorServiceRef = useRef<RealTimeTranslatorService | null>(null);

  // 翻訳サービスの初期化と更新
  useEffect(() => {
    if (!translatorServiceRef.current) {
      translatorServiceRef.current = new RealTimeTranslatorService(
        {
          apiKey: apiKey,
          sourceLanguage: sourceLanguage || undefined,
          enableAutoSpeak: true,
          voiceConfig: {
            silenceThreshold: 0.01,
            silenceDuration: 1000,
            sampleRate: 44100,
            deviceId: audioInputMode === 'microphone' ? (selectedDeviceId || undefined) : undefined,
            noiseFilterEnabled: noiseFilterEnabled,
            minSpeechVolume: 0.02,
            minSpeechDuration: 600,
            volumeStabilityThreshold: 0.01,
            customStream: audioInputMode === 'system' ? systemAudioStream || undefined : undefined
          },
          ttsConfig: {
            model: 'tts-1',
            voice: 'alloy'
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
          onAudioStart: () => {
            console.log("音声出力開始");
          },
          onAudioEnd: () => {
            console.log("音声出力終了");
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
    } else {
      translatorServiceRef.current.updateConfig({
        apiKey: apiKey,
        sourceLanguage: sourceLanguage || undefined,
        voiceConfig: {
          silenceThreshold: 0.01,
          silenceDuration: 1000,
          sampleRate: 44100,
          deviceId: audioInputMode === 'microphone' ? (selectedDeviceId || undefined) : undefined,
          noiseFilterEnabled: noiseFilterEnabled,
          minSpeechVolume: 0.02,
          minSpeechDuration: 600,
          volumeStabilityThreshold: 0.01,
          customStream: audioInputMode === 'system' ? systemAudioStream || undefined : undefined
        }
      });
    }

    return () => {
      if (translatorServiceRef.current) {
        translatorServiceRef.current.destroy();
      }
      if (systemAudioStream) {
        systemAudioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [apiKey, sourceLanguage, selectedDeviceId, noiseFilterEnabled, audioInputMode, systemAudioStream]);

  // イベントハンドラー
  const handleStartTranslation = async () => {
    if (!apiKey.trim()) {
      alert("APIキーを入力してください");
      return;
    }

    if (audioInputMode === 'system' && !systemAudioStream) {
      setError("システム音声が設定されていません。音声入力モードを「マイクロフォン」に変更するか、システム音声を選択してください。");
      return;
    }
    
    setIsTranslating(true);
    setError("");
    
    try {
      if (translatorServiceRef.current) {
        await translatorServiceRef.current.startListening();
        setIsListening(true);
        
        if (audioInputMode === 'microphone') {
          console.log("マイクからの翻訳を開始しました");
          await updateAudioDevices();
        } else {
          console.log("システム音声からの翻訳を開始しました");
        }
      }
    } catch (error) {
      console.error("音声入力のアクセスエラー:", error);
      const inputType = audioInputMode === 'system' ? 'システム音声' : 'マイク';
      setError(`${inputType}へのアクセスに失敗しました`);
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

  const handleTestTranslation = async (text: string) => {
    setError("");
    try {
      if (translatorServiceRef.current) {
        await translatorServiceRef.current.processTextDirectly(text);
      }
    } catch (error) {
      console.error("テスト翻訳エラー:", error);
      setError(error instanceof Error ? error.message : "テスト翻訳に失敗しました");
    }
  };

  const handleMicrophoneSelect = () => {
    stopSystemAudio();
    setAudioInputMode('microphone');
  };

  const handleSystemAudioStart = async () => {
    try {
      await startSystemAudio();
      setAudioInputMode('system');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      setAudioInputMode('microphone');
    }
  };

  const handleSystemAudioStop = () => {
    stopSystemAudio();
    setAudioInputMode('microphone');
    
    if (isTranslating) {
      handleStopTranslation();
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
  };

  const handleErrorDismiss = () => {
    setError("");
  };

  return (
    <div className="app min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Real-Time Translator
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 設定パネル */}
          <div className="lg:col-span-1 space-y-6">
            <SettingsPanel
              apiKey={apiKey}
              sourceLanguage={sourceLanguage}
              audioInputMode={audioInputMode}
              systemAudioStream={systemAudioStream}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              noiseFilterEnabled={noiseFilterEnabled}
              isTranslating={isTranslating}
              onApiKeyChange={setApiKey}
              onSourceLanguageChange={setSourceLanguage}
              onMicrophoneSelect={handleMicrophoneSelect}
              onSystemAudioStart={handleSystemAudioStart}
              onSystemAudioStop={handleSystemAudioStop}
              onDeviceChange={setSelectedDeviceId}
              onNoiseFilterToggle={setNoiseFilterEnabled}
            />
            
            <ControlPanel
              isTranslating={isTranslating}
              apiKey={apiKey}
              audioInputMode={audioInputMode}
              systemAudioStream={systemAudioStream}
              onStartTranslation={handleStartTranslation}
              onStopTranslation={handleStopTranslation}
              onTestTranslation={handleTestTranslation}
            />
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            <StatusDisplay
              isListening={isListening}
              isProcessing={isProcessing}
              volume={volume}
              speechText={speechText}
              audioInputMode={audioInputMode}
              error={error}
              onErrorDismiss={handleErrorDismiss}
            />
            
            <ChatHistory
              messages={chatHistory}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
