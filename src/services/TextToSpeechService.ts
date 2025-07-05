export interface TextToSpeechConfig {
  apiKey: string;
  model?: string;
  voice?: string;
}

export interface AudioStreamCallbacks {
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: string) => void;
}

export class TextToSpeechService {
  private apiKey: string;
  private readonly model: string;
  private readonly voice: string;
  private audioContext: AudioContext | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private readonly speechQueue: Array<{ text: string; callbacks?: AudioStreamCallbacks }> = [];
  private isProcessingQueue = false;

  constructor(config: TextToSpeechConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "tts-1";
    this.voice = config.voice ?? "alloy";
  }

  async speakText(text: string, callbacks?: AudioStreamCallbacks): Promise<void> {
    if (!this.apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    if (!text.trim()) {
      throw new Error("音声出力するテキストが空です");
    }

    // キューに追加
    this.speechQueue.push({ text, callbacks });
    
    // キューの処理を開始（既に処理中でない場合）
    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return; // 既に処理中の場合は何もしない
    }
    
    this.isProcessingQueue = true;

    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift();
      if (!item) break;

      try {
        // 前の音声が完全に停止するまで待機
        while (this.isPlaying) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        item.callbacks?.onAudioStart?.();
        
        // OpenAI TTS APIを呼び出し
        const audioBuffer = await this.generateSpeech(item.text);
        
        // 音声を再生（完了まで待機）
        await this.playAudio(audioBuffer, item.callbacks);
        
      } catch (error) {
        console.error("音声出力エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "音声出力に失敗しました";
        item.callbacks?.onError?.(errorMessage);
        // エラーが発生してもキューの処理は継続
      }
    }

    this.isProcessingQueue = false;
  }

  private async generateSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        voice: this.voice,
        instructions: "Please speak a little faster.",
        response_format: "mp3"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI TTS API Error: ${errorData.error?.message ?? response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  private async playAudio(audioBuffer: ArrayBuffer, callbacks?: AudioStreamCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      // 非同期処理を内部で実行
      (async () => {
        try {
          // AudioContextを初期化
          this.audioContext ??= new AudioContext();

          // AudioContextが suspended状態の場合は resume
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          // キューイング処理中は既存の音声停止をスキップ
          // （processQueueで既に前の音声完了を待機しているため）

          // ArrayBufferをAudioBufferにデコード
          const audioBufferData = await this.audioContext.decodeAudioData(audioBuffer);

          // AudioBufferSourceNodeを作成
          this.currentAudioSource = this.audioContext.createBufferSource();
          this.currentAudioSource.buffer = audioBufferData;
          this.currentAudioSource.connect(this.audioContext.destination);

          // 再生終了のイベントリスナーを設定
          this.currentAudioSource.onended = () => {
            this.isPlaying = false;
            this.currentAudioSource = null;
            callbacks?.onAudioEnd?.();
            resolve(); // 再生完了を通知
          };

          // 音声を再生
          this.isPlaying = true;
          this.currentAudioSource.start();

        } catch (error) {
          this.isPlaying = false;
          this.currentAudioSource = null;
          const errorMessage = error instanceof Error ? error : new Error("音声再生中にエラーが発生しました");
          reject(errorMessage);
        }
      })();
    });
  }

  stopCurrentAudio(): void {
    // キューをクリア
    this.speechQueue.length = 0;
    this.isProcessingQueue = false;
    
    if (this.currentAudioSource && this.isPlaying) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
      this.isPlaying = false;
    }
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  updateVoice(_voice: string): void {
    // 新しいインスタンスを作成する必要があるため、この設定は即座には反映されません
    console.warn("音声の変更は次回のインスタンス作成時に反映されます");
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // キューの状態を取得
  getQueueStatus(): { isProcessing: boolean; queueLength: number } {
    return {
      isProcessing: this.isProcessingQueue,
      queueLength: this.speechQueue.length
    };
  }

  // リソースの解放
  destroy(): void {
    this.stopCurrentAudio();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
