# ONGC RAG Assistant Backend with Groq Integration

FastAPI backend for ONGC's internal RAG-based LLM assistant, now powered by Groq AI for ultra-fast inference.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Upload, store, and manage documents (PDF, DOCX, TXT)
- **RAG Integration**: Retrieval-Augmented Generation using uploaded documents
- **Groq AI**: Powered by Groq's lightning-fast language model inference
- **Chat Interface**: RESTful API for chat interactions with context-aware responses
- **Admin Panel**: Administrative endpoints for user and document management
- **Database**: SQLite database with SQLAlchemy ORM

## New Groq Integration

This version uses Groq's API for extremely fast AI responses:

- **Ultra-Fast Responses**: Groq's custom LPU (Language Processing Unit) provides industry-leading inference speeds
- **Free Tier Available**: Groq offers generous free usage limits for developers
- **Context-Aware**: Integrates with RAG system to provide document-based answers
- **ONGC-Specific**: Customized system prompts for ONGC operations and safety
- **Multiple Models**: Support for Llama 3, Mixtral, and other open-source models

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

**Required Groq Configuration:**
```env
GROQ_API_KEY=your-groq-api-key-here
GROQ_BASE_URL=https://api.groq.com/openai
GROQ_MODEL=llama3-8b-8192
GROQ_MAX_TOKENS=4000
GROQ_TEMPERATURE=0.7
```

**Other Configuration:**
- Change `SECRET_KEY` to a secure random string
- Adjust database URL if needed
- Configure RAG settings as required

### 3. Get Groq API Key (FREE!)

1. Visit [Groq Console](https://console.groq.com/) and create an account
2. Navigate to the API Keys section
3. Generate a new API key
4. Add the API key to your `.env` file

**Note**: Groq offers a generous free tier with:
- 14,400 requests per day
- 6,000 requests per minute
- No credit card required for signup

### 4. Test Groq Integration

Run the setup script to test your configuration:

```bash
python setup_groq.py
```

This will:
- Check your environment configuration
- Test the Groq API connection
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

## Groq Integration Details

### Why Groq?

1. **Speed**: Up to 10x faster inference than traditional cloud providers
2. **Cost**: Generous free tier, cost-effective paid plans
3. **Quality**: Access to state-of-the-art open-source models
4. **Reliability**: High availability and consistent performance

### Available Models

- **llama3-8b-8192**: Fast, efficient model for most tasks
- **llama3-70b-8192**: More capable model for complex reasoning
- **mixtral-8x7b-32768**: Excellent for multilingual and code tasks
- **gemma-7b-it**: Google's Gemma model optimized for instruction following

### Architecture

1. **Groq Client** (`groq_client.py`):
   - Async HTTP client for Groq API
   - OpenAI-compatible API format
   - Error handling and retry logic

2. **RAG Service** (`rag_service.py`):
   - Document processing and text extraction
   - Context retrieval from user documents
   - Chunk management for large documents

3. **Enhanced Chat Endpoint**:
   - Retrieves relevant context from user's documents
   - Sends context + user query to Groq
   - Returns AI response with source citations

### API Flow

1. User sends a message via `/api/chat`
2. System retrieves relevant context from user's uploaded documents
3. Context + user message sent to Groq API
4. Groq generates contextually-aware response (typically in <1 second)
5. Response returned to user with source document citations

### Configuration Options

```env
# Groq Model Configuration
GROQ_MODEL=llama3-8b-8192          # Model to use
GROQ_MAX_TOKENS=4000               # Maximum response length
GROQ_TEMPERATURE=0.7               # Response creativity (0.0-1.0)

# RAG Configuration
CHUNK_SIZE=1000                    # Document chunk size
CHUNK_OVERLAP=200                  # Overlap between chunks
MAX_CONTEXT_LENGTH=8000            # Maximum context sent to AI
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

- **Graceful Degradation**: Fallback responses when Groq is unavailable
- **Retry Logic**: Automatic retry for transient failures
- **Logging**: Comprehensive logging for debugging
- **Health Checks**: API health monitoring including Groq status

## Production Considerations

### Security

1. **API Key Management**: Store Groq API key securely
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Use HTTPS in production

### Performance

1. **Connection Pooling**: HTTP client uses connection pooling
2. **Async Processing**: All AI calls are asynchronous
3. **Caching**: Consider caching frequent queries
4. **Database Optimization**: Use PostgreSQL for production

### Monitoring

1. **API Usage**: Monitor Groq API usage and rate limits
2. **Response Times**: Track AI response latencies (typically <1s)
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

## Groq Rate Limits

### Free Tier Limits
- **Requests per day**: 14,400
- **Requests per minute**: 6,000
- **Tokens per minute**: 30,000

### Best Practices
1. Implement request queuing for high-traffic scenarios
2. Cache responses for repeated queries
3. Use appropriate model for task complexity
4. Monitor usage via Groq console

## Troubleshooting

### Common Issues

1. **Groq API Key Invalid**:
   - Verify your API key is correct
   - Check if you've exceeded rate limits

2. **Connection Errors**:
   - Verify internet connectivity
   - Check if Groq API is accessible from your network

3. **Rate Limit Exceeded**:
   - Check your usage in Groq console
   - Implement request throttling
   - Consider upgrading to paid plan

4. **Slow Responses**:
   - Check network latency to Groq
   - Consider reducing context length
   - Try a smaller model (llama3-8b vs llama3-70b)

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

## Groq vs Other Providers

| Feature | Groq | OpenAI | Anthropic |
|---------|------|--------|-----------|
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Cost | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Free Tier | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| Model Variety | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Open Source | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ |

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify your Groq API configuration
3. Test the connection using `setup_groq.py`
4. Refer to [Groq's documentation](https://console.groq.com/docs)
5. Check [Groq's status page](https://status.groq.com/)

## License

This project is for internal ONGC use only.