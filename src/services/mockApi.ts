import { AxiosResponse } from 'axios';
import { 
  LoginCredentials, 
  SignupCredentials, 
  AuthUser, 
  LoginResponse,
  SignupResponse,
  ChatResponse,
  Document,
  DocumentUploadResponse,
  User,
  AdminUserUpdateData,
  SystemStatsResponse,
  Chat
} from '../types';

// Mock database
const mockUsers: Array<AuthUser & { password: string }> = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@ongc.com',
    role: 'admin',
    password: 'admin123',
    token: '',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    username: 'john.doe',
    email: 'john.doe@ongc.com',
    role: 'user',
    password: 'password123',
    token: '',
    createdAt: '2024-02-01T14:20:00Z',
  },
  {
    id: '3',
    username: 'jane.smith',
    email: 'jane.smith@ongc.com',
    role: 'user',
    password: 'password123',
    token: '',
    createdAt: '2024-02-10T09:15:00Z',
  },
];

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'Safety Protocol Inquiry',
    userId: '2',
    messages: [
      { id: '1', text: 'What are the safety protocols for offshore drilling?', sender: 'user', timestamp: '2024-03-01T10:00:00Z' },
      { id: '2', text: 'Based on ONGC safety guidelines, offshore drilling requires...', sender: 'assistant', timestamp: '2024-03-01T10:01:00Z' }
    ],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:01:00Z'
  },
  {
    id: '2',
    title: 'Equipment Maintenance',
    userId: '3',
    messages: [
      { id: '3', text: 'How often should drilling equipment be maintained?', sender: 'user', timestamp: '2024-03-02T14:30:00Z' },
      { id: '4', text: 'According to maintenance schedules in your documents...', sender: 'assistant', timestamp: '2024-03-02T14:31:00Z' }
    ],
    createdAt: '2024-03-02T14:30:00Z',
    updatedAt: '2024-03-02T14:31:00Z'
  }
];

const mockDocuments: Document[] = [
  {
    id: '1',
    fileName: 'ONGC_Safety_Manual_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576,
    uploadedBy: 'john.doe',
    uploadedAt: '2024-02-15T09:30:00Z',
    status: 'completed',
    userId: '2'
  },
  {
    id: '2',
    fileName: 'Drilling_Operations_Guide.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1536000,
    uploadedBy: 'jane.smith',
    uploadedAt: '2024-02-20T11:45:00Z',
    status: 'completed',
    userId: '3'
  },
  {
    id: '3',
    fileName: 'Environmental_Compliance.txt',
    fileType: 'text/plain',
    fileSize: 512000,
    uploadedBy: 'admin',
    uploadedAt: '2024-02-25T16:20:00Z',
    status: 'processing',
    userId: '1'
  }
];

