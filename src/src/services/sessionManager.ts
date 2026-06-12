import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { STORAGE_KEYS } from '@/src/constants';

type SessionClearHandler = () => void;

let clearSessionHandler: SessionClearHandler | null = null;

export const registerSessionClearHandler = (handler: SessionClearHandler) => {
  clearSessionHandler = handler;
};

export const clearStoredSession = async () => {
  await AsyncStorage.removeItem('school-mis-auth-store');
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  await AsyncStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
};

export const forceLogoutAndRedirect = async () => {
  try {
    clearSessionHandler?.();
    await clearStoredSession();
  } finally {
    router.replace('/');
  }
};