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
import { ContactCard, NearbyDevice, TransferFile } from '../types';

export type TransferBatchOffer = {
  batchId: string;
  files: Array<Omit<TransferFile, 'uri'>>;
  senderName: string;
  senderId: string;
  senderAvatar?: string;
  totalSize: number;
};

export type ContactOffer = {
  contact: ContactCard;
  senderName: string;
  senderId: string;
  senderAvatar?: string;
};

export type IncomingOffer =
  | { kind: 'transfer'; offer: TransferBatchOffer }
  | { kind: 'contact'; offer: ContactOffer };

export type ProtocolMessage =
  | { type: 'transfer-offer'; offer: TransferBatchOffer }
  | { type: 'contact-offer'; offer: ContactOffer }
  | { type: 'transfer-decision'; accepted: boolean; reason?: string }
  | { type: 'file-ready'; batchId: string; index: number }
  | { type: 'transfer-cancelled'; batchId: string };

class WifiDirectService {
  private initialized = false;
  private discovering = false;
  private peersSubscription?: { remove: () => void };
  private connectionSubscription?: { remove: () => void };
  private incomingListenerActive = false;

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
    if (!(await this.requestPermissions())) throw new Error('Nearby Wi-Fi permission was denied.');
    if (!(await initialize())) throw new Error('Wi-Fi Direct is not available on this device.');
    this.initialized = true;
  }

  async startDiscovery(onPeers: (peers: Array<NearbyDevice & { deviceAddress: string }>) => void): Promise<void> {
    await this.initialize();
    this.peersSubscription?.remove();
    this.peersSubscription = subscribeOnPeersUpdates(({ devices }) => onPeers(devices.map((d) => this.toNearbyDevice(d))));
    await startDiscoveringPeers();
    this.discovering = true;
    const { devices } = await getAvailablePeers();
    onPeers(devices.map((d) => this.toNearbyDevice(d)));
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

  watchIncomingOffers(onOffer: (offer: IncomingOffer) => void) {
    this.onConnectionInfo(() => this.readNextOffer(onOffer));
  }

  private readNextOffer(onOffer: (offer: IncomingOffer) => void) {
    if (this.incomingListenerActive) return;
    this.incomingListenerActive = true;
    receiveMessage({ meta: true })
      .then((message) => {
        const parsed = JSON.parse(message) as ProtocolMessage;
        if (parsed.type === 'transfer-offer') onOffer({ kind: 'transfer', offer: parsed.offer });
        if (parsed.type === 'contact-offer') onOffer({ kind: 'contact', offer: parsed.offer });
      })
      .catch(() => undefined)
      .finally(() => { this.incomingListenerActive = false; });
  }

  async sendTransferOffer(offer: TransferBatchOffer) {
    await this.sendProtocol({ type: 'transfer-offer', offer });
  }

  async sendContactOffer(offer: ContactOffer) {
    await this.sendProtocol({ type: 'contact-offer', offer });
  }

  async waitForTransferDecision(): Promise<{ accepted: boolean; reason?: string }> {
    const message = JSON.parse(await receiveMessage({ meta: true })) as ProtocolMessage;
    return message.type === 'transfer-decision'
      ? { accepted: message.accepted, reason: message.reason }
      : { accepted: false, reason: 'Invalid transfer response.' };
  }

  async sendTransferDecision(accepted: boolean, reason?: string) {
    await this.sendProtocol({ type: 'transfer-decision', accepted, reason });
  }

  async sendFileReady(batchId: string, index: number) {
    await this.sendProtocol({ type: 'file-ready', batchId, index });
  }

  async waitForFileReady(batchId: string, index: number): Promise<void> {
    const message = JSON.parse(await receiveMessage({ meta: true })) as ProtocolMessage;
    if (message.type !== 'file-ready' || message.batchId !== batchId || message.index !== index) {
      throw new Error('The receiver was not ready for the next file.');
    }
  }

  async cancelTransfer(batchId: string) {
    await this.sendProtocol({ type: 'transfer-cancelled', batchId });
  }

  async sendFile(fileUri: string) {
    await this.initialize();
    return sendFile(this.toNativePath(fileUri));
  }

  async receiveFile(folder: string, fileName: string) {
    await this.initialize();
    return receiveFile(folder, fileName, true);
  }

  destroy() {
    this.peersSubscription?.remove();
    this.connectionSubscription?.remove();
    this.peersSubscription = undefined;
    this.connectionSubscription = undefined;
    this.incomingListenerActive = false;
  }

  private async sendProtocol(message: ProtocolMessage) {
    await sendMessage(JSON.stringify(message));
  }

  private toNativePath(uri: string) {
    return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
  }

  private toNearbyDevice(device: Device) {
    return {
      id: device.deviceAddress,
      deviceAddress: device.deviceAddress,
      name: device.deviceName || 'Nearby Android device',
      deviceType: 'android' as const,
      avatar: (device.deviceName || 'A').charAt(0).toUpperCase(),
      isOnline: device.status === 3 || device.status === 0,
      visibilityMode: 'everyone' as const,
      isTrusted: false,
      signalStrength: 0,
      lastSeen: new Date(),
    };
  }
}

export const wifiDirectService = new WifiDirectService();
