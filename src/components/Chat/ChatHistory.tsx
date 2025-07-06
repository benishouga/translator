import { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/ChatTypes';
import ChatMessageComponent from './ChatMessage';

interface ChatHistoryProps {
  readonly messages: ChatMessage[];
  readonly onClear: () => void;
}

export default function ChatHistory({ messages, onClear }: ChatHistoryProps) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // チャット履歴が更新されたときに自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-180 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">チャット履歴</h2>
        <button
          onClick={onClear}
          className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
        >
          履歴をクリア
        </button>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">まだメッセージがありません</p>
            <p className="text-xs mt-1">音声認識を開始すると、結果がここに表示されます</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
