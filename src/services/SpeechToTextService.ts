export interface SpeechToTextConfig {
  apiKey: string;
  model?: string;
  language?: string;
}

export class SpeechToTextService {
  private apiKey: string;
  private readonly model: string;
  private language: string;

  constructor(config: SpeechToTextConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "whisper-1";
    this.language = config.language ?? "ja";
  }

  async convertAudioToText(audioBlob: Blob): Promise<string> {
    if (!this.apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", this.model);
      formData.append("language", this.language);

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message ?? response.statusText}`);
      }

      const data = await response.json();
      return data.text ?? "";
    } catch (error) {
      console.error("音声からテキストへの変換エラー:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("音声からテキストへの変換に失敗しました");
    }
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  updateLanguage(language: string): void {
    this.language = language;
  }
}
