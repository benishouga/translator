interface ApiKeyInputProps {
  readonly apiKey: string;
  readonly onChange: (apiKey: string) => void;
  readonly disabled?: boolean;
}

export default function ApiKeyInput({ apiKey, onChange, disabled = false }: ApiKeyInputProps) {
  return (
    <div>
      <label htmlFor="apiKey" className="block text-sm font-medium mb-2 text-gray-600">
        APIキー:
      </label>
      <input
        id="apiKey"
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="APIキーを入力してください"
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}
