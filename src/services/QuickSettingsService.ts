import { NativeModules, Platform } from 'react-native';

const native = NativeModules.DropPingQuickSettings as
  | {
      getDiscoverable?: () => Promise<boolean>;
      setDiscoverable?: (enabled: boolean) => Promise<void>;
    }
  | undefined;

export const quickSettingsService = {
  isAvailable: Platform.OS === 'android' && Boolean(native),
  async getDiscoverable(): Promise<boolean | null> {
    if (!native?.getDiscoverable) return null;
    try {
      return await native.getDiscoverable();
    } catch {
      return null;
    }
  },
  async setDiscoverable(enabled: boolean): Promise<void> {
    if (!native?.setDiscoverable) return;
    await native.setDiscoverable(enabled);
  },
};
