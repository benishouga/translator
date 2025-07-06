interface LanguageSelectorProps {
  readonly sourceLanguage: string;
  readonly onChange: (language: string) => void;
  readonly disabled?: boolean;
}

export default function LanguageSelector({ sourceLanguage, onChange, disabled = false }: LanguageSelectorProps) {
  return (
    <div>
      <label htmlFor="sourceLanguage" className="block text-sm font-medium mb-2 text-gray-600">
        元言語:
      </label>
      <select
        id="sourceLanguage"
        value={sourceLanguage}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">未指定（自動検出）</option>
        <option value="ja">日本語</option>
        <option value="en">英語</option>
      </select>
    </div>
  );
}
