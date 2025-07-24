#!/usr/bin/env python3
"""
Setup script for Groq integration with ONGC RAG Assistant.
This script helps configure the environment and test the Groq connection.
"""

import os
import asyncio
from dotenv import load_dotenv
from groq_client import GroqClient

async def test_groq_connection():
    """Test the Groq API connection"""
    try:
        print("🔧 Testing Groq API connection...")
        
        client = GroqClient()
        
        # Test with a simple message
        response = await client.generate_response(
            user_message="Hello, can you help me with ONGC safety protocols?",
            context="",
            system_prompt="You are an AI assistant for ONGC. Respond briefly to test the connection."
        )
        
        print("✅ Groq API connection successful!")
        print(f"📝 Test response: {response[:100]}...")
        
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Groq API connection failed: {str(e)}")
        return False

def check_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    required_vars = [
        "GROQ_API_KEY",
        "GROQ_BASE_URL",
        "GROQ_MODEL"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("\n📋 Please add the following to your .env file:")
        print("GROQ_API_KEY=your-groq-api-key-here")
        print("GROQ_BASE_URL=https://api.groq.com/openai")
        print("GROQ_MODEL=llama3-8b-8192")
        print("GROQ_MAX_TOKENS=4000")
        print("GROQ_TEMPERATURE=0.7")
        return False
    
    print("✅ All required environment variables are set")
    return True

def create_env_template():
    """Create a .env template file if it doesn't exist"""
    env_file = ".env"
    if not os.path.exists(env_file):
        print(f"📝 Creating {env_file} template...")
        
        template = """# Database Configuration
DATABASE_URL=sqlite:///./ongc_rag.db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Groq Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_BASE_URL=https://api.groq.com/openai
GROQ_MODEL=llama3-8b-8192
GROQ_MAX_TOKENS=4000
GROQ_TEMPERATURE=0.7

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CONTEXT_LENGTH=8000
"""
        
        with open(env_file, 'w') as f:
            f.write(template)
        
        print(f"✅ Created {env_file} template")
        print("🔧 Please edit the file and add your actual Groq API key")
    else:
        print(f"✅ {env_file} already exists")

async def main():
    """Main setup function"""
    print("🚀 ONGC RAG Assistant - Groq Integration Setup")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Create .env template if needed
    create_env_template()
    
    # Check environment configuration
    if not check_environment():
        print("\n❌ Setup incomplete. Please configure your .env file and run this script again.")
        return
    
    # Test Groq connection
    success = await test_groq_connection()
    
    if success:
        print("\n🎉 Setup completed successfully!")
        print("✅ Groq integration is ready to use")
        print("🚀 You can now start the FastAPI server with: python main.py")
    else:
        print("\n❌ Setup failed. Please check your Groq API key and try again.")

if __name__ == "__main__":
    asyncio.run(main())