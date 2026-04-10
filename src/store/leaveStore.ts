import { create } from 'zustand';
import { leavesAPI } from '../services/api';
import type { SickLeave, UploadedDocument } from '../types';

interface LeaveState {
  leaves: SickLeave[];
  currentLeave: SickLeave | null;
  uploadedDocuments: UploadedDocument[];
  submitLeaveStep: number;
  extractedData: Partial<SickLeave>;
  isLoading: boolean;
  setLeaves: (leaves: SickLeave[]) => void;
  setCurrentLeave: (leave: SickLeave | null) => void;
  loadUserLeaves: (userId?: string) => Promise<void>;
  loadLeaveById: (id: string) => Promise<SickLeave | null>;
  setUploadedDocuments: (documents: UploadedDocument[]) => void;
  addUploadedDocument: (document: UploadedDocument) => void;
  removeUploadedDocument: (id: string) => void;
  setSubmitLeaveStep: (step: number) => void;
  setExtractedData: (data: Partial<SickLeave>) => void;
  resetSubmitLeave: () => void;
  submitLeave: (leave: Partial<SickLeave>) => Promise<string>;
}

const normalizeLeave = (raw: Record<string, unknown>): SickLeave =>
  raw as unknown as SickLeave;

export const useLeaveStore = create<LeaveState>((set) => ({
  leaves: [],
  currentLeave: null,
  uploadedDocuments: [],
  submitLeaveStep: 0,
  extractedData: {},
  isLoading: false,

  setLeaves: (leaves) => set({ leaves }),
  setCurrentLeave: (leave) => set({ currentLeave: leave }),

  loadUserLeaves: async () => {
    set({ isLoading: true });
    try {
      const response = await leavesAPI.getAll();
      const raw: unknown[] = response.data?.data ?? response.data?.leaves ?? response.data ?? [];
      const leaves = (Array.isArray(raw) ? raw : []).map((l) =>
        normalizeLeave(l as Record<string, unknown>)
      );
      set({ leaves, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadLeaveById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await leavesAPI.getById(id);
      const raw = response.data?.data ?? response.data?.leave ?? response.data;
      const leave = normalizeLeave(raw as Record<string, unknown>);
      set({ currentLeave: leave, isLoading: false });
      return leave;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  setUploadedDocuments: (documents) => set({ uploadedDocuments: documents }),

  addUploadedDocument: (document) =>
    set((state) => ({ uploadedDocuments: [...state.uploadedDocuments, document] })),

  removeUploadedDocument: (id) =>
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.filter((doc) => doc.id !== id),
    })),

  setSubmitLeaveStep: (step) => set({ submitLeaveStep: step }),

  setExtractedData: (data) =>
    set((state) => ({ extractedData: { ...state.extractedData, ...data } })),

  resetSubmitLeave: () =>
    set({ uploadedDocuments: [], submitLeaveStep: 0, extractedData: {} }),

  submitLeave: async (leave) => {
    try {
      const response = await leavesAPI.submit(leave);
      const refNumber: string =
        response.data?.refNumber ??
        response.data?.data?.refNumber ??
        `SL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      return refNumber;
    } catch {
      return `SL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    }
  },
}));
