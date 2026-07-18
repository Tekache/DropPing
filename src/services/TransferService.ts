import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface TransferProgress {
  progress: number;
  speed: number;
  timeRemaining: number;
  transferred: number;
}

class TransferService {
  async sendFile(
    fileUri: string,
    fileName: string,
    fileSize: number,
    onProgress: (progress: TransferProgress) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const startTime = Date.now();
      let transferred = 0;
      const chunkSize = Math.max(65536, Math.floor(fileSize / 20));
      const totalChunks = Math.ceil(fileSize / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        transferred = Math.min(transferred + chunkSize, fileSize);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = transferred / elapsed;
        const remaining = speed > 0 ? (fileSize - transferred) / speed : 0;
        const progress = (transferred / fileSize) * 100;

        onProgress({
          progress,
          speed,
          timeRemaining: remaining,
          transferred,
        });
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: `Share ${fileName}`,
        });
      }

      onComplete();
    } catch (error) {
      onError(String(error));
    }
  }

  async receiveFile(
    fileName: string,
    destinationDir: string
  ): Promise<string> {
    const destUri = `${FileSystem.documentDirectory}DropPing/${fileName}`;
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}DropPing/`,
      { intermediates: true }
    );
    return destUri;
  }

  async createDropPingFolder(): Promise<void> {
    const folders = [
      'Photos',
      'Videos',
      'Documents',
      'Audio',
      'Apps',
      'Others',
    ];
    for (const folder of folders) {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}DropPing/${folder}/`,
        { intermediates: true }
      );
    }
  }
}

export const transferService = new TransferService();