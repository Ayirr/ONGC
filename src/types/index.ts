export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  email: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  sources?: SourceDocument[];
}

export interface SourceDocument {
  title: string;
  snippet: string;
  fileUrl: string;
  fileName: string;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  userId?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface UserUpdateData {
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface SystemStats {
  totalUsers: number;
  totalDocuments: number;
  totalChats: number;
  apiResponseTime: string;
  documentProcessing: string;
  storageUsage: number;
  activeSessions: number;
  systemStatus: 'operational' | 'degraded' | 'down';
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  file?: string;
  time: string;
  type: 'upload' | 'chat' | 'login' | 'signup';
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  token: string;
  user: User;
}

export interface ChatResponse {
  chatId: string;
  message: string;
  sources?: SourceDocument[];
  timestamp?: string;
}

export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
}

// Form Types
export interface EditUserForm {
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface PasswordChangeForm {
  userId: string;
  newPassword: string;
  confirmPassword: string;
}

// Component Props Types
export interface DocumentListProps {
  showUserInfo?: boolean;
}

export interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onDownload?: (docId: string) => void;
}

// Error Types
export interface ApiError {
  response?: {
    status: number;
    data: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}

// Admin API Types
export interface AdminUserUpdateData {
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface PasswordUpdateData {
  password: string;
}

export interface SystemStatsResponse {
  totalUsers: number;
  totalDocuments: number;
  totalChats: number;
  apiResponseTime: string;
  documentProcessing: string;
  storageUsage: number;
  activeSessions: number;
  systemStatus: 'operational' | 'degraded' | 'down';
  recentActivity: ActivityItem[];
}