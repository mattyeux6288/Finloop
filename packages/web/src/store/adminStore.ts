import { create } from 'zustand';
import type { AdminUser } from '@finthesis/shared';

interface AdminState {
  users: AdminUser[];
  loading: boolean;
  setUsers: (users: AdminUser[]) => void;
  addUser: (user: AdminUser) => void;
  updateUserInStore: (updated: AdminUser) => void;
  removeUser: (userId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  loading: false,

  setUsers: (users) => set({ users }),

  addUser: (user) =>
    set((state) => ({ users: [user, ...state.users] })),

  updateUserInStore: (updated) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === updated.id ? updated : u)),
    })),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  setLoading: (loading) => set({ loading }),
}));
