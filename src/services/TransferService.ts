import { wifiDirectService } from './WifiDirectService';

export interface TransferProgress {
  progress: number;
  speed: number;
  timeRemaining: number;
  transferred: number;
}

/**
 * Real Android transfer adapter.
 * react-native-wifi-p2p exposes completion rather than byte-level callbacks,
 * so callers must not invent progress values. The UI reports 0% until the
 * native operation completes and then switches to 100%.
 */
class TransferService {
  async sendFile(fileUri: string): Promise<{ time: number; file: string }> {
    const startedAt = Date.now();
    const result = await wifiDirectService.sendFile(fileUri);
    return { ...result, time: result.time || Date.now() - startedAt };
  }

  async receiveFile(fileName: string, destinationDir = '/storage/emulated/0/DropPing'): Promise<string> {
    return wifiDirectService.receiveFile(destinationDir, fileName);
  }
}

export const transferService = new TransferService();
