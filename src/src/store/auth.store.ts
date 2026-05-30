import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiService } from '@/api/client';
import { LoginCredentials, User, UserRole,OTPLoginCredentials } from '@/src/types';

interface AuthState {
  user: User | null;
  _id : string;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  willExpire: number | null;
  login: (credentials: OTPLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (payload: { user: User; accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
}

const normalizeRole = (role: User['role']): UserRole => {
  if (typeof role === 'string') {
    return role;
  }
  return role.role;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      _id : '',
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      willExpire: 0,

      setAuth: ({ user, accessToken, refreshToken }) => {
        console.log('Setting auth state with user:', user);
        set({
          user: {
            ...user,
            role: normalizeRole(user.role),
          },
          _id: user._id || '',

          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          willExpire: 0,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          willExpire: 0,
          isLoading: false,
        });
        // Remove legacy keys too
        try {
          AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        } catch (e) {
          // ignore
        }
      },

      login: async ({ token, code }) => {
        set({ isLoading: true });
        try {
          const response = await apiService.verifyOtp(token, code);
          if (!response.success || !response.data) {
            throw new Error(response.msg || 'Login failed');
          }

          const data = response.data;
          const user: User = {
            _id: data._id || '',
            name: data.name,
            email: data.email,
            phone: data.user?.phone,
            role: data.role?.role || 'admin',
            image: data.user?.image,
            school: data.school,
            willExpire: Date.now() + 60 * 60 * 1000, // Example: token expires in 60 minutes
          };

          set({
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            willExpire: Date.now() + 60 * 60 * 1000,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        try {
          if (currentRefreshToken) {
            await apiService.logout(currentRefreshToken);
          }
        } catch {
          // Ignore logout API errors and clear local session anyway.
          console.warn('Logout API call failed, clearing local session anyway.');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          willExpire: 0,
        });
      },
    }),
    {
      name: 'school-mis-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        willExpire: state.willExpire,
      }),
    },
  ),
);
