import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NearbyDevice, UserProfile, VisibilityMode } from '../types';

interface AppStore {
  userProfile: UserProfile;
  nearbyDevices: NearbyDevice[];
  isDiscoverable: boolean;
  visibilityMode: VisibilityMode;
  theme: 'dark' | 'light' | 'system';
  language: string;
  batterySaver: boolean;
  addToGallery: boolean;
  autoOrganize: boolean;
  saveLocation: 'internal' | 'sdcard';
  setUserProfile: (profile: Partial<UserProfile>) => void;
  setProEntitlement: (entitlement: { entitlementId: string; deviceBound: boolean }) => void;
  setNearbyDevices: (devices: NearbyDevice[]) => void;
  toggleDiscoverable: () => void;
  setVisibility: (mode: VisibilityMode) => void;
  addTrustedDevice: (deviceId: string) => void;
  removeTrustedDevice: (deviceId: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setLanguage: (language: string) => void;
  setBatterySaver: (value: boolean) => void;
  setAddToGallery: (value: boolean) => void;
  setAutoOrganize: (value: boolean) => void;
  setSaveLocation: (value: 'internal' | 'sdcard') => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  userProfile: {
    id: 'local-user',
    displayName: 'My Phone',
    deviceName: 'My Device',
    deviceType: 'android',
    visibilityMode: 'everyone',
    trustedDevices: [],
    isPro: false,
  },
  nearbyDevices: [],
  isDiscoverable: false,
  visibilityMode: 'everyone',
  theme: 'dark',
  language: 'English',
  batterySaver: false,
  addToGallery: true,
  autoOrganize: true,
  saveLocation: 'internal',

  setUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  setProEntitlement: ({ entitlementId, deviceBound }) =>
    set((state) => ({
      userProfile: { ...state.userProfile, isPro: true, proEntitlementId: entitlementId, proDeviceBound: deviceBound },
    })),

  setNearbyDevices: (devices) => set({ nearbyDevices: devices }),

  toggleDiscoverable: () =>
    set((state) => ({ isDiscoverable: !state.isDiscoverable })),

  setVisibility: (mode) =>
    set({ visibilityMode: mode }),

  addTrustedDevice: (deviceId) =>
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        trustedDevices: [...state.userProfile.trustedDevices, deviceId],
      },
    })),

  removeTrustedDevice: (deviceId) =>
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        trustedDevices: state.userProfile.trustedDevices.filter((id) => id !== deviceId),
      },
    })),

  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setBatterySaver: (value) => set({ batterySaver: value }),
  setAddToGallery: (value) => set({ addToGallery: value }),
  setAutoOrganize: (value) => set({ autoOrganize: value }),
  setSaveLocation: (value) => set({ saveLocation: value }),

  loadSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem('dropPingSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        set(settings);
      }
    } catch (e) {
      console.log('Load settings error:', e);
    }
  },

  saveSettings: async () => {
    try {
      const state = get();
      const toSave = {
        userProfile: state.userProfile,
        visibilityMode: state.visibilityMode,
        theme: state.theme,
        language: state.language,
        batterySaver: state.batterySaver,
        addToGallery: state.addToGallery,
        autoOrganize: state.autoOrganize,
        saveLocation: state.saveLocation,
      };
      await AsyncStorage.setItem('dropPingSettings', JSON.stringify(toSave));
    } catch (e) {
      console.log('Save settings error:', e);
    }
  },
}));
