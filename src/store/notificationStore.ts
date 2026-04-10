import { create } from 'zustand';
import { notificationsAPI } from '../services/api';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: (userId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationsAPI.getAll();
      const raw: unknown[] = response.data?.data ?? response.data?.notifications ?? response.data ?? [];
      const notifications = Array.isArray(raw) ? (raw as Notification[]) : [];
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
    } catch {
      // optimistic update still applied below
    }
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllRead();
    } catch {
      // optimistic update still applied below
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const count: number = response.data?.count ?? response.data?.unreadCount ?? get().unreadCount;
      set({ unreadCount: count });
    } catch {
      // keep existing count
    }
  },
}));
