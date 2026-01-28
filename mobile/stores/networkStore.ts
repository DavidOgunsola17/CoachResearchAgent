import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  initialize: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,

  initialize: () => {
    NetInfo.addEventListener((state: NetInfoState) => {
      set({ isConnected: state.isConnected ?? true });
    });
  },
}));
