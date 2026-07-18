import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { NearbyDevice } from '../types';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789012';
const CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789013';

class BLEService {
  private manager: BleManager;
  private scanning: boolean = false;
  private discoveredDevices: Map<string, Device> = new Map();

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(results).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  async startScanning(onDeviceFound: (device: NearbyDevice) => void): Promise<void> {
    if (this.scanning) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('BLE permissions denied');
      return;
    }

    this.manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        this.scanning = true;
        this.manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log('BLE scan error:', error);
            return;
          }
          if (device && device.name && !this.discoveredDevices.has(device.id)) {
            this.discoveredDevices.set(device.id, device);
            const nearbyDevice: NearbyDevice = {
              id: device.id,
              name: device.name || 'Unknown Device',
              deviceType: device.name?.includes('iPhone') ? 'ios' : 'android',
              avatar: (device.name || 'U').charAt(0),
              isOnline: true,
              visibilityMode: 'everyone',
              isTrusted: false,
              signalStrength: Math.min(100, Math.max(0, (device.rssi || -100) + 100)),
              lastSeen: new Date(),
            };
            onDeviceFound(nearbyDevice);
          }
        });
      }
    }, true);
  }

  stopScanning(): void {
    if (this.scanning) {
      this.manager.stopDeviceScan();
      this.scanning = false;
      this.discoveredDevices.clear();
    }
  }

  destroy(): void {
    this.stopScanning();
    this.manager.destroy();
  }
}

export const bleService = new BLEService();