import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  needsPasswordSetup: boolean;
  setupEmail: string | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setNeedsPasswordSetup: (email: string) => void;
  clearPasswordSetup: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  needsPasswordSetup: false,
  setupEmail: null,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true, needsPasswordSetup: false, setupEmail: null });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, needsPasswordSetup: false, setupEmail: null });
  },

  setUser: (user) => set({ user }),

  setNeedsPasswordSetup: (email) => set({ needsPasswordSetup: true, setupEmail: email }),
  clearPasswordSetup: () => set({ needsPasswordSetup: false, setupEmail: null }),
}));
