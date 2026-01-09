import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'LOJA';
  plan?: string;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    maxContacts: number;
    maxFlows: number;
    maxMessagesPerMonth: number;
    currentContacts: number;
    currentFlows: number;
    currentMessagesThisMonth: number;
  };
  // Settings fields
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  phone?: string;
  emailNotifications?: any;
  whatsappNotifications?: any;
  twoFactorEnabled?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('thumdra-token', token);
          localStorage.setItem('thumdra-user', JSON.stringify(user));
        }
      },

      setUser: (user) => {
        set({ user });
        if (typeof window !== 'undefined') {
          localStorage.setItem('thumdra-user', JSON.stringify(user));
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('thumdra-token');
          localStorage.removeItem('thumdra-user');
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          if (typeof window !== 'undefined') {
            localStorage.setItem('thumdra-user', JSON.stringify(updatedUser));
          }
        }
      },
    }),
    {
      name: 'thumdra-auth-storage',
    }
  )
);
