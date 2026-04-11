import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://9e12b35c-cbf6-48b9-9b47-cbb15e809574-00-2of7qkpr7rqsr.janeway.replit.dev/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('slms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('slms_token');
      localStorage.removeItem('slms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: unknown) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const leavesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/leaves', { params }),
  getById: (id: string) => api.get(`/leaves/${id}`),
  submit: (data: unknown) => api.post('/leaves', data),
  updateStatus: (id: string, status: string) => api.put(`/leaves/${id}/status`, { status }),
  submitDecision: (id: string, data: unknown) => api.post(`/leaves/${id}/decision`, data),
};

export const employeesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
};

export const facilitiesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/facilities', { params }),
  create: (data: unknown) => api.post('/facilities', data),
  update: (id: string, data: unknown) => api.put(`/facilities/${id}`, data),
  toggleBlock: (id: string, data: unknown) => api.put(`/facilities/${id}/block`, data),
};

export const doctorsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/doctors', { params }),
  create: (data: unknown) => api.post('/doctors', data),
  update: (id: string, data: unknown) => api.put(`/doctors/${id}`, data),
};

export const circularsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/circulars', { params }),
  create: (data: unknown) => api.post('/circulars', data),
  update: (id: string, data: unknown) => api.put(`/circulars/${id}`, data),
  delete: (id: string) => api.delete(`/circulars/${id}`),
};

export const penaltiesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/penalties', { params }),
  apply: (data: unknown) => api.post('/penalties', data),
  revoke: (id: string) => api.put(`/penalties/${id}/revoke`),
};

export const notificationsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const reportsAPI = {
  getOverview: (params?: Record<string, unknown>) => api.get('/reports/overview', { params }),
  getByDepartment: (params?: Record<string, unknown>) => api.get('/reports/by-department', { params }),
  getByDoctor: (params?: Record<string, unknown>) => api.get('/reports/by-doctor', { params }),
  getByFacility: (params?: Record<string, unknown>) => api.get('/reports/by-facility', { params }),
  getViolations: (params?: Record<string, unknown>) => api.get('/reports/violations', { params }),
};

export default api;

export const documentsAPI = {
  upload: (data: { leaveId: string; fileName: string; fileSize: number; fileType: string; fileUrl: string; documentType?: string }) => 
    api.post('/documents', data),
  getByLeave: (leaveId: string) => api.get(`/documents/${leaveId}`),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const uploadToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dhofitcxx';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'slms_documents';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'jordan-aviation-slms');
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/' + cloudName + '/auto/upload',
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
};
