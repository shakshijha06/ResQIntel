import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resqintel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      // Clear token if unauthorized on admin routes
      if (!window.location.pathname.includes('/admin/login')) {
        localStorage.removeItem('resqintel_token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- SYSTEM DIAGNOSTICS ---
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// --- AUTHENTICATION ---
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changeUserPassword = async (passwords) => {
  const response = await api.post('/auth/change-password', passwords);
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createReviewerUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const toggleUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/admin/users/${userId}/status?is_active=${isActive}`);
  return response.data;
};

// --- PUBLIC PORTAL APIS ---
export const submitPublicReport = async (reportData) => {
  const response = await api.post('/public/reports', reportData);
  return response.data;
};

export const trackPublicSubmission = async (referenceId, token) => {
  const response = await api.get(`/public/track/${referenceId}?token=${encodeURIComponent(token)}`);
  return response.data;
};

export const getPublicIncidents = async (params = {}) => {
  const response = await api.get('/public/incidents', { params });
  return response.data;
};

export const getPublicIncidentDetail = async (incidentId) => {
  const response = await api.get(`/public/incidents/${incidentId}`);
  return response.data;
};

// --- ADMIN OPERATIONS APIS ---
export const getAdminDashboardStats = async () => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

export const getAdminIncidents = async (params = {}) => {
  const response = await api.get('/admin/incidents', { params });
  return response.data;
};

export const getAdminIncidentDetail = async (incidentId) => {
  const response = await api.get(`/admin/incidents/${incidentId}`);
  return response.data;
};

export const updateAdminIncident = async (incidentId, updates) => {
  const response = await api.patch(`/admin/incidents/${incidentId}`, updates);
  return response.data;
};

export const getAdminReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const getAdminReportDetail = async (reportId) => {
  const response = await api.get(`/admin/reports/${reportId}`);
  return response.data;
};

export const getAdminReviews = async (status = null) => {
  const params = status ? { status } : {};
  const response = await api.get('/admin/reviews', { params });
  return response.data;
};

export const submitAdminReviewDecision = async (reviewId, decisionData) => {
  const response = await api.post(`/admin/reviews/${reviewId}/decision`, decisionData);
  return response.data;
};

export const testGeminiExtraction = async (reqData) => {
  const response = await api.post('/admin/ai/extract', reqData);
  return response.data;
};

export const translateReportToEnglish = async (reportId) => {
  const response = await api.post(`/admin/reports/${reportId}/translate`);
  return response.data;
};

export const getAiReviewAnalysis = async (reviewId) => {
  const response = await api.post(`/admin/reviews/${reviewId}/ai-analysis`);
  return response.data;
};

// --- NOTIFICATIONS ---
export const getAdminNotifications = async (unreadOnly = false) => {
  const response = await api.get(`/admin/notifications?unread_only=${unreadOnly}`);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/admin/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post('/admin/notifications/mark-all-read');
  return response.data;
};

// --- DATASETS & SYNTHETIC BENCHMARKS ---
export const getAdminDatasets = async () => {
  const response = await api.get('/admin/datasets');
  return response.data;
};

export const previewDatasetCsv = async (formData) => {
  const response = await api.post('/admin/datasets/preview-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const importDatasetRecords = async (payload) => {
  const response = await api.post('/admin/datasets/import', payload);
  return response.data;
};

export const deleteDataset = async (datasetId) => {
  const response = await api.delete(`/admin/datasets/${datasetId}`);
  return response.data;
};

export const getSyntheticSummary = async () => {
  const response = await api.get('/admin/synthetic-data/summary');
  return response.data;
};

export const generateSyntheticScenario = async (scenarioType) => {
  const response = await api.post('/admin/synthetic-data/generate', { scenario_type: scenarioType });
  return response.data;
};

export const resetSyntheticData = async () => {
  const response = await api.delete('/admin/synthetic-data/reset');
  return response.data;
};

// --- CONFLICTS & AUDIT LOGS ---
export const getAdminConflicts = async () => {
  const response = await api.get('/admin/conflicts');
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

export const compareReportsDynamic = async (reportIdA, reportIdB) => {
  const response = await api.post(`/admin/reconciliation/compare?report_id_a=${reportIdA}&report_id_b=${reportIdB}`);
  return response.data;
};

export default api;
