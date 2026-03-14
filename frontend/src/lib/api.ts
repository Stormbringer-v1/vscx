import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password })),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
};

export const projects = {
  list: () => api.get('/projects/'),
  get: (id: number) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/projects/', data),
  update: (id: number, data: { name?: string; description?: string }) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

export const assets = {
  list: (projectId: number) => api.get('/assets/', { params: { project_id: projectId } }),
  get: (projectId: number, id: number) => api.get(`/assets/${id}`, { params: { project_id: projectId } }),
  create: (data: { name: string; asset_type: string; project_id: number; ip_address?: string; hostname?: string; url?: string; description?: string }) =>
    api.post('/assets/', data),
  update: (projectId: number, id: number, data: { name?: string; asset_type?: string; ip_address?: string; hostname?: string; url?: string; description?: string; risk_score?: number }) =>
    api.put(`/assets/${id}`, data, { params: { project_id: projectId } }),
  delete: (projectId: number, id: number) => api.delete(`/assets/${id}`, { params: { project_id: projectId } }),
};

export const scans = {
  list: (projectId: number) => api.get('/scans/', { params: { project_id: projectId } }),
  get: (projectId: number, id: number) => api.get(`/scans/${id}`, { params: { project_id: projectId } }),
  create: (data: { name: string; scan_type: string; targets: string; project_id: number }) =>
    api.post('/scans/', data),
  delete: (projectId: number, id: number) => api.delete(`/scans/${id}`, { params: { project_id: projectId } }),
  execute: (projectId: number, id: number) => api.post(`/scans/${id}/execute`, null, { params: { project_id: projectId } }),
};

export const findings = {
  list: (projectId: number, params?: { severity?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/findings/', { params: { project_id: projectId, ...params } }),
  get: (projectId: number, id: number) => api.get(`/findings/${id}`, { params: { project_id: projectId } }),
  update: (projectId: number, id: number, data: { status?: string; remediation?: string }) =>
    api.put(`/findings/${id}`, data, { params: { project_id: projectId } }),
  summary: (projectId: number) => api.get('/findings/stats/summary', { params: { project_id: projectId } }),
};

export const vulnerabilities = {
  list: (params?: { severity?: string; limit?: number; offset?: number }) =>
    api.get('/vulnerabilities/', { params }),
  get: (cveId: string) => api.get(`/vulnerabilities/${cveId}`),
  enrich: (cveId: string) => api.get(`/vulnerabilities/enrich/${cveId}`),
};
