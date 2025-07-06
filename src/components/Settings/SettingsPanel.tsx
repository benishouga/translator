import ApiKeyInput from './ApiKeyInput';
import LanguageSelector from './LanguageSelector';
import AudioInputSettings from './AudioInputSettings';
import MicrophoneSettings from './MicrophoneSettings';

interface SettingsPanelProps {
  readonly apiKey: string;
  readonly sourceLanguage: string;
  readonly audioInputMode: 'microphone' | 'system';
  readonly systemAudioStream: MediaStream | null;
  readonly audioDevices: MediaDeviceInfo[];
  readonly selectedDeviceId: string;
  readonly noiseFilterEnabled: boolean;
  readonly isTranslating: boolean;
  readonly onApiKeyChange: (apiKey: string) => void;
  readonly onSourceLanguageChange: (language: string) => void;
  readonly onMicrophoneSelect: () => void;
  readonly onSystemAudioStart: () => void;
  readonly onSystemAudioStop: () => void;
  readonly onDeviceChange: (deviceId: string) => void;
  readonly onNoiseFilterToggle: (enabled: boolean) => void;
}

export default function SettingsPanel({
  apiKey,
  sourceLanguage,
  audioInputMode,
  systemAudioStream,
  audioDevices,
  selectedDeviceId,
  noiseFilterEnabled,
  isTranslating,
  onApiKeyChange,
  onSourceLanguageChange,
  onMicrophoneSelect,
  onSystemAudioStart,
  onSystemAudioStop,
  onDeviceChange,
  onNoiseFilterToggle
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
        </div>
      </div>
    </div>
  );
}
