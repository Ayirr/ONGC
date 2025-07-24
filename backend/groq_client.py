import httpx
import json
import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class GroqMessage(BaseModel):
    role: str
    content: str

class Usage(BaseModel):
    queue_time: float
    prompt_time: float
    completion_time: float
    total_time: float

class GroqResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Usage


class GroqClient:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai")
        self.model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
        self.max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "4000"))
        self.temperature = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
        
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )
    
    async def chat_completion(
        self, 
        messages: List[GroqMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> GroqResponse:
        """
        Send a chat completion request to Groq API
        """
        try:
            payload = {
                "model": self.model,
                "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                "temperature": temperature or self.temperature,
                "max_tokens": max_tokens or self.max_tokens,
                "stream": stream
            }
            
            logger.info(f"Sending request to Groq API: {self.base_url}/v1/chat/completions")
            
            response = await self.client.post(
                "/v1/chat/completions",
                json=payload
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            logger.info(f"Groq API response received: {response_data.get('id', 'unknown')}")
            
            return GroqResponse(**response_data)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Groq API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Groq API request error: {str(e)}")
            raise Exception(f"Groq API connection error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling Groq API: {str(e)}")
            raise Exception(f"Groq API error: {str(e)}")
    
    async def generate_response(
        self, 
        user_message: str, 
        context: str = "", 
        system_prompt: str = None
    ) -> str:
        """
        Generate a response using Groq with optional context from RAG
        """
        if system_prompt is None:
            system_prompt = """You are an AI assistant for ONGC (Oil and Natural Gas Corporation Limited), India's largest oil and gas exploration and production company.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

1. ONLY answer questions based on the provided context from uploaded documents
2. If the context does not contain information to answer the question, you MUST respond with: "I don't have enough information in the uploaded documents to answer this question. Please upload relevant documents or ask about information that might be contained in your uploaded files."
3. NEVER make up, assume, or hallucinate information that is not explicitly stated in the provided context
4. NEVER use your general knowledge about ONGC or any other topic unless it's explicitly mentioned in the context
5. Always cite which document the information comes from when providing answers
6. If the context is empty or irrelevant to the question, clearly state that no relevant information was found

When context IS provided and relevant:
- Answer based strictly on the context provided
- Be helpful and detailed in your response
- Focus on safety protocols, technical documentation, operational guidelines, regulatory compliance, equipment maintenance, environmental standards, and emergency procedures as found in the documents
- Always mention the source document name when providing information

When context is NOT provided or irrelevant:
- Do not attempt to answer from general knowledge
- Clearly state that the information is not available in the uploaded documents
- Suggest uploading relevant documents that might contain the needed information

Remember: Your role is to help users understand and work with their uploaded documents, not to provide general information about ONGC or any other topic."""

        messages = [
            GroqMessage(role="system", content=system_prompt)
        ]
        
        if context:
            context_message = f"""Based on the following context from uploaded documents:

{context}

Please answer the user's question using ONLY the information provided above. If the context doesn't contain the necessary information to answer the question, clearly state that the information is not available in the uploaded documents."""
            messages.append(GroqMessage(role="user", content=context_message))
        else:
            no_context_message = """No relevant context was found in the uploaded documents for this question. Please answer accordingly by stating that the information is not available in the uploaded documents."""
            messages.append(GroqMessage(role="user", content=no_context_message))
        
        messages.append(GroqMessage(role="user", content=user_message))
        
        response = await self.chat_completion(messages)
        
        if response.choices and len(response.choices) > 0:
            return response.choices[0]["message"]["content"]
        else:
            raise Exception("No response generated from Groq API")
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global client instance
_groq_client: Optional[GroqClient] = None

def get_groq_client() -> GroqClient:
    """Get or create the global Groq client instance"""
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client

async def cleanup_groq_client():
    """Cleanup the global Groq client"""
    global _groq_client
    if _groq_client:
        await _groq_client.close()
        _groq_client = None