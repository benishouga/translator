import { useState } from 'react';

export function useSystemAudio() {
  const [systemAudioStream, setSystemAudioStream] = useState<MediaStream | null>(null);

  const startSystemAudio = async (): Promise<void> => {
    try {
      // システム音声がサポートされているかチェック
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("このブラウザはシステム音声をサポートしていません");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }, 
        video: {
          width: { ideal: 1 }, // 最小限のビデオ設定
          height: { ideal: 1 }
        }
      });
      
      // 音声トラックのみを取得
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        // ビデオトラックを停止してリソースを解放
        stream.getVideoTracks().forEach(track => track.stop());
        throw new Error("選択されたコンテンツに音声が含まれていません。\n音声付きのアプリケーションやタブを選択してください。");
      }
      
      // 新しいMediaStreamを作成（音声のみ）
      const audioStream = new MediaStream(audioTracks);
      setSystemAudioStream(audioStream);
      
      console.log("システム音声の取得に成功しました");
      
      // 画面共有が停止された時のクリーンアップ
      const allTracks = [...stream.getVideoTracks(), ...audioTracks];
      allTracks.forEach(track => {
        track.onended = () => {
          console.log("システム音声共有が終了されました");
          stopSystemAudio();
        };
      });
      
      // ビデオトラックは不要なので停止
      stream.getVideoTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error("システム音声の取得に失敗:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error("画面共有が拒否されました。システム音声を使用するには画面共有を許可してください。");
        } else if (error.name === 'NotSupportedError') {
          throw new Error("このブラウザではシステム音声機能がサポートされていません。");
        } else {
          throw new Error(`システム音声の取得に失敗: ${errorMessage}`);
        }
      } else {
        throw new Error(`システム音声の取得に失敗: ${errorMessage}`);
      }
    }
  };

  const stopSystemAudio = () => {
    if (systemAudioStream) {
      systemAudioStream.getTracks().forEach(track => track.stop());
      setSystemAudioStream(null);
    }
    console.log("システム音声を停止しました");
  };

  return {
    systemAudioStream,
    startSystemAudio,
    stopSystemAudio
  };
}
