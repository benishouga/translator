export interface VoiceRecognitionConfig {
  silenceThreshold: number; // 無音と判定する音量のしきい値 (0-1)
  silenceDuration: number; // 無音継続時間 (ミリ秒)
  sampleRate: number; // サンプリングレート
  deviceId?: string; // 使用するマイクデバイスのID
  noiseFilterEnabled?: boolean; // ノイズフィルタリングを有効にするか
  minSpeechVolume?: number; // 有効な音声とみなす最小音量
  minSpeechDuration?: number; // 有効な音声とみなす最小継続時間（ミリ秒）
  volumeStabilityThreshold?: number; // 音量の安定性を判定するしきい値
  customStream?: MediaStream; // 外部から提供されるMediaStream（システム音声等）
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
  private speechStartTime: number = 0;
  private lastSpeechTime: number = 0; // 最後に音声が検出された時刻
  private speechVolumeHistory: number[] = [];
  private volumeVarianceHistory: number[] = [];
  private frequencyData: number[] = [];
  
  private config: VoiceRecognitionConfig = {
    silenceThreshold: 0.01, // 1%の音量以下を無音とする
    silenceDuration: 1500, // 1.5秒の無音で区切り
    sampleRate: 44100,
    deviceId: undefined, // デフォルトデバイスを使用
    noiseFilterEnabled: true, // ノイズフィルタリングを有効
    minSpeechVolume: 0.02, // 有効な音声の最小音量（2%）
    minSpeechDuration: 600, // 有効な音声の最小継続時間（600ms - 咳払い除去）
    volumeStabilityThreshold: 0.01 // 音量変動の許容範囲
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
      let stream: MediaStream;
      
      // カスタムストリームが提供されている場合はそれを使用
      if (this.config.customStream) {
        stream = this.config.customStream;
        
        // ストリームの状態を確認
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("カスタムストリームに音声トラックが含まれていません");
        }
        
        const activeAudioTracks = audioTracks.filter(track => track.readyState === 'live');
        if (activeAudioTracks.length === 0) {
          throw new Error("カスタムストリームの音声トラックがアクティブではありません");
        }
        
        console.log(`外部提供のMediaStreamを使用します（音声トラック: ${activeAudioTracks.length}個）`);
      } else {
        // マイクへのアクセス許可を取得
        const constraints: MediaStreamConstraints = {
          audio: {
            sampleRate: this.config.sampleRate,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            ...(this.config.deviceId && { deviceId: { exact: this.config.deviceId } })
          }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("マイクからのMediaStreamを使用します");
      }

      // AudioContextを初期化
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // 音声源をAnalyserに接続
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
          
          // 音声が有効かどうかをチェック
          if (this.isValidSpeech()) {
            this.callbacks.onSpeechEnd?.(audioBlob);
          } else {
            console.log("ノイズまたは無効な音声として判定され、処理をスキップしました");
          }
          
          this.recordedChunks = [];
        }
        
        // 音声履歴をリセット
        this.speechVolumeHistory = [];
        this.volumeVarianceHistory = [];
        this.frequencyData = [];
        this.speechStartTime = 0;
        this.lastSpeechTime = 0;
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
    this.speechVolumeHistory = [];
    this.volumeVarianceHistory = [];
    this.frequencyData = [];
    this.speechStartTime = 0;
    this.lastSpeechTime = 0;
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
      
      // 周波数データを保存（ノイズ検出用）
      this.updateFrequencyData();
      
      this.callbacks.onVolumeChange?.(volume);

      // 音声検出の処理
      this.handleVolumeDetection(volume);

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  private updateFrequencyData(): void {
    if (!this.dataArray) return;
    
    const frequencySum = this.dataArray.slice(0, 32).reduce((sum, value) => sum + value, 0); // 低周波数帯域
    this.frequencyData.push(frequencySum);
    if (this.frequencyData.length > 50) {
      this.frequencyData.shift();
    }
  }

  private handleVolumeDetection(volume: number): void {
    if (volume > this.config.silenceThreshold) {
      this.handleSpeechDetected(volume);
    } else if (this.isSpeaking && !this.silenceTimer) {
      this.handleSilenceDetected();
    }
  }

  private handleSpeechDetected(volume: number): void {
    const currentTime = Date.now();
    
    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.speechStartTime = currentTime;
      this.lastSpeechTime = currentTime;
      this.speechVolumeHistory = [];
      this.volumeVarianceHistory = [];
      this.callbacks.onSpeechStart?.();
      
      // 録音開始
      if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
        this.mediaRecorder.start();
      }
    }
    
    // 最後の音声検出時刻を更新
    this.lastSpeechTime = currentTime;
    
    // 音量履歴に追加
    this.speechVolumeHistory.push(volume);
    
    // 音量変動を計算
    this.updateVolumeVariance(volume);
    
    // 無音タイマーをクリア
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private updateVolumeVariance(volume: number): void {
    if (this.speechVolumeHistory.length >= 2) {
      const prevVolume = this.speechVolumeHistory[this.speechVolumeHistory.length - 2];
      const variance = Math.abs(volume - prevVolume);
      this.volumeVarianceHistory.push(variance);
      
      // 履歴のサイズを制限
      if (this.volumeVarianceHistory.length > 20) {
        this.volumeVarianceHistory.shift();
      }
    }
  }

  private handleSilenceDetected(): void {
    const actualSpeechDuration = this.lastSpeechTime - this.speechStartTime;
    
    // 咳払いのような短時間の音声の後は、より短い無音時間で録音を停止
    let silenceDuration = this.config.silenceDuration;
    if (actualSpeechDuration < 1000 && actualSpeechDuration > 100) {
      // 短時間の音声（100ms〜1000ms）の場合は無音時間を短縮
      silenceDuration = Math.min(500, this.config.silenceDuration);
      console.log(`短時間音声検出: 音声時間=${actualSpeechDuration}ms, 無音待機時間を${silenceDuration}msに短縮`);
    }
    
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
    }, silenceDuration);
  }

  // 設定を更新
  updateConfig(newConfig: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 有効な音声かどうかを判定
  private isValidSpeech(): boolean {
    // ノイズフィルタリングが無効の場合は常に有効とする
    if (!this.config.noiseFilterEnabled) {
      return this.speechVolumeHistory.length > 0;
    }

    // 音声履歴が空の場合は無効
    if (this.speechVolumeHistory.length === 0) {
      return false;
    }

    // 基本判定
    if (!this.passesBasicValidation()) {
      return false;
    }

    // 咳払い検出
    if (this.isCoughPattern()) {
      console.log("咳払いパターンとして判定されました");
      return false;
    }

    // ノイズパターン検出
    if (this.isNoisePattern()) {
      return false;
    }

    console.log(`有効な音声として判定: 実際の音声時間=${this.lastSpeechTime - this.speechStartTime}ms, 総録音時間=${Date.now() - this.speechStartTime}ms`);
    return true;
  }

  // 基本的な音声判定
  private passesBasicValidation(): boolean {
    const averageVolume = this.speechVolumeHistory.reduce((sum, vol) => sum + vol, 0) / this.speechVolumeHistory.length;
    const maxVolume = Math.max(...this.speechVolumeHistory);
    
    // 実際の音声継続時間を計算（最後の音声検出時刻 - 開始時刻）
    const actualSpeechDuration = this.lastSpeechTime - this.speechStartTime;
    const totalRecordingDuration = Date.now() - this.speechStartTime;
    
    const minVolumeThreshold = this.config.minSpeechVolume ?? 0.02;
    const minDurationThreshold = this.config.minSpeechDuration ?? 600;
    
    console.log(`音声判定: 実際の音声継続時間=${actualSpeechDuration}ms, 総録音時間=${totalRecordingDuration}ms`);
    
    if (averageVolume < minVolumeThreshold || 
        maxVolume < minVolumeThreshold * 2 || 
        actualSpeechDuration < minDurationThreshold) {
      console.log(`音声判定失敗: 平均音量=${averageVolume.toFixed(3)}, 最大音量=${maxVolume.toFixed(3)}, 実際の音声時間=${actualSpeechDuration}ms`);
      return false;
    }
    
    return true;
  }

  // ノイズパターンの検出
  private isNoisePattern(): boolean {
    const averageVolume = this.speechVolumeHistory.reduce((sum, vol) => sum + vol, 0) / this.speechVolumeHistory.length;
    const maxVolume = Math.max(...this.speechVolumeHistory);
    const minVolumeThreshold = this.config.minSpeechVolume ?? 0.02;

    // 音量変動の分析（呼吸音は一定の音量が多い）
    if (this.volumeVarianceHistory.length > 8) {
      const avgVariance = this.volumeVarianceHistory.reduce((sum, v) => sum + v, 0) / this.volumeVarianceHistory.length;
      const stabilityThreshold = this.config.volumeStabilityThreshold ?? 0.01;
      
      if (avgVariance < stabilityThreshold && maxVolume < 0.05) {
        console.log(`ノイズ判定: 音量変動が少なすぎる (変動=${avgVariance.toFixed(3)}, 最大音量=${maxVolume.toFixed(3)})`);
        return true;
      }
    }

    // 周波数パターンの分析
    if (this.frequencyData.length > 15) {
      const avgFrequency = this.frequencyData.slice(-15).reduce((sum, f) => sum + f, 0) / 15;
      const maxFrequency = Math.max(...this.frequencyData.slice(-15));
      
      if (avgFrequency > maxFrequency * 0.9 && averageVolume < 0.03) {
        console.log(`ノイズ判定: 低周波数帯域のみが強い (平均=${avgFrequency}, 最大=${maxFrequency}, 音量=${averageVolume.toFixed(3)})`);
        return true;
      }
    }

    // 音声の強弱パターンの分析
    if (this.speechVolumeHistory.length > 12) {
      const recentVolumes = this.speechVolumeHistory.slice(-12);
      const volumeRange = Math.max(...recentVolumes) - Math.min(...recentVolumes);
      
      if (volumeRange < minVolumeThreshold * 0.5 && averageVolume < minVolumeThreshold * 1.2) {
        console.log(`ノイズ判定: 音量の幅が狭すぎる (幅=${volumeRange.toFixed(3)}, 平均音量=${averageVolume.toFixed(3)})`);
        return true;
      }
    }

    return false;
  }

  // 咳払いパターンの検出
  private isCoughPattern(): boolean {
    const actualSpeechDuration = this.lastSpeechTime - this.speechStartTime;
    const totalRecordingDuration = Date.now() - this.speechStartTime;
    
    // 実際の音声が短時間なのに録音時間が長い場合（咳払い後の無音）
    if (actualSpeechDuration < 800 && totalRecordingDuration > actualSpeechDuration + 500) {
      console.log(`咳払いパターン検出: 音声時間=${actualSpeechDuration}ms, 録音時間=${totalRecordingDuration}ms`);
      return true;
    }
    
    // 短時間での強い音量変化をチェック
    if (this.hasShortTermHighVolume(actualSpeechDuration)) {
      return true;
    }
    
    // 極端な音量変動をチェック
    if (this.hasExtremeVolumeVariation(actualSpeechDuration)) {
      return true;
    }
    
    // 短時間での複数ピークをチェック
    if (this.hasMultiplePeaks(actualSpeechDuration)) {
      return true;
    }

    return false;
  }

  // 短時間での強い音量変化の検出
  private hasShortTermHighVolume(duration: number): boolean {
    if (duration >= 1000 || this.speechVolumeHistory.length === 0) {
      return false;
    }

    const maxVolume = Math.max(...this.speechVolumeHistory);
    const avgVolume = this.speechVolumeHistory.reduce((sum, vol) => sum + vol, 0) / this.speechVolumeHistory.length;
    
    return maxVolume > 0.1 && (maxVolume - avgVolume) > 0.05;
  }

  // 極端な音量変動の検出
  private hasExtremeVolumeVariation(duration: number): boolean {
    if (this.volumeVarianceHistory.length <= 5) {
      return false;
    }

    const maxVariance = Math.max(...this.volumeVarianceHistory);
    const avgVariance = this.volumeVarianceHistory.reduce((sum, v) => sum + v, 0) / this.volumeVarianceHistory.length;
    
    return duration < 800 && maxVariance > 0.08 && avgVariance > 0.03;
  }

  // 短時間での複数ピークの検出
  private hasMultiplePeaks(duration: number): boolean {
    if (this.speechVolumeHistory.length <= 10 || duration >= 1500) {
      return false;
    }

    let peakCount = 0;
    const threshold = 0.05;
    
    for (let i = 1; i < this.speechVolumeHistory.length - 1; i++) {
      const prev = this.speechVolumeHistory[i - 1];
      const current = this.speechVolumeHistory[i];
      const next = this.speechVolumeHistory[i + 1];
      
      if (current > prev + threshold && current > next + threshold) {
        peakCount++;
      }
    }
    
    return peakCount >= 2;
  }

  // 現在の状態を取得
  getStatus(): { isRecording: boolean; isSpeaking: boolean } {
    return {
      isRecording: this.isRecording,
      isSpeaking: this.isSpeaking
    };
  }
}
