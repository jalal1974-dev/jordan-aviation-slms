import { create } from 'zustand';
import type { SickLeave, UploadedDocument } from '../types';
import { mockSickLeaves, getUserLeaves } from '../services/mockData';

interface LeaveState {
  leaves: SickLeave[];
  currentLeave: SickLeave | null;
  uploadedDocuments: UploadedDocument[];
  submitLeaveStep: number;
  extractedData: Partial<SickLeave>;
  setLeaves: (leaves: SickLeave[]) => void;
  setCurrentLeave: (leave: SickLeave | null) => void;
  loadUserLeaves: (userId: string) => void;
  setUploadedDocuments: (documents: UploadedDocument[]) => void;
  addUploadedDocument: (document: UploadedDocument) => void;
  removeUploadedDocument: (id: string) => void;
  setSubmitLeaveStep: (step: number) => void;
  setExtractedData: (data: Partial<SickLeave>) => void;
  resetSubmitLeave: () => void;
  submitLeave: (leave: Partial<SickLeave>) => Promise<string>;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  leaves: [],
  currentLeave: null,
  uploadedDocuments: [],
  submitLeaveStep: 0,
  extractedData: {},
  setLeaves: (leaves) => set({ leaves }),
  setCurrentLeave: (leave) => set({ currentLeave: leave }),
  loadUserLeaves: (userId) => {
    const userLeaves = getUserLeaves(userId);
    set({ leaves: userLeaves });
  },
  setUploadedDocuments: (documents) => set({ uploadedDocuments: documents }),
  addUploadedDocument: (document) =>
    set((state) => ({
      uploadedDocuments: [...state.uploadedDocuments, document],
    })),
  removeUploadedDocument: (id) =>
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.filter((doc) => doc.id !== id),
    })),
  setSubmitLeaveStep: (step) => set({ submitLeaveStep: step }),
  setExtractedData: (data) =>
    set((state) => ({
      extractedData: { ...state.extractedData, ...data },
    })),
  resetSubmitLeave: () =>
    set({
      uploadedDocuments: [],
      submitLeaveStep: 0,
      extractedData: {},
    }),
  submitLeave: async (leave) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const refNumber = `SL-2024-${String(Math.floor(Math.random() * 1000)).padStart(5, '0')}`;
    return refNumber;
  },
}));
