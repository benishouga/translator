import TranslationControls from './TranslationControls';
import TestPanel from './TestPanel';

interface ControlPanelProps {
  readonly isTranslating: boolean;
  readonly apiKey: string;
  readonly audioInputMode: 'microphone' | 'system';
  readonly systemAudioStream: MediaStream | null;
  readonly onStartTranslation: () => void;
  readonly onStopTranslation: () => void;
  readonly onTestTranslation: (text: string) => void;
}

export default function ControlPanel({
  isTranslating,
  apiKey,
  audioInputMode,
  systemAudioStream,
  onStartTranslation,
  onStopTranslation,
  onTestTranslation
}: ControlPanelProps) {
  return (
    <div className="space-y-6">
      <TranslationControls
        isTranslating={isTranslating}
        apiKey={apiKey}
        audioInputMode={audioInputMode}
        systemAudioStream={systemAudioStream}
        onStartTranslation={onStartTranslation}
        onStopTranslation={onStopTranslation}
      />
      
      <TestPanel
        apiKey={apiKey}
        onTestTranslation={onTestTranslation}
      />
    </div>
  );
}
