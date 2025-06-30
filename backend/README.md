# ONGC RAG Assistant Backend

FastAPI backend for ONGC's internal RAG-based LLM assistant.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Upload, store, and manage documents (PDF, DOCX, TXT)
- **Chat Interface**: RESTful API for chat interactions with the AI assistant
- **Admin Panel**: Administrative endpoints for user and document management
- **Database**: SQLite database with SQLAlchemy ORM

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Change `SECRET_KEY` to a secure random string
- Adjust database URL if needed
- Configure other settings as required

### 3. Initialize Database

Create the initial admin user:

```bash
python init_admin.py
```

This creates an admin user with:
- Username: `admin`
- Password: `admin123`
- Email: `admin@ongc.com`

**Important**: Change the admin password after first login!

### 4. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Chat
- `POST /api/chat` - Send message to AI assistant
- `GET /api/my-chats` - Get user's chat history
- `GET /api/chats/{chat_id}` - Get specific chat history

### Documents
- `POST /api/upload` - Upload document
- `GET /api/my-docs` - Get user's documents
- `DELETE /api/docs/{doc_id}` - Delete document

### Admin (Admin role required)
- `GET /api/users` - Get all users
- `GET /api/user-chats/{user_id}` - Get user's chats
- `GET /api/user-docs/{user_id}` - Get user's documents

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

### Users
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `hashed_password`: Bcrypt hashed password
- `role`: User role ("user" or "admin")
- `is_active`: Account status
- `created_at`, `updated_at`: Timestamps

### Documents
- `id`: Primary key
- `fileName`: Original filename
- `fileType`: MIME type
- `fileSize`: File size in bytes
- `filePath`: Server file path
- `uploadedBy`: Username of uploader
- `status`: Processing status
- `user_id`: Foreign key to users
- `uploaded_at`: Upload timestamp

### Chats
- `id`: Primary key
- `title`: Chat title
- `user_id`: Foreign key to users
- `created_at`, `updated_at`: Timestamps

### Messages
- `id`: Primary key
- `chat_id`: Foreign key to chats
- `content`: Message content
- `sender`: "user" or "assistant"
- `created_at`: Timestamp

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **File Validation**: File type and size validation for uploads
- **CORS Protection**: Configurable CORS settings

## File Upload

Supported file types:
- PDF (application/pdf)
- Word Documents (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- Text Files (text/plain)

Maximum file size: 50MB

Files are stored in the `uploads/` directory with UUID-based filenames.

## Development

### Adding New Endpoints

1. Define the endpoint in `main.py`
2. Add corresponding Pydantic schemas in `schemas.py`
3. Update database models in `models.py` if needed
4. Add authentication/authorization as required

### Database Migrations

For production use, consider using Alembic for database migrations:

```bash
pip install alembic
alembic init alembic
```

### Testing

Add tests using pytest:

```bash
pip install pytest pytest-asyncio httpx
pytest
```

## Production Deployment

1. **Environment Variables**: Set secure environment variables
2. **Database**: Use PostgreSQL or MySQL for production
3. **File Storage**: Consider cloud storage for file uploads
4. **Security**: Enable HTTPS, set secure CORS origins
5. **Monitoring**: Add logging and monitoring
6. **Scaling**: Use gunicorn or similar WSGI server

## Integration with RAG System

The current implementation includes mock AI responses. To integrate with your actual RAG system:

1. Replace the `generate_ai_response()` function in `main.py`
2. Add your RAG model integration
3. Implement document processing for uploaded files
4. Add vector database integration for document embeddings

## Support

For issues and questions, please refer to the ONGC internal documentation or contact the development team.