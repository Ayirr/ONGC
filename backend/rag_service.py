import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import Document
import aiofiles
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Simple document processor for extracting text from uploaded files"""
    
    def __init__(self):
        self.chunk_size = int(os.getenv("CHUNK_SIZE", "1000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))
    
    async def extract_text_from_file(self, file_path: str, file_type: str) -> str:
        """Extract text from different file types"""
        try:
            if file_type == "text/plain":
                return await self._extract_from_txt(file_path)
            elif file_type == "application/pdf":
                return await self._extract_from_pdf(file_path)
            elif "word" in file_type:
                return await self._extract_from_docx(file_path)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return ""
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            return ""
    
    async def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        except UnicodeDecodeError:
            # Try with different encoding
            async with aiofiles.open(file_path, 'r', encoding='latin-1') as f:
                return await f.read()
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            # For production, you'd want to use PyPDF2, pdfplumber, or similar
            # For now, return a placeholder
            return f"[PDF content from {Path(file_path).name} - PDF processing not implemented in this demo]"
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {str(e)}")
            return ""
    
    async def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            # For production, you'd want to use python-docx
            # For now, return a placeholder
            return f"[DOCX content from {Path(file_path).name} - DOCX processing not implemented in this demo]"
        except Exception as e:
            logger.error(f"Error processing DOCX {file_path}: {str(e)}")
            return ""
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for better processing"""
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            
            # Try to break at sentence or paragraph boundaries
            if end < text_length:
                # Look for sentence endings
                for i in range(end, max(start + self.chunk_size - 200, start), -1):
                    if text[i] in '.!?\n':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap
            if start >= text_length:
                break
        
        return chunks

class RAGService:
    """RAG service for document retrieval and context generation"""
    
    def __init__(self):
        self.processor = DocumentProcessor()
        self.max_context_length = int(os.getenv("MAX_CONTEXT_LENGTH", "8000"))
    
    async def process_document(self, document: Document, db: Session) -> bool:
        """Process a document and extract its content"""
        try:
            logger.info(f"Processing document: {document.fileName}")
            
            # Extract text from the document
            text_content = await self.processor.extract_text_from_file(
                document.filePath, 
                document.fileType
            )
            
            if not text_content:
                logger.warning(f"No text extracted from {document.fileName}")
                return False
            
            # For this demo, we'll store the text content in a simple way
            # In production, you'd want to use a vector database like Chroma, Pinecone, etc.
            chunks = self.processor.chunk_text(text_content)
            
            logger.info(f"Document {document.fileName} processed into {len(chunks)} chunks")
            
            # Update document status
            document.status = "completed"
            db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing document {document.fileName}: {str(e)}")
            document.status = "failed"
            db.commit()
            return False
    
    async def retrieve_relevant_context(
        self, 
        query: str, 
        user_id: int, 
        db: Session
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Retrieve relevant context from user's documents
        Returns: (context_text, source_documents)
        """
        try:
            # Get user's completed documents
            user_documents = db.query(Document).filter(
                Document.user_id == user_id,
                Document.status == "completed"
            ).all()
            
            if not user_documents:
                return "", []
            
            # For this demo, we'll do simple keyword matching
            # In production, you'd use semantic search with embeddings
            relevant_docs = []
            context_parts = []
            
            query_lower = query.lower()
            keywords = query_lower.split()
            
            for doc in user_documents:
                try:
                    # Read document content for keyword matching
                    text_content = await self.processor.extract_text_from_file(
                        doc.filePath, 
                        doc.fileType
                    )
                    
                    if not text_content:
                        continue
                    
                    text_lower = text_content.lower()
                    
                    # Simple keyword matching
                    matches = sum(1 for keyword in keywords if keyword in text_lower)
                    
                    if matches > 0:
                        # Extract relevant snippet
                        snippet = self._extract_relevant_snippet(text_content, query, keywords)
                        
                        relevant_docs.append({
                            "title": f"ONGC Document: {doc.fileName}",
                            "snippet": snippet,
                            "fileName": doc.fileName,
                            "fileUrl": f"/docs/{doc.id}/download"
                        })
                        
                        context_parts.append(f"From {doc.fileName}:\n{snippet}")
                
                except Exception as e:
                    logger.error(f"Error processing document {doc.fileName} for retrieval: {str(e)}")
                    continue
            
            # Combine context parts, respecting max length
            context_text = "\n\n".join(context_parts)
            if len(context_text) > self.max_context_length:
                context_text = context_text[:self.max_context_length] + "..."
            
            logger.info(f"Retrieved context from {len(relevant_docs)} documents")
            
            return context_text, relevant_docs
            
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return "", []
    
    def _extract_relevant_snippet(self, text: str, query: str, keywords: List[str]) -> str:
        """Extract a relevant snippet from the text based on the query"""
        try:
            # Find the best matching paragraph/section
            paragraphs = text.split('\n\n')
            best_paragraph = ""
            max_matches = 0
            
            for paragraph in paragraphs:
                paragraph_lower = paragraph.lower()
                matches = sum(1 for keyword in keywords if keyword in paragraph_lower)
                
                if matches > max_matches:
                    max_matches = matches
                    best_paragraph = paragraph
            
            # Return a snippet of reasonable length
            if best_paragraph:
                snippet = best_paragraph.strip()
                if len(snippet) > 500:
                    snippet = snippet[:500] + "..."
                return snippet
            
            # Fallback: return first 500 characters
            return text[:500] + "..." if len(text) > 500 else text
            
        except Exception as e:
            logger.error(f"Error extracting snippet: {str(e)}")
            return text[:200] + "..." if len(text) > 200 else text

# Global service instance
_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    """Get or create the global RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service