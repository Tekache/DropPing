export type VisibilityMode = 'everyone' | 'contacts' | 'invisible' | 'trusted';

export type TransferStatus = 'pending' | 'transferring' | 'complete' | 'failed' | 'cancelled';

export type FileCategory = 'photos' | 'videos' | 'documents' | 'audio' | 'apps' | 'contacts' | 'links' | 'wifi' | 'other';

export type DeviceType = 'ios' | 'android';

export interface NearbyDevice {
  id: string;
  name: string;
  deviceType: DeviceType;
  avatar: string;
  isOnline: boolean;
  visibilityMode: VisibilityMode;
  isTrusted: boolean;
  signalStrength: number;
  lastSeen: Date;
}

export interface TransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: TransferStatus;
  progress: number;
  speed: number;
  timeRemaining: number;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  localPath?: string;
  direction: 'sent' | 'received';
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatar?: string;
  deviceName: string;
  deviceType: DeviceType;
  visibilityMode: VisibilityMode;
  trustedDevices: string[];
  isPro: boolean;
}

export interface PickedFile {
  name: string;
  size: number;
  uri: string;
  type: string | null;
}