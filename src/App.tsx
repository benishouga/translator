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
  
  // ブラウザ音声処理設定
  const [browserNoiseSuppression, setBrowserNoiseSuppression] = useState<boolean>(true);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [autoGainControl, setAutoGainControl] = useState<boolean>(true);
  
  // 音声出力設定
  const [enableAutoSpeak, setEnableAutoSpeak] = useState<boolean>(true);
  
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
          enableAutoSpeak: enableAutoSpeak,
          voiceConfig: {
            silenceThreshold: audioInputMode === 'system' ? 0.005 : 0.01,
            silenceDuration: audioInputMode === 'system' ? 2500 : 1000,
            sampleRate: 44100,
            deviceId: audioInputMode === 'microphone' ? (selectedDeviceId || undefined) : undefined,
            noiseFilterEnabled: noiseFilterEnabled,
            minSpeechVolume: audioInputMode === 'system' ? 0.008 : 0.02,
            minSpeechDuration: audioInputMode === 'system' ? 1000 : 600,
            volumeStabilityThreshold: 0.01,
            customStream: audioInputMode === 'system' ? systemAudioStream || undefined : undefined,
            browserNoiseSuppression: browserNoiseSuppression,
            echoCancellation: echoCancellation,
            autoGainControl: autoGainControl,
            // システム音声用の高度な設定
            maxRecordingDuration: audioInputMode === 'system' ? 12000 : undefined,
            speechPauseThreshold: audioInputMode === 'system' ? 0.006 : undefined,
            adaptiveSilenceDetection: audioInputMode === 'system',
            backgroundMusicDetection: audioInputMode === 'system'
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
        enableAutoSpeak: enableAutoSpeak,
        voiceConfig: {
          silenceThreshold: audioInputMode === 'system' ? 0.005 : 0.01,
          silenceDuration: audioInputMode === 'system' ? 2000 : 1000,
          sampleRate: 44100,
          deviceId: audioInputMode === 'microphone' ? (selectedDeviceId || undefined) : undefined,
          noiseFilterEnabled: noiseFilterEnabled,
          minSpeechVolume: audioInputMode === 'system' ? 0.01 : 0.02,
          minSpeechDuration: audioInputMode === 'system' ? 800 : 600,
          volumeStabilityThreshold: 0.01,
          customStream: audioInputMode === 'system' ? systemAudioStream || undefined : undefined,
          browserNoiseSuppression: browserNoiseSuppression,
          echoCancellation: echoCancellation,
          autoGainControl: autoGainControl,
          // システム音声用の高度な設定
          maxRecordingDuration: audioInputMode === 'system' ? 15000 : undefined,
          speechPauseThreshold: audioInputMode === 'system' ? 0.005 : undefined,
          adaptiveSilenceDetection: audioInputMode === 'system',
          backgroundMusicDetection: audioInputMode === 'system'
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
  }, [apiKey, sourceLanguage, selectedDeviceId, noiseFilterEnabled, audioInputMode, systemAudioStream, browserNoiseSuppression, echoCancellation, autoGainControl, enableAutoSpeak]);

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
    // マイクロフォンに切り替える際、システム音声関連のエラーをクリア
    setError("");
  };

  const handleSystemAudioStart = async () => {
    // 試行開始時にエラーメッセージをクリア
    setError("");
    
    try {
      await startSystemAudio();
      setAudioInputMode('system');
      // 成功時にエラーメッセージが残っていればクリア
      setError("");
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
              browserNoiseSuppression={browserNoiseSuppression}
              echoCancellation={echoCancellation}
              autoGainControl={autoGainControl}
              enableAutoSpeak={enableAutoSpeak}
              isTranslating={isTranslating}
              onApiKeyChange={setApiKey}
              onSourceLanguageChange={setSourceLanguage}
              onMicrophoneSelect={handleMicrophoneSelect}
              onSystemAudioStart={handleSystemAudioStart}
              onSystemAudioStop={handleSystemAudioStop}
              onDeviceChange={setSelectedDeviceId}
              onNoiseFilterToggle={setNoiseFilterEnabled}
              onBrowserNoiseSuppressionChange={setBrowserNoiseSuppression}
              onEchoCancellationChange={setEchoCancellation}
              onAutoGainControlChange={setAutoGainControl}
              onAutoSpeakToggle={setEnableAutoSpeak}
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
