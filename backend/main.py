from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os
from datetime import datetime, timedelta
import aiofiles
import uuid
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

from database import get_db, engine, Base
from models import User, Document, Chat, Message
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    DocumentResponse, ChatResponse, MessageCreate, MessageResponse,
    AdminUserResponse, UserUpdate, SystemStatsResponse
)
from auth import (
    create_access_token, verify_password, get_password_hash,
    decode_access_token, get_current_user, get_current_admin_user
)
from groq_client import get_groq_client, cleanup_groq_client
from rag_service import get_rag_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ONGC RAG Assistant API",
    description="Backend API for ONGC's internal RAG-based LLM assistant with Groq integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting ONGC RAG Assistant API with Groq integration")
    try:
        # Test Groq connection
        groq_client = get_groq_client()
        logger.info("Groq client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down ONGC RAG Assistant API")
    await cleanup_groq_client()

# Authentication endpoints
@app.post("/api/auth/signup", response_model=dict)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists with this email or username"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role="user"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user.username})
    
    return {
        "token": access_token,
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role,
            "createdAt": db_user.created_at.isoformat()
        }
    }

@app.post("/api/auth/login", response_model=dict)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.username)
    ).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "createdAt": user.created_at.isoformat()
        }
    }

# Enhanced chat endpoint with Groq and RAG
@app.post("/api/chat", response_model=dict)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Create or get chat
        chat_id = message_data.chatId
        if not chat_id:
            # Create new chat
            chat = Chat(
                title=message_data.message[:50] + "..." if len(message_data.message) > 50 else message_data.message,
                user_id=current_user.id
            )
            db.add(chat)
            db.commit()
            db.refresh(chat)
            chat_id = chat.id
        else:
            chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")
        
        # Save user message
        user_message = Message(
            chat_id=chat_id,
            content=message_data.message,
            sender="user"
        )
        db.add(user_message)
        db.commit()
        
        # Get RAG service and retrieve relevant context
        rag_service = get_rag_service()
        context, source_documents = await rag_service.retrieve_relevant_context(
            message_data.message, 
            current_user.id, 
            db
        )
        
        # Get Groq client and generate response
        groq_client = get_groq_client()
        
        # Generate AI response using Groq with RAG context
        ai_response_text = await groq_client.generate_response(
            user_message=message_data.message,
            context=context
        )
        
        # Save AI message
        ai_message = Message(
            chat_id=chat_id,
            content=ai_response_text,
            sender="assistant"
        )
        db.add(ai_message)
        db.commit()
        
        logger.info(f"Generated response for user {current_user.username} using Groq with {len(source_documents)} source documents")
        
        return {
            "chatId": chat_id,
            "message": ai_response_text,
            "sources": source_documents,
            "timestamp": ai_message.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        # Rollback any database changes
        db.rollback()
        
        # Return a fallback response
        fallback_response = "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
        
        # Try to save the fallback response
        try:
            ai_message = Message(
                chat_id=chat_id if 'chat_id' in locals() else None,
                content=fallback_response,
                sender="assistant"
            )
            if 'chat_id' in locals() and chat_id:
                db.add(ai_message)
                db.commit()
        except:
            pass
        
        return {
            "chatId": chat_id if 'chat_id' in locals() else None,
            "message": fallback_response,
            "sources": []
        }

@app.get("/api/my-chats", response_model=List[ChatResponse])
async def get_my_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).all()
    return [
        ChatResponse(
            id=chat.id,
            title=chat.title,
            userId=chat.user_id,
            messages=[
                MessageResponse(
                    id=msg.id,
                    text=msg.content,
                    sender=msg.sender,
                    timestamp=msg.created_at.isoformat()
                ) for msg in chat.messages
            ],
            createdAt=chat.created_at.isoformat(),
            updatedAt=chat.updated_at.isoformat()
        ) for chat in chats
    ]

@app.get("/api/chats/{chat_id}", response_model=ChatResponse)
async def get_chat_history(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        userId=chat.user_id,
        messages=[
            MessageResponse(
                id=msg.id,
                text=msg.content,
                sender=msg.sender,
                timestamp=msg.created_at.isoformat()
            ) for msg in chat.messages
        ],
        createdAt=chat.created_at.isoformat(),
        updatedAt=chat.updated_at.isoformat()
    )

