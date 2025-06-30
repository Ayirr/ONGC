import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, ExternalLink, MessageSquare, RefreshCw, History, X } from 'lucide-react';
import { Message, SourceDocument, Chat } from '../../types';
import { chatApi } from '../../services/api';
import { toast } from '../../utils/toast';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [myChats, setMyChats] = useState<Chat[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await chatApi.getMyChats();
        // Sort chats by updatedAt descending
        const sortedChats = response.data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setMyChats(sortedChats);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        toast.error('Failed to load chat history.');
      }
    };
    fetchChats();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(inputMessage.trim(), currentChatId || undefined);

      // Set chat ID if this is a new conversation
      if (!currentChatId && response.data.chatId) {
        setCurrentChatId(response.data.chatId);
        // Refresh chat list after creating a new chat
        const updatedChatsResponse = await chatApi.getMyChats();
        const sortedChats = updatedChatsResponse.data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setMyChats(sortedChats);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.message || 'I apologize, but I encountered an issue processing your request.',
        sender: 'assistant',
        timestamp: response.data.timestamp || new Date().toISOString(), // Use timestamp from API if available
        sources: response.data.sources || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInputMessage('');
    setShowHistory(false); // Hide history when starting new chat
    toast.info('Started new conversation');
  };

  const retryLastMessage = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages[messages.length - 2];
      if (lastUserMessage.sender === 'user') {
        setInputMessage(lastUserMessage.text);
        // Remove the last two messages (user message and failed response)
        setMessages(prev => prev.slice(0, -2));
      }
    }
  };

  const loadChatHistory = async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await chatApi.getChatHistory(chatId);
      setMessages(response.data.messages);
      setCurrentChatId(response.data.id);
      setShowHistory(false); // Hide history after loading a chat
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* History Sidebar */}
      <div className={`flex-shrink-0 w-64 bg-gray-100 border-r border-gray-200 transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static absolute inset-y-0 left-0 z-20`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
          <button onClick={() => setShowHistory(false)} className="md:hidden text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-2">
          {myChats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No past chats.</p>
          ) : (
            myChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => loadChatHistory(chat.id)}
                className={`block w-full text-left p-3 rounded-lg transition-colors ${currentChatId === chat.id ? 'bg-red-100 text-red-800 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <p className="text-sm truncate">{chat.title || 'Untitled Chat'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(chat.updatedAt).toLocaleDateString()} {new Date(chat.updatedAt).toLocaleTimeString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 relative">
         {/* Overlay for mobile when history is open */}
        {showHistory && <div className="md:hidden absolute inset-0 bg-black opacity-50 z-10" onClick={() => setShowHistory(false)}></div>}

        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center">
             <button onClick={() => setShowHistory(true)} className="md:hidden mr-4 text-gray-600 hover:text-gray-800">
              <History className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-500">Ask questions about your uploaded documents</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              New Chat
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 ongc-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to ONGC AI Assistant</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Start a conversation by asking questions about your uploaded documents or general inquiries.
              </p>

              {/* Suggested Questions */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "What are the safety protocols for offshore drilling?",
                    "How often should equipment be maintained?",
                    "What are the environmental compliance requirements?",
                    "Summarize the key points from my documents"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion)}
                      className="p-3 text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id} className="flex flex-col space-y-2">
              <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.sender === 'assistant' && index === messages.length - 1 && (
                      <button
                        onClick={retryLastMessage}
                        className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1"
                        title="Retry this message"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Documents */}
              {message.sources && message.sources.length > 0 && (
                <div className="ml-0 max-w-xs space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Sources:</p>
                  {message.sources.map((source, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 text-xs hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">{source.title}</p>
                          <p className="text-gray-600 mb-2">{source.snippet}</p>
                          <div className="flex items-center space-x-1 text-red-600">
                            <FileText className="h-3 w-3" />
                            <span>{source.fileName}</span>
                          </div>
                        </div>
                        {/* TODO: Add actual link handling */}
                        <button className="ml-2 text-gray-400 hover:text-red-600 transition-colors">
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="chat-bubble-assistant">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 z-10">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none min-h-[48px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 ongc-gradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 self-end"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
