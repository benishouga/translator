import { useState, useEffect } from 'react';

export function useAudioDevices() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        
        // デフォルトデバイスを選択
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("オーディオデバイスの取得に失敗:", error);
      }
    };

    getAudioDevices();
  }, [selectedDeviceId]);

  const updateAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
    } catch (error) {
      console.warn("デバイスリストの更新に失敗:", error);
    }
  };

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    updateAudioDevices
  };
}
