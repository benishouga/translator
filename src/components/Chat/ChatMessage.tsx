import type { ChatMessage } from '../../types/ChatTypes';

interface ChatMessageProps {
  readonly message: ChatMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  if (message.type === 'translation') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm text-green-600 font-medium">翻訳結果</span>
          <span className="text-xs text-green-500">{formatTime(message.timestamp)}</span>
        </div>
        
        {message.originalText && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">元テキスト:</span> {message.originalText}
          </div>
        )}
        
        <div className="text-gray-800 font-medium">
          {message.text}
        </div>
        
        {message.sourceLanguage && message.targetLanguage && (
          <div className="text-xs text-green-600 mt-2">
            {message.sourceLanguage} → {message.targetLanguage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-blue-600 font-medium">
          {message.type === 'user' ? '音声認識' : 'システム'}
        </span>
        <span className="text-xs text-blue-500">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="text-gray-800">
        {message.text}
      </div>
    </div>
  );
}
