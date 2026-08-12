import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, X, Bot, User, 
  BookOpen, Search, 
  ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface ChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'help' | 'search'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample help articles
  const sampleArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'How to Create an Exam',
      content: 'To create an exam, go to the Exams page and click "Create New Exam". Fill in the exam details, add questions, and configure settings.',
      category: 'Exams',
      tags: ['create', 'exam', 'setup']
    },
    {
      id: '2',
      title: 'Managing Students',
      content: 'You can invite students via email, manage their access, and view their performance in the Students section.',
      category: 'Students',
      tags: ['students', 'invite', 'manage']
    },
    {
      id: '3',
      title: 'Understanding Analytics',
      content: 'The analytics dashboard provides insights into exam performance, student progress, and detailed statistics.',
      category: 'Analytics',
      tags: ['analytics', 'reports', 'statistics']
    },
    {
      id: '4',
      title: 'Proctoring Features',
      content: 'AI-powered proctoring helps detect cheating attempts and ensures exam integrity.',
      category: 'Proctoring',
      tags: ['proctoring', 'security', 'ai']
    }
  ];

  const addMessage = React.useCallback((type: 'user' | 'bot', message: string, isTyping = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      isTyping
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    setHelpArticles(sampleArticles);
    setFilteredArticles(sampleArticles);
    
    // Add welcome message
    if (messages.length === 0) {
      addMessage('bot', 'Hello! I\'m here to help you with Exam Flow. How can I assist you today?');
    }
  }, [messages.length, addMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);

    // Simulate bot response
    setIsTyping(true);
    addMessage('bot', '', true);

    setTimeout(() => {
      setIsTyping(false);
      const response = getBotResponse(userMessage);
      setMessages(prev => 
        prev.map(msg => 
          msg.isTyping 
            ? { ...msg, message: response, isTyping: false }
            : msg
        )
      );
    }, 1500);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('create exam') || message.includes('new exam')) {
      return 'To create a new exam, go to the Exams page and click "Create New Exam". You can then add questions, set time limits, and configure other settings.';
    }
    
    if (message.includes('student') || message.includes('invite')) {
      return 'You can invite students by going to the Students section or by using the invitation feature when creating an exam. Students will receive email invitations.';
    }
    
    if (message.includes('analytics') || message.includes('report')) {
      return 'The analytics dashboard shows detailed performance metrics, student progress, and exam statistics. You can access it from the Analytics tab.';
    }
    
    if (message.includes('proctoring') || message.includes('security')) {
      return 'Our AI-powered proctoring system monitors exam sessions for suspicious activity and helps maintain exam integrity.';
    }
    
    if (message.includes('help') || message.includes('support')) {
      return 'I\'m here to help! You can ask me about creating exams, managing students, viewing analytics, or any other features. You can also browse the help articles in the Help tab.';
    }
    
    return 'I understand you need help. Could you be more specific about what you\'re looking for? I can help with exam creation, student management, analytics, or proctoring features.';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = helpArticles.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(helpArticles);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'chat') {
        handleSendMessage();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Help & Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle },
                { id: 'help', label: 'Help', icon: BookOpen },
                { id: 'search', label: 'Search', icon: Search }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'chat' | 'help' | 'search')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[80%] ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.type === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          <div className={`px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {message.isTyping ? (
                              <div className="flex items-center space-x-1">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Typing...</span>
                              </div>
                            ) : (
                              <p className="text-sm">{message.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isTyping}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div className="p-4 overflow-y-auto h-full">
                  <div className="space-y-4">
                    {helpArticles.map((article) => (
                      <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <h3 className="font-semibold text-gray-900 mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{article.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {article.category}
                          </span>
                          <div className="flex space-x-1">
                            {article.tags.map((tag) => (
                              <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="p-4 h-full">
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search help articles..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-4 overflow-y-auto">
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map((article) => (
                        <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <h3 className="font-semibold text-gray-900 mb-2">{article.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{article.content}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {article.category}
                            </span>
                            <div className="flex space-x-1">
                              {article.tags.map((tag) => (
                                <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No articles found matching your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSupport;
