# ONGC RAG Assistant Backend with DeepSeek Integration

FastAPI backend for ONGC's internal RAG-based LLM assistant, now powered by DeepSeek AI.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Upload, store, and manage documents (PDF, DOCX, TXT)
- **RAG Integration**: Retrieval-Augmented Generation using uploaded documents
- **DeepSeek AI**: Powered by DeepSeek's advanced language model
- **Chat Interface**: RESTful API for chat interactions with context-aware responses
- **Admin Panel**: Administrative endpoints for user and document management
- **Database**: SQLite database with SQLAlchemy ORM

## New DeepSeek Integration

This version replaces the mock AI responses with actual DeepSeek API integration:

- **Real AI Responses**: Uses DeepSeek's language model for intelligent responses
- **Context-Aware**: Integrates with RAG system to provide document-based answers
- **ONGC-Specific**: Customized system prompts for ONGC operations and safety
- **Scalable**: Async HTTP client for efficient API calls

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

**Required DeepSeek Configuration:**
```env
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7
```

**Other Configuration:**
- Change `SECRET_KEY` to a secure random string
- Adjust database URL if needed
- Configure RAG settings as required

### 3. Get DeepSeek API Key

1. Visit [DeepSeek's website](https://www.deepseek.com/) and create an account
2. Navigate to the API section and generate an API key
3. Add the API key to your `.env` file

### 4. Test DeepSeek Integration

Run the setup script to test your configuration:

```bash
python setup_deepseek.py
```

This will:
- Check your environment configuration
- Test the DeepSeek API connection
- Verify the integration is working

### 5. Initialize Database

Create the initial admin user:

```bash
python init_admin.py
```

This creates an admin user with:
- Username: `admin`
- Password: `admin123`
- Email: `admin@ongc.com`

**Important**: Change the admin password after first login!

### 6. Run the Server

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

## DeepSeek Integration Details

### Architecture

1. **DeepSeek Client** (`deepseek_client.py`):
   - Async HTTP client for DeepSeek API
   - Message formatting and response handling
   - Error handling and retry logic

2. **RAG Service** (`rag_service.py`):
   - Document processing and text extraction
   - Context retrieval from user documents
   - Chunk management for large documents

3. **Enhanced Chat Endpoint**:
   - Retrieves relevant context from user's documents
   - Sends context + user query to DeepSeek
   - Returns AI response with source citations

### API Flow

1. User sends a message via `/api/chat`
2. System retrieves relevant context from user's uploaded documents
3. Context + user message sent to DeepSeek API
4. DeepSeek generates contextually-aware response
5. Response returned to user with source document citations

### Configuration Options

```env
# DeepSeek Model Configuration
DEEPSEEK_MODEL=deepseek-chat          # Model to use
DEEPSEEK_MAX_TOKENS=4000              # Maximum response length
DEEPSEEK_TEMPERATURE=0.7              # Response creativity (0.0-1.0)

# RAG Configuration
CHUNK_SIZE=1000                       # Document chunk size
CHUNK_OVERLAP=200                     # Overlap between chunks
MAX_CONTEXT_LENGTH=8000               # Maximum context sent to AI
```

## Enhanced Features

### Document Processing

- **Background Processing**: Documents are processed asynchronously after upload
- **Text Extraction**: Supports PDF, DOCX, and TXT files
- **Chunking**: Large documents are split into manageable chunks
- **Status Tracking**: Real-time status updates (processing/completed/failed)

### Context Retrieval

- **Keyword Matching**: Simple keyword-based document retrieval
- **Relevance Scoring**: Documents ranked by query relevance
- **Source Citations**: AI responses include source document references
- **User Isolation**: Users only access their own documents

### Error Handling

- **Graceful Degradation**: Fallback responses when DeepSeek is unavailable
- **Retry Logic**: Automatic retry for transient failures
- **Logging**: Comprehensive logging for debugging
- **Health Checks**: API health monitoring including DeepSeek status

## Production Considerations

### Security

1. **API Key Management**: Store DeepSeek API key securely
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Use HTTPS in production

### Performance

1. **Connection Pooling**: HTTP client uses connection pooling
2. **Async Processing**: All AI calls are asynchronous
3. **Caching**: Consider caching frequent queries
4. **Database Optimization**: Use PostgreSQL for production

### Monitoring

1. **API Usage**: Monitor DeepSeek API usage and costs
2. **Response Times**: Track AI response latencies
3. **Error Rates**: Monitor API failure rates
4. **Resource Usage**: Monitor server resources

### Scaling

1. **Load Balancing**: Use multiple backend instances
2. **Database**: Migrate to PostgreSQL or similar
3. **File Storage**: Use cloud storage for documents
4. **Vector Database**: Implement proper vector search (Pinecone, Chroma, etc.)

## Advanced RAG Implementation

For production use, consider upgrading to:

1. **Vector Embeddings**: Use sentence transformers for semantic search
2. **Vector Database**: Implement Chroma, Pinecone, or Weaviate
3. **Advanced Chunking**: Use semantic chunking strategies
4. **Reranking**: Implement reranking for better context selection
5. **Hybrid Search**: Combine keyword and semantic search

## Troubleshooting

### Common Issues

1. **DeepSeek API Key Invalid**:
   - Verify your API key is correct
   - Check if your account has sufficient credits

2. **Connection Errors**:
   - Verify internet connectivity
   - Check if DeepSeek API is accessible from your network

3. **Document Processing Fails**:
   - Check file permissions in upload directory
   - Verify file types are supported

4. **Slow Responses**:
   - Check DeepSeek API response times
   - Consider reducing context length

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Check

Check system health:

```bash
curl http://localhost:8000/api/health
```

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify your DeepSeek API configuration
3. Test the connection using `setup_deepseek.py`
4. Refer to DeepSeek's API documentation

## License

This project is for internal ONGC use only.