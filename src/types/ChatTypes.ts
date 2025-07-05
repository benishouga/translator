export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: 'user' | 'system' | 'translation';
  originalText?: string; // 翻訳の場合の元テキスト
  sourceLanguage?: string; // 元言語
  targetLanguage?: string; // 対象言語
}

export interface ChatHistory {
  messages: ChatMessage[];
  addMessage: (text: string, type: 'user' | 'system') => void;
  clear: () => void;
}
