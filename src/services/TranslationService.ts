export interface TranslationConfig {
  apiKey: string;
  model?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  private apiKey: string;
  private readonly model: string;

  constructor(config: TranslationConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gpt-4.1";
  }

  async translateText(text: string): Promise<TranslationResult> {
    if (!this.apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    if (!text.trim()) {
      throw new Error("翻訳するテキストが空です");
    }

    try {
      // まず言語を検出
      const detectedLanguage = await this.detectLanguage(text);
      const targetLanguage = detectedLanguage === "ja" ? "en" : "ja";
      
      // 翻訳を実行
      const translatedText = await this.performTranslation(text, detectedLanguage);

      return {
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage
      };
    } catch (error) {
      console.error("翻訳エラー:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("翻訳に失敗しました");
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "以下のテキストが日本語か英語かを判定してください。日本語の場合は「ja」、英語の場合は「en」とだけ回答してください。"
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 10,
        temperature: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const detectedLanguage = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    // 日本語または英語以外の場合は英語として扱う
    return detectedLanguage === "ja" ? "ja" : "en";
  }

  private async performTranslation(text: string, sourceLanguage: string): Promise<string> {
    const systemPrompt = sourceLanguage === "ja" 
      ? "あなたは日本語から英語への翻訳専門家です。提供されたテキストを自然で正確な英語に翻訳してください。翻訳結果のみを返してください。"
      : "あなたは英語から日本語への翻訳専門家です。提供されたテキストを自然で正確な日本語に翻訳してください。翻訳結果のみを返してください。";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() ?? "";
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
