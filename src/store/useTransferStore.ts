import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransferItem } from '../types';

interface TransferStore {
  activeTransfers: TransferItem[];
  transferHistory: TransferItem[];
  addTransfer: (transfer: TransferItem) => void;
  updateTransfer: (id: string, updates: Partial<TransferItem>) => void;
  completeTransfer: (id: string) => void;
  failTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  saveHistory: () => Promise<void>;
}

export const useTransferStore = create<TransferStore>((set, get) => ({
  activeTransfers: [],
  transferHistory: [],

  addTransfer: (transfer) =>
    set((state) => ({
      activeTransfers: [...state.activeTransfers, transfer],
    })),

  updateTransfer: (id, updates) =>
    set((state) => ({
      activeTransfers: state.activeTransfers.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  completeTransfer: (id) => {
    const state = get();
    const transfer = state.activeTransfers.find((t) => t.id === id);
    if (transfer) {
      const completed = { ...transfer, status: 'complete' as const, progress: 100 };
      set((s) => ({
        activeTransfers: s.activeTransfers.filter((t) => t.id !== id),
        transferHistory: [completed, ...s.transferHistory].slice(0, 100),
      }));
      get().saveHistory();
    }
  },

  failTransfer: (id) => {
    const state = get();
    const transfer = state.activeTransfers.find((t) => t.id === id);
    if (transfer) {
      const failed = { ...transfer, status: 'failed' as const };
      set((s) => ({
        activeTransfers: s.activeTransfers.filter((t) => t.id !== id),
        transferHistory: [failed, ...s.transferHistory].slice(0, 100),
      }));
      get().saveHistory();
    }
  },

  cancelTransfer: (id) =>
    set((state) => ({
      activeTransfers: state.activeTransfers.filter((t) => t.id !== id),
    })),

  removeFromHistory: (id) =>
    set((state) => ({
      transferHistory: state.transferHistory.filter((t) => t.id !== id),
    })),

  clearHistory: () => {
    set({ transferHistory: [] });
    AsyncStorage.removeItem('dropPingHistory');
  },

  loadHistory: async () => {
    try {
      const saved = await AsyncStorage.getItem('dropPingHistory');
      if (saved) {
        const history = JSON.parse(saved).map((t: TransferItem) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
        set({ transferHistory: history });
      }
    } catch (e) {
      console.log('Load history error:', e);
    }
  },

  saveHistory: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(
        'dropPingHistory',
        JSON.stringify(state.transferHistory)
      );
    } catch (e) {
      console.log('Save history error:', e);
    }
  },
}));