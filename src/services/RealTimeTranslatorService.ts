import { VoiceRecognitionService } from './VoiceRecognitionService';
import type { VoiceRecognitionConfig } from './VoiceRecognitionService';
import { SpeechToTextService } from './SpeechToTextService';
import type { SpeechToTextConfig } from './SpeechToTextService';

export interface TranslatorConfig {
  apiKey: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  voiceConfig?: Partial<VoiceRecognitionConfig>;
  speechConfig?: Partial<SpeechToTextConfig>;
}

export interface TranslatorCallbacks {
  onSpeechStart?: () => void;
  onSpeechProcessing?: () => void;
  onSpeechRecognized?: (text: string) => void;
  onTranslationStart?: (originalText: string) => void;
  onTranslationComplete?: (originalText: string, translatedText: string) => void;
  onError?: (error: string) => void;
  onVolumeChange?: (volume: number) => void;
  onStatusChange?: (status: TranslatorStatus) => void;
}

export interface TranslatorStatus {
  isListening: boolean;
  isProcessing: boolean;
  isTranslating: boolean;
  volume: number;
  currentText: string;
}

export class RealTimeTranslatorService {
  private readonly voiceService: VoiceRecognitionService;
  private readonly speechToTextService: SpeechToTextService;
  private config: TranslatorConfig;
  private readonly callbacks: TranslatorCallbacks;
  private status: TranslatorStatus = {
    isListening: false,
    isProcessing: false,
    isTranslating: false,
    volume: 0,
    currentText: ''
  };

  constructor(config: TranslatorConfig, callbacks: TranslatorCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // SpeechToTextServiceを初期化
    this.speechToTextService = new SpeechToTextService({
      apiKey: config.apiKey,
      model: config.speechConfig?.model ?? 'whisper-1',
      language: config.sourceLanguage
    });

    // VoiceRecognitionServiceを初期化
    this.voiceService = new VoiceRecognitionService(
      {
        silenceThreshold: 0.01,
        silenceDuration: 1500,
        sampleRate: 44100,
        ...config.voiceConfig
      },
      {
        onSpeechStart: () => this.handleSpeechStart(),
        onSpeechEnd: (audioBlob) => this.handleSpeechEnd(audioBlob),
        onError: (error) => this.handleError(error),
        onVolumeChange: (volume) => this.handleVolumeChange(volume)
      }
    );
  }

  async startListening(): Promise<void> {
    try {
      await this.voiceService.startListening();
      this.updateStatus({ isListening: true });
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'マイクへのアクセスに失敗しました');
      throw error;
    }
  }

  stopListening(): void {
    this.voiceService.stopListening();
    this.updateStatus({ 
      isListening: false, 
      isProcessing: false, 
      isTranslating: false,
      volume: 0,
      currentText: ''
    });
  }

  private handleSpeechStart(): void {
    this.updateStatus({ currentText: '音声を検出中...' });
    this.callbacks.onSpeechStart?.();
  }

  private handleSpeechEnd(audioBlob: Blob): void {
    this.updateStatus({ 
      isProcessing: true, 
      currentText: '音声を処理中...' 
    });
    this.callbacks.onSpeechProcessing?.();
    
    this.processAudioToText(audioBlob);
  }

  private async processAudioToText(audioBlob: Blob): Promise<void> {
    try {
      // APIキーを更新
      this.speechToTextService.updateApiKey(this.config.apiKey);
      
      // 音声をテキストに変換
      const transcribedText = await this.speechToTextService.convertAudioToText(audioBlob);
      
      if (transcribedText.trim()) {
        this.updateStatus({ currentText: '' });
        this.callbacks.onSpeechRecognized?.(transcribedText);
        
        // 将来的に翻訳機能を追加予定
        if (this.config.targetLanguage) {
          await this.translateText(transcribedText);
        }
      } else {
        this.updateStatus({ currentText: '音声が認識できませんでした' });
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : '音声変換に失敗しました');
    } finally {
      this.updateStatus({ isProcessing: false });
    }
  }

  private handleVolumeChange(volume: number): void {
    this.updateStatus({ volume });
    this.callbacks.onVolumeChange?.(volume);
  }

  private handleError(error: string): void {
    this.updateStatus({ 
      isListening: false, 
      isProcessing: false, 
      isTranslating: false,
      currentText: ''
    });
    this.callbacks.onError?.(error);
  }

  private updateStatus(updates: Partial<TranslatorStatus>): void {
    this.status = { ...this.status, ...updates };
    this.callbacks.onStatusChange?.(this.status);
  }

  // 設定を更新
  updateConfig(config: Partial<TranslatorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // APIキーの更新
    if (config.apiKey) {
      this.speechToTextService.updateApiKey(config.apiKey);
    }
    
    // 言語の更新
    if (config.sourceLanguage !== undefined) {
      this.speechToTextService.updateLanguage(config.sourceLanguage);
    }
    
    // 音声認識設定の更新
    if (config.voiceConfig) {
      this.voiceService.updateConfig(config.voiceConfig);
    }
  }

  // 現在のステータスを取得
  getStatus(): TranslatorStatus {
    return { ...this.status };
  }

  // 翻訳機能（将来的に実装予定）
  private async translateText(text: string): Promise<void> {
    this.updateStatus({ isTranslating: true });
    this.callbacks.onTranslationStart?.(text);
    
    try {
      // 現在は翻訳機能未実装のため、元のテキストをそのまま返す
      // 将来的にOpenAI APIやGoogle Translate APIなどを使用して翻訳を実装
      const translatedText = text; // プレースホルダー
      this.callbacks.onTranslationComplete?.(text, translatedText);
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : '翻訳に失敗しました');
    } finally {
      this.updateStatus({ isTranslating: false });
    }
  }

  // リソースの解放
  destroy(): void {
    this.voiceService.stopListening();
  }
}
