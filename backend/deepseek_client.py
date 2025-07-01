import httpx
import json
import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class DeepSeekMessage(BaseModel):
    role: str
    content: str

class DeepSeekResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

class DeepSeekClient:
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.max_tokens = int(os.getenv("DEEPSEEK_MAX_TOKENS", "4000"))
        self.temperature = float(os.getenv("DEEPSEEK_TEMPERATURE", "0.7"))
        
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY environment variable is required")
        
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
        messages: List[DeepSeekMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> DeepSeekResponse:
        """
        Send a chat completion request to DeepSeek API
        """
        try:
            payload = {
                "model": self.model,
                "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                "temperature": temperature or self.temperature,
                "max_tokens": max_tokens or self.max_tokens,
                "stream": stream
            }
            
            logger.info(f"Sending request to DeepSeek API: {self.base_url}/v1/chat/completions")
            
            response = await self.client.post(
                "/v1/chat/completions",
                json=payload
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            logger.info(f"DeepSeek API response received: {response_data.get('id', 'unknown')}")
            
            return DeepSeekResponse(**response_data)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"DeepSeek API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"DeepSeek API request error: {str(e)}")
            raise Exception(f"DeepSeek API connection error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling DeepSeek API: {str(e)}")
            raise Exception(f"DeepSeek API error: {str(e)}")
    
    async def generate_response(
        self, 
        user_message: str, 
        context: str = "", 
        system_prompt: str = None
    ) -> str:
        """
        Generate a response using DeepSeek with optional context from RAG
        """
        if system_prompt is None:
            system_prompt = """You are an AI assistant for ONGC (Oil and Natural Gas Corporation Limited), India's largest oil and gas exploration and production company. You help employees with:

1. Safety protocols and procedures
2. Technical documentation and manuals
3. Operational guidelines
4. Regulatory compliance
5. Equipment maintenance procedures
6. Environmental standards
7. Emergency response procedures

Always provide accurate, helpful, and safety-focused responses. If you're unsure about specific ONGC procedures, recommend consulting official documentation or supervisors."""

        messages = [
            DeepSeekMessage(role="system", content=system_prompt)
        ]
        
        if context:
            context_message = f"Based on the following context from ONGC documents:\n\n{context}\n\nPlease answer the user's question:"
            messages.append(DeepSeekMessage(role="user", content=context_message))
        
        messages.append(DeepSeekMessage(role="user", content=user_message))
        
        response = await self.chat_completion(messages)
        
        if response.choices and len(response.choices) > 0:
            return response.choices[0]["message"]["content"]
        else:
            raise Exception("No response generated from DeepSeek API")
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global client instance
_deepseek_client: Optional[DeepSeekClient] = None

def get_deepseek_client() -> DeepSeekClient:
    """Get or create the global DeepSeek client instance"""
    global _deepseek_client
    if _deepseek_client is None:
        _deepseek_client = DeepSeekClient()
    return _deepseek_client

async def cleanup_deepseek_client():
    """Cleanup the global DeepSeek client"""
    global _deepseek_client
    if _deepseek_client:
        await _deepseek_client.close()
        _deepseek_client = None