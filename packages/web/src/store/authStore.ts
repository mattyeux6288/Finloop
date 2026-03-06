import { create } from 'zustand';
import { supabase } from '@/config/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

function userFromSession(session: Session): AuthUser {
  const u = session.user;
  return {
    id: u.id,
    email: u.email!,
    displayName: u.user_metadata?.display_name || u.email!.split('@')[0],
    role: u.app_metadata?.role || 'user',
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,

  setSession: (session) => {
    if (session) {
      set({
        session,
        user: userFromSession(session),
        isAuthenticated: true,
      });
    } else {
      set({ session: null, user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },

  setLoading: (loading) => set({ loading }),
}));
