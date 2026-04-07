import { create } from 'zustand';
import type { Notification } from '../types';
import { getUserNotifications } from '../services/mockData';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: (userId: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loadNotifications: (userId) => {
    const userNotifications = getUserNotifications(userId);
    const unreadCount = userNotifications.filter((n) => !n.read).length;
    set({ notifications: userNotifications, unreadCount });
  },
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
}));
