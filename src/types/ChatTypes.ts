export interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: 'user' | 'system';
}

export interface ChatHistory {
  messages: ChatMessage[];
  addMessage: (text: string, type: 'user' | 'system') => void;
  clear: () => void;
}
