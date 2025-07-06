interface MicrophoneSettingsProps {
  readonly audioDevices: MediaDeviceInfo[];
  readonly selectedDeviceId: string;
  readonly noiseFilterEnabled: boolean;
  readonly isTranslating: boolean;
  readonly onDeviceChange: (deviceId: string) => void;
  readonly onNoiseFilterToggle: (enabled: boolean) => void;
}

export default function MicrophoneSettings({ 
  audioDevices, 
  selectedDeviceId, 
  noiseFilterEnabled, 
  isTranslating, 
  onDeviceChange, 
  onNoiseFilterToggle 
}: MicrophoneSettingsProps) {
  return (
    <div>
      <label htmlFor="micDevice" className="block text-sm font-medium mb-2 text-gray-600">
        マイクデバイス:
      </label>
      <select
        id="micDevice"
        value={selectedDeviceId}
        onChange={(e) => onDeviceChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        disabled={isTranslating}
      >
        {audioDevices.length === 0 ? (
          <option value="">マイクデバイスが見つかりません</option>
        ) : (
          audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `マイク ${device.deviceId.substring(0, 8)}`}
            </option>
          ))
        )}
      </select>
      
      <div className="mt-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={noiseFilterEnabled}
            onChange={(e) => onNoiseFilterToggle(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
            disabled={isTranslating}
          />
          <span className="text-sm text-gray-700">ノイズフィルタリングを有効にする</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          呼吸音、咳払い、短時間の雑音を除去します
        </p>
      </div>
    </div>
  );
}
