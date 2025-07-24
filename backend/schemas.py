from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    role: str

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    createdAt: str
    
    class Config:
        from_attributes = True

class AdminUserResponse(UserResponse):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

# Document schemas
class DocumentBase(BaseModel):
    fileName: str
    fileType: str
    fileSize: int

class DocumentResponse(DocumentBase):
    id: int
    uploadedBy: str
    uploadedAt: str
    status: str
    
    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    text: str
    sender: str

class MessageCreate(BaseModel):
    message: str
    chatId: Optional[int] = None

class MessageResponse(MessageBase):
    id: int
    timestamp: str
    sources: Optional[List[dict]] = []
    
    class Config:
        from_attributes = True

# Chat schemas
class ChatBase(BaseModel):
    title: str

class ChatResponse(ChatBase):
    id: int
    userId: int
    messages: List[MessageResponse]
    createdAt: str
    updatedAt: str
    
    class Config:
        from_attributes = True

# Source document schema
class SourceDocument(BaseModel):
    title: str
    snippet: str
    fileName: str
    fileUrl: str

# System stats schema
class SystemStatsResponse(BaseModel):
    totalUsers: int
    totalDocuments: int
    totalChats: int
    apiResponseTime: str
    documentProcessing: str
    storageUsage: int
    activeSessions: int
    systemStatus: str
    recentActivity: List[Dict[str, Any]]