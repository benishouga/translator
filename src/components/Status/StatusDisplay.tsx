import VoiceStatus from './VoiceStatus';
import ErrorDisplay from './ErrorDisplay';

interface StatusDisplayProps {
  readonly isListening: boolean;
  readonly isProcessing: boolean;
  readonly volume: number;
  readonly speechText: string;
  readonly audioInputMode: 'microphone' | 'system';
  readonly error: string;
  readonly onErrorDismiss: () => void;
}

export default function StatusDisplay({
  isListening,
  isProcessing,
  volume,
  speechText,
  audioInputMode,
  error,
  onErrorDismiss
}: StatusDisplayProps) {
  return (
    <div>
      <VoiceStatus
        isListening={isListening}
        isProcessing={isProcessing}
        volume={volume}
        speechText={speechText}
        audioInputMode={audioInputMode}
      />
      
      <ErrorDisplay
        error={error}
        onDismiss={onErrorDismiss}
      />
    </div>
  );
}
