import { create } from 'zustand';
import { ApiError } from '@/services/apiClient';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '@/services/authService';

export type AuthStatus = 'unknown' | 'guest' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,
  refresh: async () => {
    try {
      const user = await getCurrentUser();
      set({ status: 'authenticated', user });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        set({ status: 'guest', user: null });
        return;
      }
      set({ status: 'guest', user: null });
    }
  },
  login: async (payload) => {
    const user = await loginRequest(payload);
    set({ status: 'authenticated', user });
  },
  register: async (payload) => {
    const user = await registerRequest(payload);
    set({ status: 'authenticated', user });
  },
  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Cookie may already be gone.
    }
    set({ status: 'guest', user: null });
  },
}));
