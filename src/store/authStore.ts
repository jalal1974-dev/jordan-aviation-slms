import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { mockUsers } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        if (password !== 'Test1234') {
          return false;
        }

        const user = mockUsers.find((u) => u.email === email || u.employeeNumber === email);

        if (user) {
          set({ user, isAuthenticated: true });
          return true;
        }

        return false;
      },
      register: async (data: Partial<User>) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'slms-auth',
    }
  )
);
