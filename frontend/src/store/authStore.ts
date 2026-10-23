import { create } from 'zustand';
import { queryClient } from '@/app/queryClient';
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

function applyUser(user: AuthUser): Pick<AuthState, 'status' | 'user'> {
  return {
    status: user.isGuest ? 'guest' : 'authenticated',
    user,
  };
}

function clearAccountQueries(): void {
  void queryClient.removeQueries({ queryKey: ['profile'] });
  void queryClient.removeQueries({ queryKey: ['preferences'] });
  void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,
  refresh: async () => {
    try {
      const user = await getCurrentUser();
      set(applyUser(user));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        set({ status: 'guest', user: null });
        clearAccountQueries();
        return;
      }
      set({ status: 'guest', user: null });
    }
  },
  login: async (payload) => {
    const user = await loginRequest(payload);
    set(applyUser(user));
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    void queryClient.invalidateQueries({ queryKey: ['preferences'] });
    void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  },
  register: async (payload) => {
    const user = await registerRequest(payload);
    set(applyUser(user));
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    void queryClient.invalidateQueries({ queryKey: ['preferences'] });
    void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  },
  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Cookie may already be gone.
    }
    set({ status: 'guest', user: null });
    clearAccountQueries();
  },
}));