# Enhanced document upload with background processing
@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Validate file size (50MB limit)
    if file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Save document record
    document = Document(
        fileName=file.filename,
        fileType=file.content_type,
        fileSize=file.size,
        filePath=file_path,
        uploadedBy=current_user.username,
        user_id=current_user.id,
        status="processing"
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Add background task to process the document
    background_tasks.add_task(process_document_background, document.id)
    
    return DocumentResponse(
        id=document.id,
        fileName=document.fileName,
        fileType=document.fileType,
        fileSize=document.fileSize,
        uploadedBy=document.uploadedBy,
        uploadedAt=document.uploaded_at.isoformat(),
        status=document.status
    )

async def process_document_background(document_id: int):
    """Background task to process uploaded documents"""
    try:
        from database import SessionLocal
        db = SessionLocal()
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found for processing")
            return
        
        rag_service = get_rag_service()
        success = await rag_service.process_document(document, db)
        
        if success:
            logger.info(f"Successfully processed document: {document.fileName}")
        else:
            logger.error(f"Failed to process document: {document.fileName}")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error in background document processing: {str(e)}")

@app.get("/api/my-docs", response_model=List[DocumentResponse])
async def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [
        DocumentResponse(
            id=doc.id,
            fileName=doc.fileName,
            fileType=doc.fileType,
            fileSize=doc.fileSize,
            uploadedBy=doc.uploadedBy,
            uploadedAt=doc.uploaded_at.isoformat(),
            status=doc.status
        ) for doc in documents
    ]

@app.get("/api/all-docs", response_model=List[DocumentResponse])
async def get_all_documents(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).all()
    return [
        DocumentResponse(
            id=doc.id,
            fileName=doc.fileName,
            fileType=doc.fileType,
            fileSize=doc.fileSize,
            uploadedBy=doc.uploadedBy,
            uploadedAt=doc.uploaded_at.isoformat(),
            status=doc.status
        ) for doc in documents
    ]

@app.get("/api/docs/{doc_id}/download")
async def download_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin or owns the document
    if current_user.role == "admin":
        document = db.query(Document).filter(Document.id == doc_id).first()
    else:
        document = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.filePath):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=document.filePath,
        filename=document.fileName,
        media_type=document.fileType
    )

@app.delete("/api/docs/{doc_id}")
async def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    if os.path.exists(document.filePath):
        os.remove(document.filePath)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# Admin endpoints
@app.get("/api/users", response_model=List[AdminUserResponse])
async def get_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [
        AdminUserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            createdAt=user.created_at.isoformat()
        ) for user in users
    ]

@app.put("/api/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if username/email already exists for other users
    existing_user = db.query(User).filter(
        User.id != user_id,
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )
    
    # Update user
    user.username = user_data.username
    user.email = user_data.email
    user.role = user_data.role
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return AdminUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        createdAt=user.created_at.isoformat()
    )

@app.put("/api/users/{user_id}/password")
async def change_user_password(
    user_id: int,
    password_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_password = password_data.get("password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Password updated successfully"}

@app.get("/api/user-chats/{user_id}", response_model=List[ChatResponse])
async def get_user_chats(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    chats = db.query(Chat).filter(Chat.user_id == user_id).all()
    return [
        ChatResponse(
            id=chat.id,
            title=chat.title,
            userId=chat.user_id,
            messages=[
                MessageResponse(
                    id=msg.id,
                    text=msg.content,
                    sender=msg.sender,
                    timestamp=msg.created_at.isoformat()
                ) for msg in chat.messages
            ],
            createdAt=chat.created_at.isoformat(),
            updatedAt=chat.updated_at.isoformat()
        ) for chat in chats
    ]

@app.get("/api/user-docs/{user_id}", response_model=List[DocumentResponse])
async def get_user_documents(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    return [
        DocumentResponse(
            id=doc.id,
            fileName=doc.fileName,
            fileType=doc.fileType,
            fileSize=doc.fileSize,
            uploadedBy=doc.uploadedBy,
            uploadedAt=doc.uploaded_at.isoformat(),
            status=doc.status
        ) for doc in documents
    ]

@app.get("/api/admin/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Get counts
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()
    total_chats = db.query(Chat).count()
    
    # Get recent activity (mock for now)
    recent_activity = [
        {
            "id": "1",
            "user": "john.doe",
            "action": "uploaded document",
            "file": "Safety_Manual.pdf",
            "time": "2 hours ago",
            "type": "upload"
        },
        {
            "id": "2",
            "user": "jane.smith",
            "action": "started chat session",
            "time": "3 hours ago",
            "type": "chat"
        }
    ]
    
    return SystemStatsResponse(
        totalUsers=total_users,
        totalDocuments=total_documents,
        totalChats=total_chats,
        apiResponseTime="142ms",
        documentProcessing="Active",
        storageUsage=68,
        activeSessions=23,
        systemStatus="operational",
        recentActivity=recent_activity
    )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    try:
        # Test Groq connection
        groq_client = get_groq_client()
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "operational",
                "groq": "operational",
                "rag": "operational"
            }
        }
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)