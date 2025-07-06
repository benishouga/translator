import ApiKeyInput from './ApiKeyInput';
import LanguageSelector from './LanguageSelector';
import AudioInputSettings from './AudioInputSettings';
import MicrophoneSettings from './MicrophoneSettings';
import BrowserAudioSettings from './BrowserAudioSettings';
import AudioOutputSettings from './AudioOutputSettings';

interface SettingsPanelProps {
  readonly apiKey: string;
  readonly sourceLanguage: string;
  readonly audioInputMode: 'microphone' | 'system';
  readonly systemAudioStream: MediaStream | null;
  readonly audioDevices: MediaDeviceInfo[];
  readonly selectedDeviceId: string;
  readonly noiseFilterEnabled: boolean;
  readonly browserNoiseSuppression: boolean;
  readonly echoCancellation: boolean;
  readonly autoGainControl: boolean;
  readonly enableAutoSpeak: boolean;
  readonly isTranslating: boolean;
  readonly onApiKeyChange: (apiKey: string) => void;
  readonly onSourceLanguageChange: (language: string) => void;
  readonly onMicrophoneSelect: () => void;
  readonly onSystemAudioStart: () => void;
  readonly onSystemAudioStop: () => void;
  readonly onDeviceChange: (deviceId: string) => void;
  readonly onNoiseFilterToggle: (enabled: boolean) => void;
  readonly onBrowserNoiseSuppressionChange: (enabled: boolean) => void;
  readonly onEchoCancellationChange: (enabled: boolean) => void;
  readonly onAutoGainControlChange: (enabled: boolean) => void;
  readonly onAutoSpeakToggle: (enabled: boolean) => void;
}

export default function SettingsPanel({
  apiKey,
  sourceLanguage,
  audioInputMode,
  systemAudioStream,
  audioDevices,
  selectedDeviceId,
  noiseFilterEnabled,
  browserNoiseSuppression,
  echoCancellation,
  autoGainControl,
  enableAutoSpeak,
  isTranslating,
  onApiKeyChange,
  onSourceLanguageChange,
  onMicrophoneSelect,
  onSystemAudioStart,
  onSystemAudioStop,
  onDeviceChange,
  onNoiseFilterToggle,
  onBrowserNoiseSuppressionChange,
  onEchoCancellationChange,
  onAutoGainControlChange,
  onAutoSpeakToggle
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">設定</h2>
      
      <div className="space-y-4">
        <ApiKeyInput 
          apiKey={apiKey} 
          onChange={onApiKeyChange} 
          disabled={isTranslating}
        />
        
        <LanguageSelector 
          sourceLanguage={sourceLanguage} 
          onChange={onSourceLanguageChange} 
          disabled={isTranslating}
        />
        
        <AudioInputSettings
          audioInputMode={audioInputMode}
          systemAudioStream={systemAudioStream}
          isTranslating={isTranslating}
          onMicrophoneSelect={onMicrophoneSelect}
          onSystemAudioStart={onSystemAudioStart}
          onSystemAudioStop={onSystemAudioStop}
        />
        
        <div style={{ display: audioInputMode === 'microphone' ? 'block' : 'none' }}>
          <MicrophoneSettings
            audioDevices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            noiseFilterEnabled={noiseFilterEnabled}
            isTranslating={isTranslating}
            onDeviceChange={onDeviceChange}
            onNoiseFilterToggle={onNoiseFilterToggle}
          />
          
          <div className="mt-4">
            <BrowserAudioSettings
              browserNoiseSuppression={browserNoiseSuppression}
              echoCancellation={echoCancellation}
              autoGainControl={autoGainControl}
              isTranslating={isTranslating}
              onBrowserNoiseSuppressionChange={onBrowserNoiseSuppressionChange}
              onEchoCancellationChange={onEchoCancellationChange}
              onAutoGainControlChange={onAutoGainControlChange}
            />
          </div>
        </div>
        
        <AudioOutputSettings
          enableAutoSpeak={enableAutoSpeak}
          isTranslating={isTranslating}
          onAutoSpeakToggle={onAutoSpeakToggle}
        />
      </div>
    </div>
  );
}
