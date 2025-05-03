import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { 
  XMarkIcon,
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ChallengeProvider, useChallenge } from '../contexts/ChallengeContext.jsx';

export default function Chatbot({ onClose }) {
  const { currentChallenge } = useChallenge();
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'bot', type: 'welcome' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lastSendTime, setLastSendTime] = useState(null);
  const [rateLimit, setRateLimit] = useState({
    remaining: 10,
    resetTime: null
  });

  // Load/save chat history
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    const now = Date.now();
    if (lastSendTime && now - lastSendTime < 1000) {
      setError("Please wait a moment between messages");
      return;
    }
    setLastSendTime(now);

    if (!input.trim() || isTyping || rateLimit.remaining <= 0) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await api.post('/api/chat', { 
        message: input,
        challengeId: currentChallenge?._id 
      });
      
      setRateLimit({
        remaining: response.headers['x-ratelimit-remaining'] || rateLimit.remaining - 1,
        resetTime: response.headers['x-ratelimit-reset'] 
          ? new Date(response.headers['x-ratelimit-reset'] * 1000)
          : rateLimit.resetTime
      });

      setMessages(prev => [...prev, { 
        text: response.data.response, 
        sender: 'bot',
        type: response.data.type || 'general'
      }]);

    } catch (error) {
      let errorMessage = "Sorry, I couldn't process your request.";
      let retryAfter = 30;
      
      if (error.response?.status === 429) {
        errorMessage = error.response.data?.message || errorMessage;
        retryAfter = error.response.data?.retryAfter || retryAfter;
        
        setRateLimit({
          remaining: 0,
          resetTime: new Date(Date.now() + retryAfter * 1000)
        });
        
        setTimeout(() => {
          setRateLimit(prev => ({ ...prev, remaining: 10 }));
          setError(null);
        }, retryAfter * 1000);
      }

      setError(errorMessage);
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        sender: 'bot',
        type: 'error'
      }]);
      
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      text: "Hello! I'm your AI assistant. How can I help you today?", 
      sender: 'bot',
      type: 'welcome'
    }]);
    setError(null);
  };

  // Message styling based on type
  const getMessageStyle = (type, sender) => {
    const baseStyle = 'inline-block px-3 py-2 rounded-lg';
    
    if (sender === 'user') {
      return `${baseStyle} bg-[#64ffda] text-[#0a192f]`;
    }

    switch(type) {
      case 'hint':
        return `${baseStyle} bg-[#1e2a47] text-[#64ffda] border border-[#64ffda]/30`;
      case 'error':
        return `${baseStyle} bg-red-900/30 text-red-300`;
      case 'advice':
        return `${baseStyle} bg-[#1e2a47] text-yellow-300`;
      default:
        return `${baseStyle} bg-[#1e2a47] text-[#ccd6f6]`;
    }
  };

  return (
    <div className="w-80 h-[500px] bg-[#112240] rounded-lg shadow-xl flex flex-col border border-[#1e2a47]">
      <div className="p-3 bg-[#0a192f] rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#64ffda]">AI Assistant</h3>
          {isTyping && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={clearChat}
            className="text-gray-400 hover:text-white p-1"
            title="Clear chat"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-1 bg-[#0a192f] text-xs text-gray-400">
        <div>
          {rateLimit.remaining > 0 ? (
            <span>Requests left: {rateLimit.remaining}/15</span>
          ) : (
            <span className="text-yellow-400">
              Limit reached. Resets in {Math.max(0, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))}s
            </span>
          )}
        </div>
        <div>
          {rateLimit.resetTime && (
            <span>Resets at {new Date(rateLimit.resetTime).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {error && (
        <div className={`p-2 text-sm ${
          error.includes('wait') ? 'bg-yellow-900/30 text-yellow-300' : 'bg-red-900/30 text-red-300'
        }`}>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>{error}</span>
          </div>
          {error.includes('wait') && (
            <div className="mt-1 flex items-center">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              <span>Will auto-retry in 30 seconds</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={getMessageStyle(msg.type, msg.sender)}>
              {msg.type === 'hint' && (
                <div className="flex items-center mb-1">
                  <LightBulbIcon className="h-4 w-4 mr-1 text-[#64ffda]" />
                  <span className="text-xs font-semibold text-[#64ffda]">HINT</span>
                </div>
              )}
              {msg.text.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#1e2a47]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={rateLimit.remaining > 0 
              ? "Type your message..." 
              : "Wait before sending..."}
            className={`flex-1 px-3 py-2 bg-[#0a192f] border rounded-lg focus:outline-none ${
              rateLimit.remaining > 0
                ? 'border-[#1e2a47] focus:ring-1 focus:ring-[#64ffda] text-gray-400'
                : 'border-yellow-700 text-yellow-700 cursor-not-allowed'
            }`}
            disabled={isTyping || rateLimit.remaining <= 0}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="p-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8] disabled:opacity-50"
          >
            <ArrowUpOnSquareIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}