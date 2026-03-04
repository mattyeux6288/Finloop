import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string; displayName: string } | null;
  isAuthenticated: boolean;
  login: (user: { id: string; email: string; displayName: string }, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: { id: string; email: string; displayName: string }) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
