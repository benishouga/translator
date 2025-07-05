export interface TextToSpeechConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  speed?: number;
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
  private readonly speed: number;
  private audioContext: AudioContext | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor(config: TextToSpeechConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "tts-1";
    this.voice = config.voice ?? "alloy";
    this.speed = config.speed ?? 1.0;
  }

  async speakText(text: string, callbacks?: AudioStreamCallbacks): Promise<void> {
    if (!this.apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    if (!text.trim()) {
      throw new Error("音声出力するテキストが空です");
    }

    try {
      callbacks?.onAudioStart?.();
      
      // OpenAI TTS APIを呼び出し
      const audioBuffer = await this.generateSpeech(text);
      
      // 音声を再生
      await this.playAudio(audioBuffer, callbacks);
      
    } catch (error) {
      console.error("音声出力エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "音声出力に失敗しました";
      callbacks?.onError?.(errorMessage);
      throw error;
    }
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
        speed: this.speed,
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
    try {
      // AudioContextを初期化
      this.audioContext ??= new AudioContext();

      // AudioContextが suspended状態の場合は resume
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 既存の音声を停止
      this.stopCurrentAudio();

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
      };

      // 音声を再生
      this.isPlaying = true;
      this.currentAudioSource.start();

    } catch (error) {
      this.isPlaying = false;
      this.currentAudioSource = null;
      throw error;
    }
  }

  stopCurrentAudio(): void {
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

  updateSpeed(_speed: number): void {
    // 新しいインスタンスを作成する必要があるため、この設定は即座には反映されません
    console.warn("速度の変更は次回のインスタンス作成時に反映されます");
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
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