// Helper functions
const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockAuthApi = {
  login: async (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> => {
    await delay(500); // Simulate network delay
    
    const user = mockUsers.find(
      u => (u.email === credentials.username || u.username === credentials.username) && 
           u.password === credentials.password
    );
    
    if (!user) {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
    }
    
    const token = generateToken();
    const { password, ...userWithoutPassword } = user;
    
    return {
      data: {
        token,
        user: userWithoutPassword
      }
    } as AxiosResponse<LoginResponse>;
  },

  signup: async (credentials: SignupCredentials): Promise<AxiosResponse<SignupResponse>> => {
    await delay(500); // Simulate network delay
    
    // Check if user already exists
    const existingUser = mockUsers.find(
      u => u.email === credentials.email || u.username === credentials.username
    );
    
    if (existingUser) {
      throw {
        response: {
          status: 400,
          data: { message: 'User already exists with this email or username' }
        }
      };
    }
    
    // Create new user
    const newUser: AuthUser & { password: string } = {
      id: (mockUsers.length + 1).toString(),
      username: credentials.username,
      email: credentials.email,
      role: 'user',
      password: credentials.password,
      token: '',
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    const token = generateToken();
    const { password, ...userWithoutPassword } = newUser;
    
    return {
      data: {
        token,
        user: userWithoutPassword
      }
    } as AxiosResponse<SignupResponse>;
  },
};

export const mockChatApi = {
  sendMessage: async (message: string, chatId?: string): Promise<AxiosResponse<ChatResponse>> => {
    await delay(800); // Simulate processing time
    
    const newChatId = chatId || Date.now().toString();
    const response = `This is a mock response to: "${message}". The actual AI assistant would provide intelligent responses about ONGC operations, safety protocols, and technical queries.`;
    
    return {
      data: {
        chatId: newChatId,
        message: response,
        timestamp: new Date().toISOString(),
      }
    } as AxiosResponse<ChatResponse>;
  },

  getMyChats: async (): Promise<AxiosResponse<Chat[]>> => {
    await delay(300);
    return {
      data: mockChats
    } as AxiosResponse<Chat[]>;
  },

  getChatHistory: async (chatId: string): Promise<AxiosResponse<Chat>> => {
    await delay(300);
    const chat = mockChats.find(chat => chat.id === chatId);
    if (!chat) {
      throw {
        response: {
          status: 404,
          data: { message: 'Chat not found' }
        }
      };
    }
    return {
      data: chat
    } as AxiosResponse<Chat>;
  },
};

export const mockDocumentApi = {
  upload: async (formData: FormData): Promise<AxiosResponse<DocumentUploadResponse>> => {
    await delay(1000); // Simulate upload time
    
    const file = formData.get('file') as File;
    if (!file) {
      throw {
        response: {
          status: 400,
          data: { message: 'No file provided' }
        }
      };
    }
    
    const document: DocumentUploadResponse = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy: 'current_user',
      uploadedAt: new Date().toISOString(),
      status: 'completed'
    };
    
    mockDocuments.push({
      ...document,
      userId: 'current_user_id'
    });
    
    return {
      data: document
    } as AxiosResponse<DocumentUploadResponse>;
  },

  getMyDocs: async (): Promise<AxiosResponse<Document[]>> => {
    await delay(300);
    return {
      data: mockDocuments
    } as AxiosResponse<Document[]>;
  },

  getAllDocs: async (): Promise<AxiosResponse<Document[]>> => {
    await delay(300);
    return {
      data: mockDocuments
    } as AxiosResponse<Document[]>;
  },

  deleteDoc: async (docId: string): Promise<AxiosResponse<{ message: string }>> => {
    await delay(300);
    const index = mockDocuments.findIndex(doc => doc.id === docId);
    if (index > -1) {
      mockDocuments.splice(index, 1);
    }
    return { 
      data: { message: 'Document deleted successfully' }
    } as AxiosResponse<{ message: string }>;
  },

  downloadDoc: async (docId: string): Promise<AxiosResponse<Blob>> => {
    await delay(500);
    const doc = mockDocuments.find(d => d.id === docId);
    if (!doc) {
      throw {
        response: {
          status: 404,
          data: { message: 'Document not found' }
        }
      };
    }
    
    // Return mock blob data
    const mockContent = `Mock content for ${doc.fileName}`;
    return {
      data: new Blob([mockContent], { type: doc.fileType })
    } as AxiosResponse<Blob>;
  },
};

export const mockAdminApi = {
  getUsers: async (): Promise<AxiosResponse<User[]>> => {
    await delay(300);
    const usersWithoutPasswords = mockUsers.map(({ password, token, ...user }) => user);
    return {
      data: usersWithoutPasswords
    } as AxiosResponse<User[]>;
  },

  getUserChats: async (userId: string): Promise<AxiosResponse<Chat[]>> => {
    await delay(300);
    return {
      data: mockChats.filter(chat => chat.userId === userId)
    } as AxiosResponse<Chat[]>;
  },

  getUserDocs: async (userId: string): Promise<AxiosResponse<Document[]>> => {
    await delay(300);
    return {
      data: mockDocuments.filter(doc => doc.userId === userId)
    } as AxiosResponse<Document[]>;
  },

  updateUser: async (userId: string, userData: AdminUserUpdateData): Promise<AxiosResponse<User>> => {
    await delay(500);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
    const { password, token, ...userWithoutPassword } = mockUsers[userIndex];
    
    return {
      data: userWithoutPassword
    } as AxiosResponse<User>;
  },

  changeUserPassword: async (userId: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> => {
    await delay(500);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };
    }
    
    mockUsers[userIndex].password = newPassword;
    
    return {
      data: { message: 'Password changed successfully' }
    } as AxiosResponse<{ message: string }>;
  },

  getSystemStats: async (): Promise<AxiosResponse<SystemStatsResponse>> => {
    await delay(400);
    return {
      data: {
        totalUsers: mockUsers.length,
        totalDocuments: mockDocuments.length,
        totalChats: mockChats.length,
        apiResponseTime: '142ms',
        documentProcessing: 'Active',
        storageUsage: 68,
        activeSessions: 23,
        systemStatus: 'operational',
        recentActivity: [
          {
            id: '1',
            user: 'john.doe',
            action: 'uploaded document',
            file: 'Q4_Report.pdf',
            time: '2 hours ago',
            type: 'upload'
          },
          {
            id: '2',
            user: 'jane.smith',
            action: 'started chat session',
            time: '3 hours ago',
            type: 'chat'
          },
          {
            id: '3',
            user: 'mike.wilson',
            action: 'logged in',
            time: '4 hours ago',
            type: 'login'
          },
          {
            id: '4',
            user: 'sarah.johnson',
            action: 'signed up',
            time: '6 hours ago',
            type: 'signup'
          },
        ]
      }
    } as AxiosResponse<SystemStatsResponse>;
  },
};