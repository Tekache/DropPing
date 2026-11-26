import { Platform, PermissionsAndroid } from 'react-native';
import {
  connect,
  getAvailablePeers,
  getConnectionInfo,
  initialize,
  receiveFile,
  sendFile,
  startDiscoveringPeers,
  stopDiscoveringPeers,
  subscribeOnConnectionInfoUpdates,
  subscribeOnPeersUpdates,
} from 'react-native-wifi-p2p';
import type { Device, WifiP2pInfo } from 'react-native-wifi-p2p';
import { NearbyDevice } from '../types';

export type WifiDirectPeer = NearbyDevice & { deviceAddress: string };

class WifiDirectService {
  private initialized = false;
  private discovering = false;
  private peersSubscription?: { remove: () => void };
  private connectionSubscription?: { remove: () => void };

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
