import { Platform, PermissionsAndroid } from 'react-native';
import {
  connect,
  getAvailablePeers,
  getConnectionInfo,
  initialize,
  receiveFile,
  receiveMessage,
  sendFile,
  sendMessage,
  startDiscoveringPeers,
  stopDiscoveringPeers,
  subscribeOnConnectionInfoUpdates,
  subscribeOnPeersUpdates,
} from 'react-native-wifi-p2p';
import type { Device, WifiP2pInfo } from 'react-native-wifi-p2p';
import { NearbyDevice } from '../types';

export type WifiDirectPeer = NearbyDevice & { deviceAddress: string };

export type TransferOffer = {
  fileName: string;
  fileSize: number;
  senderName: string;
  senderId: string;
};

class WifiDirectService {
  private initialized = false;
  private discovering = false;
  private peersSubscription?: { remove: () => void };
  private connectionSubscription?: { remove: () => void };
  private incomingListenerActive = false;
  private pendingReceive?: Promise<string>;

  isSupported() {
    return Platform.OS === 'android';
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const permissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
    ].filter(Boolean);

    const result = await PermissionsAndroid.requestMultiple(permissions);
    return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
  }

  async initialize(): Promise<void> {
    if (!this.isSupported() || this.initialized) return;
    const permissionGranted = await this.requestPermissions();
    if (!permissionGranted) throw new Error('Nearby Wi-Fi permission was denied.');
    const ok = await initialize();
    if (!ok) throw new Error('Wi-Fi Direct is not available on this device.');
    this.initialized = true;
  }

  async startDiscovery(onPeers: (peers: WifiDirectPeer[]) => void): Promise<void> {
    await this.initialize();
    this.peersSubscription?.remove();
    this.peersSubscription = subscribeOnPeersUpdates(({ devices }) => {
      onPeers(devices.map((device) => this.toNearbyDevice(device)));
    });
    await startDiscoveringPeers();
    this.discovering = true;
    const { devices } = await getAvailablePeers();
    onPeers(devices.map((device) => this.toNearbyDevice(device)));
  }

  async stopDiscovery(): Promise<void> {
    this.peersSubscription?.remove();
    this.peersSubscription = undefined;
    if (this.discovering) {
      await stopDiscoveringPeers();
      this.discovering = false;
    }
  }

  async connectToPeer(deviceAddress: string): Promise<void> {
    await this.initialize();
    await connect(deviceAddress);
    await getConnectionInfo();
  }

  onConnectionInfo(callback: (info: WifiP2pInfo) => void) {
    this.connectionSubscription?.remove();
    this.connectionSubscription = subscribeOnConnectionInfoUpdates(callback);
    return () => this.connectionSubscription?.remove();
  }

  watchIncomingTransfers(onOffer: (offer: TransferOffer) => void) {
    this.onConnectionInfo(() => {
      if (this.incomingListenerActive) return;
      this.incomingListenerActive = true;
      receiveMessage({ meta: true })
        .then((message) => {
          try {
            const parsed = JSON.parse(message) as { type?: string; offer?: TransferOffer };
            if (parsed.type === 'transfer-offer' && parsed.offer) onOffer(parsed.offer);
          } finally {
            this.incomingListenerActive = false;
          }
        })
        .catch(() => {
          this.incomingListenerActive = false;
        });
    });
  }

  async sendTransferOffer(offer: TransferOffer) {
    await sendMessage(JSON.stringify({ type: 'transfer-offer', offer }));
  }

  async waitForTransferDecision(): Promise<boolean> {
    const message = await receiveMessage({ meta: true });
    try {
      const parsed = JSON.parse(message) as { type?: string; accepted?: boolean };
      return parsed.type === 'transfer-decision' && parsed.accepted === true;
    } catch {
      return false;
    }
  }

  async sendTransferDecision(accepted: boolean) {
    await sendMessage(JSON.stringify({ type: 'transfer-decision', accepted }));
  }

  async sendFile(fileUri: string) {
    await this.initialize();
    return sendFile(this.toNativePath(fileUri));
  }

  async receiveFile(folder: string, fileName: string) {
    await this.initialize();
    return receiveFile(folder, fileName, true);
  }

  prepareReceive(folder: string, fileName: string) {
    this.pendingReceive = this.receiveFile(folder, fileName);
  }

  async receivePreparedFile(folder: string, fileName: string) {
    const pending = this.pendingReceive || this.receiveFile(folder, fileName);
    this.pendingReceive = undefined;
    return pending;
  }

  destroy() {
    this.peersSubscription?.remove();
    this.connectionSubscription?.remove();
    this.peersSubscription = undefined;
    this.connectionSubscription = undefined;
    this.incomingListenerActive = false;
    this.pendingReceive = undefined;
  }

  private toNativePath(uri: string) {
    return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
  }

  private toNearbyDevice(device: Device): WifiDirectPeer {
    return {
      id: device.deviceAddress,
      deviceAddress: device.deviceAddress,
      name: device.deviceName || 'Nearby Android device',
      deviceType: 'android',
      avatar: (device.deviceName || 'A').charAt(0).toUpperCase(),
      isOnline: device.status === 3 || device.status === 0,
      visibilityMode: 'everyone',
      isTrusted: false,
      signalStrength: 0,
      lastSeen: new Date(),
    };
  }
}

export const wifiDirectService = new WifiDirectService();
