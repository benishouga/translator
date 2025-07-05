export interface VoiceRecognitionConfig {
  silenceThreshold: number; // 無音と判定する音量のしきい値 (0-1)
  silenceDuration: number; // 無音継続時間 (ミリ秒)
  sampleRate: number; // サンプリングレート
}

export interface VoiceRecognitionCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  onVolumeChange?: (volume: number) => void;
}

export class VoiceRecognitionService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isRecording = false;
  private isSpeaking = false;
  private silenceTimer: number | null = null;
  private recordedChunks: Blob[] = [];
  
  private config: VoiceRecognitionConfig = {
    silenceThreshold: 0.01, // 1%の音量以下を無音とする
    silenceDuration: 1500, // 1.5秒の無音で区切り
    sampleRate: 44100
  };
  
  private readonly callbacks: VoiceRecognitionCallbacks = {};

  constructor(config?: Partial<VoiceRecognitionConfig>, callbacks?: VoiceRecognitionCallbacks) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (callbacks) {
      Object.assign(this.callbacks, callbacks);
    }
  }

  async startListening(): Promise<void> {
    try {
      // マイクへのアクセス許可を取得
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // AudioContextを初期化
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // マイクからの音声をAnalyserに接続
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // MediaRecorderを初期化
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length > 0) {
          const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          this.callbacks.onSpeechEnd?.(audioBlob);
          this.recordedChunks = [];
        }
      };

      this.isRecording = true;
      this.startVolumeMonitoring();
      
    } catch (error) {
      this.callbacks.onError?.(`マイクへのアクセスに失敗しました: ${error}`);
      throw error;
    }
  }

  stopListening(): void {
    this.isRecording = false;
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.isSpeaking = false;
  }

  private startVolumeMonitoring(): void {
    if (!this.isRecording || !this.analyser || !this.dataArray) {
      return;
    }

    const checkVolume = () => {
      if (!this.isRecording || !this.analyser || !this.dataArray) {
        return;
      }

      this.analyser.getByteFrequencyData(this.dataArray);
      
      // 音量を計算 (0-1の範囲)
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      const volume = average / 255;
      
      this.callbacks.onVolumeChange?.(volume);

      // 音声検出の処理
      if (volume > this.config.silenceThreshold) {
        // 音声が検出された
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.callbacks.onSpeechStart?.();
          
          // 録音開始
          if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.mediaRecorder.start();
          }
        }
        
        // 無音タイマーをクリア
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (this.isSpeaking && !this.silenceTimer) {
        // 無音が検出された
        // 無音タイマーを開始
        this.silenceTimer = window.setTimeout(() => {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            
            // 録音停止
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          }
          this.silenceTimer = null;
        }, this.config.silenceDuration);
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  // 設定を更新
  updateConfig(config: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 現在の状態を取得
  getStatus(): { isRecording: boolean; isSpeaking: boolean } {
    return {
      isRecording: this.isRecording,
      isSpeaking: this.isSpeaking
    };
  }
}
