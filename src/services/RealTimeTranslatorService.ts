import { VoiceRecognitionService } from './VoiceRecognitionService';
import type { VoiceRecognitionConfig } from './VoiceRecognitionService';
import { SpeechToTextService } from './SpeechToTextService';
import type { SpeechToTextConfig } from './SpeechToTextService';
import { TranslationService } from './TranslationService';
import type { TranslationResult } from './TranslationService';
import { TextToSpeechService } from './TextToSpeechService';
import type { TextToSpeechConfig } from './TextToSpeechService';

export interface TranslatorConfig {
  apiKey: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  voiceConfig?: Partial<VoiceRecognitionConfig>;
  speechConfig?: Partial<SpeechToTextConfig>;
  ttsConfig?: Partial<TextToSpeechConfig>;
  enableAutoSpeak?: boolean; // 翻訳結果を自動で音声出力するかどうか
}

export interface TranslatorCallbacks {
  onSpeechStart?: () => void;
  onSpeechProcessing?: () => void;
  onSpeechRecognized?: (text: string) => void;
  onTranslationStart?: (originalText: string) => void;
  onTranslationComplete?: (result: TranslationResult) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: string) => void;
  onVolumeChange?: (volume: number) => void;
  onStatusChange?: (status: TranslatorStatus) => void;
}

export interface TranslatorStatus {
  isListening: boolean;
  isProcessing: boolean;
  isTranslating: boolean;
  isSpeaking: boolean;
  volume: number;
  currentText: string;
}

export class RealTimeTranslatorService {
  private readonly voiceService: VoiceRecognitionService;
  private readonly speechToTextService: SpeechToTextService;
  private readonly translationService: TranslationService;
  private readonly textToSpeechService: TextToSpeechService;
  private config: TranslatorConfig;
  private readonly callbacks: TranslatorCallbacks;
  private status: TranslatorStatus = {
    isListening: false,
    isProcessing: false,
    isTranslating: false,
    isSpeaking: false,
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

    // TranslationServiceを初期化
    this.translationService = new TranslationService({
      apiKey: config.apiKey,
      model: 'gpt-4.1'
    });

    // TextToSpeechServiceを初期化
    this.textToSpeechService = new TextToSpeechService({
      apiKey: config.apiKey,
      model: config.ttsConfig?.model ?? 'tts-1',
      voice: config.ttsConfig?.voice ?? 'alloy',
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
    this.textToSpeechService.stopCurrentAudio();
    this.updateStatus({ 
      isListening: false, 
      isProcessing: false, 
      isTranslating: false,
      isSpeaking: false,
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
        
        // 自動翻訳を実行
        await this.translateText(transcribedText);
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
  updateConfig(newConfig: Partial<TranslatorConfig>): void {
    // 設定を更新
    this.config = { ...this.config, ...newConfig };
    
    // APIキーの更新
    if (newConfig.apiKey) {
      this.speechToTextService.updateApiKey(newConfig.apiKey);
      this.translationService.updateApiKey(newConfig.apiKey);
      this.textToSpeechService.updateApiKey(newConfig.apiKey);
    }
    
    // 音声認識設定の更新
    if (newConfig.voiceConfig) {
      this.voiceService.updateConfig(newConfig.voiceConfig);
    }
    
    // TTS設定の更新
    if (newConfig.ttsConfig) {
      this.textToSpeechService.updateConfig(newConfig.ttsConfig);
    }
  }

  // 現在のステータスを取得
  getStatus(): TranslatorStatus {
    return { ...this.status };
  }

  // 翻訳機能
  private async translateText(text: string): Promise<void> {
    this.updateStatus({ isTranslating: true });
    this.callbacks.onTranslationStart?.(text);
    
    try {
      // TranslationServiceを使用して翻訳
      this.translationService.updateApiKey(this.config.apiKey);
      const result = await this.translationService.translateText(text);
      this.callbacks.onTranslationComplete?.(result);
      
      // 自動音声出力が有効な場合は翻訳結果を読み上げ（awaitなしでキューイング）
      if (this.config.enableAutoSpeak) {
        // awaitを使わずに非同期でキューに追加
        this.speakTextAsync(result.translatedText);
      }
      
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : '翻訳に失敗しました');
    } finally {
      this.updateStatus({ isTranslating: false });
    }
  }

  // 音声出力機能（非同期、キューイング対応）
  private speakTextAsync(text: string): void {
    // TextToSpeechServiceを使用して音声出力（awaitなしでキューに追加）
    this.textToSpeechService.updateApiKey(this.config.apiKey);
    this.textToSpeechService.speakText(text, {
      onAudioStart: () => {
        this.updateStatus({ isSpeaking: true });
        this.callbacks.onAudioStart?.();
      },
      onAudioEnd: () => {
        // 少し遅延を入れてキューの状態を確認
        setTimeout(() => {
          const queueStatus = this.textToSpeechService.getQueueStatus();
          const isStillPlaying = this.textToSpeechService.isCurrentlyPlaying();
          
          // キューが空で、処理中でもなく、再生中でもない場合のみ状態を更新
          if (queueStatus.queueLength === 0 && !queueStatus.isProcessing && !isStillPlaying) {
            this.updateStatus({ isSpeaking: false });
          }
        }, 50); // 短い遅延で確実にチェック
        
        this.callbacks.onAudioEnd?.();
      },
      onError: (error) => {
        this.handleError(error);
        this.updateStatus({ isSpeaking: false });
      }
    }).catch((error) => {
      this.handleError(error instanceof Error ? error.message : '音声出力に失敗しました');
      this.updateStatus({ isSpeaking: false });
    });
  }

  // 音声出力を停止
  stopSpeaking(): void {
    this.textToSpeechService.stopCurrentAudio();
    this.updateStatus({ isSpeaking: false });
  }

  // テキストを直接処理する（音声認識をスキップして翻訳・TTS処理を行う）
  async processTextDirectly(text: string): Promise<void> {
    if (!text.trim()) {
      throw new Error("処理するテキストが空です");
    }

    try {
      // 音声認識のコールバックを呼び出し
      this.callbacks.onSpeechRecognized?.(text);
      
      // 翻訳処理を実行
      await this.translateText(text);
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'テキスト処理に失敗しました');
    }
  }

  // リソースの解放
  destroy(): void {
    this.voiceService.stopListening();
    this.textToSpeechService.destroy();
  }
}
