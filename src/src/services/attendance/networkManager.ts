import NetInfo from '@react-native-community/netinfo';

import { startAttendanceSync } from './attendanceSyncWorker';

let unsubscribeNetworkListener: (() => void) | null = null;

export const configureAttendanceNetworkListener = () => {
  if (unsubscribeNetworkListener) {
    return;
  }

  unsubscribeNetworkListener = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void startAttendanceSync();
    }
  });
};

export const teardownAttendanceNetworkListener = () => {
  unsubscribeNetworkListener?.();
  unsubscribeNetworkListener = null;
};