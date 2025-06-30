import axios, { AxiosResponse } from 'axios';
import { 
  LoginCredentials, 
  SignupCredentials, 
  LoginResponse,
  SignupResponse,
  ChatResponse,
  Document,
  DocumentUploadResponse,
  User,
  AdminUserUpdateData,
  PasswordUpdateData,
  SystemStatsResponse,
  Chat
} from '../types';
import { 
  mockAuthApi, 
  mockChatApi, 
  mockDocumentApi, 
  mockAdminApi 
} from './mockApi';

const API_BASE_URL = '/api';

// Check if we're in development mode and should use mock API
const USE_MOCK_API = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ongc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ongc_token');
      localStorage.removeItem('ongc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API implementations - use mock in development, real API in production
export const authApi = {
  login: USE_MOCK_API 
    ? mockAuthApi.login 
    : (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> => 
        api.post('/auth/login', credentials),
  
  signup: USE_MOCK_API 
    ? mockAuthApi.signup 
    : (credentials: SignupCredentials): Promise<AxiosResponse<SignupResponse>> => 
        api.post('/auth/signup', credentials),
};

export const chatApi = {
  sendMessage: USE_MOCK_API 
    ? mockChatApi.sendMessage 
    : (message: string, chatId?: string): Promise<AxiosResponse<ChatResponse>> => 
        api.post('/chat', { message, chatId }),
  
  getMyChats: USE_MOCK_API 
    ? mockChatApi.getMyChats 
    : (): Promise<AxiosResponse<Chat[]>> => api.get('/my-chats'),
  
  getChatHistory: USE_MOCK_API 
    ? mockChatApi.getChatHistory 
    : (chatId: string): Promise<AxiosResponse<Chat>> => api.get(`/chats/${chatId}`),
};

export const documentApi = {
  upload: USE_MOCK_API 
    ? mockDocumentApi.upload 
    : (formData: FormData): Promise<AxiosResponse<DocumentUploadResponse>> => 
        api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
  
  getMyDocs: USE_MOCK_API 
    ? mockDocumentApi.getMyDocs 
    : (): Promise<AxiosResponse<Document[]>> => api.get('/my-docs'),
  
  getAllDocs: USE_MOCK_API 
    ? mockDocumentApi.getAllDocs 
    : (): Promise<AxiosResponse<Document[]>> => api.get('/all-docs'),
  
  deleteDoc: USE_MOCK_API 
    ? mockDocumentApi.deleteDoc 
    : (docId: string): Promise<AxiosResponse<{ message: string }>> => 
        api.delete(`/docs/${docId}`),

  downloadDoc: USE_MOCK_API 
    ? mockDocumentApi.downloadDoc 
    : (docId: string): Promise<AxiosResponse<Blob>> => 
        api.get(`/docs/${docId}/download`, { responseType: 'blob' }),
};

export const adminApi = {
  getUsers: USE_MOCK_API 
    ? mockAdminApi.getUsers 
    : (): Promise<AxiosResponse<User[]>> => api.get('/users'),
  
  getUserChats: USE_MOCK_API 
    ? mockAdminApi.getUserChats 
    : (userId: string): Promise<AxiosResponse<Chat[]>> => api.get(`/user-chats/${userId}`),
  
  getUserDocs: USE_MOCK_API 
    ? mockAdminApi.getUserDocs 
    : (userId: string): Promise<AxiosResponse<Document[]>> => api.get(`/user-docs/${userId}`),

  updateUser: USE_MOCK_API 
    ? mockAdminApi.updateUser 
    : (userId: string, userData: AdminUserUpdateData): Promise<AxiosResponse<User>> => 
        api.put(`/users/${userId}`, userData),

  changeUserPassword: USE_MOCK_API 
    ? mockAdminApi.changeUserPassword 
    : (userId: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> => 
        api.put(`/users/${userId}/password`, { password: newPassword }),

  getSystemStats: USE_MOCK_API 
    ? mockAdminApi.getSystemStats 
    : (): Promise<AxiosResponse<SystemStatsResponse>> => api.get('/admin/stats'),
};

export default api;