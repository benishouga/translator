import { useState } from 'react';

interface TestPanelProps {
  readonly apiKey: string;
  readonly onTestTranslation: (text: string) => void;
}

export default function TestPanel({ apiKey, onTestTranslation }: TestPanelProps) {
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testText, setTestText] = useState('');

  const handleTestTranslation = () => {
    if (!apiKey.trim()) {
      alert("APIキーを入力してください");
      return;
    }

    if (!testText.trim()) {
      alert("テスト用テキストを入力してください");
      return;
    }

    const textToProcess = testText.trim();
    setTestText("");
    onTestTranslation(textToProcess);
  };

  const handleTestTextKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTestTranslation();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">テスト機能</h2>
        <button
          onClick={() => setIsTestPanelOpen(!isTestPanelOpen)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isTestPanelOpen ? '閉じる' : '開く'}
        </button>
      </div>
      
      {isTestPanelOpen && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            マイクを使わずにテキスト入力で翻訳・音声出力をテストできます
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="testText" className="block text-sm font-medium mb-2 text-gray-600">
                テスト用テキスト:
              </label>
              <textarea
                id="testText"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onKeyDown={handleTestTextKeyPress}
                placeholder="翻訳したいテキストを入力してください（Enterで実行、Shift+Enterで改行）"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
            <button
              onClick={handleTestTranslation}
              disabled={!apiKey.trim() || !testText.trim()}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                !apiKey.trim() || !testText.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
              }`}
            >
              テスト翻訳実行
            </button>
          </div>
        </>
      )}
    </div>
  );
}
