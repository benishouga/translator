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
      // 言語検出と翻訳を同時に実行
      const result = await this.performTranslation(text);
      return result;
    } catch (error) {
      console.error("翻訳エラー:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("翻訳に失敗しました");
    }
  }

  private async performTranslation(text: string): Promise<TranslationResult> {
    const systemPrompt = `あなたは高精度な翻訳専門家です。以下のルールに従って翻訳してください：

1. 入力されたテキストが日本語の場合は英語に翻訳してください
2. 入力されたテキストが英語の場合は日本語に翻訳してください
3. 回答はJSON形式で以下の構造にしてください：
{
  "translatedText": "翻訳結果",
  "sourceLanguage": "元の言語（ja または en）",
  "targetLanguage": "翻訳先の言語（ja または en）"
}

翻訳は自然で正確になるよう心がけてください。`;

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
        max_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() ?? "";
    
    try {
      const result = JSON.parse(content);
      return {
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage
      };
    } catch {
      // JSONパースに失敗した場合はコンテンツをそのまま翻訳結果として使用
      return {
        originalText: text,
        translatedText: content,
        sourceLanguage: "unknown",
        targetLanguage: "unknown"
      };
    }
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
