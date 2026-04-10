import { create } from 'zustand';
import { authAPI } from '../services/api';
import type { UserRole } from '../types';

export interface AuthUser {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  role: UserRole;
  employeeNumber: string;
  jobTitle?: string;
  phone?: string;
  avatar?: string;
  sickLeaveBalance?: number;
  sickLeaveTotal?: number;
  department: {
    id: string;
    nameEn: string;
    nameAr: string;
    code: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  register: (data: { email: string; nameEn: string; nameAr: string }) => Promise<void>;
}

const normalizeUser = (raw: Record<string, unknown>): AuthUser => ({
  id: String(raw.id ?? raw._id ?? ''),
  nameEn: String(raw.nameEn ?? raw.name ?? ''),
  nameAr: String(raw.nameAr ?? raw.name ?? ''),
  email: String(raw.email ?? ''),
  role: (raw.role as UserRole) ?? 'EMPLOYEE',
  employeeNumber: String(raw.employeeNumber ?? raw.employee_number ?? ''),
  jobTitle: String(raw.jobTitle ?? raw.job_title ?? raw.title ?? ''),
  phone: raw.phone ? String(raw.phone) : undefined,
  avatar: raw.avatar ? String(raw.avatar) : undefined,
  sickLeaveBalance: typeof raw.sickLeaveBalance === 'number' ? raw.sickLeaveBalance : (typeof raw.sick_leave_balance === 'number' ? raw.sick_leave_balance : 8),
  sickLeaveTotal: typeof raw.sickLeaveTotal === 'number' ? raw.sickLeaveTotal : (typeof raw.sick_leave_total === 'number' ? raw.sick_leave_total : 14),
  department: (raw.department as AuthUser['department']) ?? { id: '', nameEn: 'Jordan Aviation', nameAr: 'أردنيا', code: 'JA' },
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('slms_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      const normalized = normalizeUser(user as Record<string, unknown>);
      localStorage.setItem('slms_token', token);
      localStorage.setItem('slms_user', JSON.stringify(normalized));
      set({ user: normalized, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('slms_token');
    localStorage.removeItem('slms_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('slms_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const response = await authAPI.getMe();
      const raw = response.data?.user ?? response.data?.data ?? response.data;
      const user = normalizeUser(raw as Record<string, unknown>);
      localStorage.setItem('slms_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('slms_token');
      localStorage.removeItem('slms_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  register: async (_data: { email: string; nameEn: string; nameAr: string }) => {
    // Registration is handled server-side; this is a placeholder stub
  },
}));
