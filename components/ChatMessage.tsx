
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-4 py-3 shadow-sm ${
        isUser 
          ? 'bg-blue-600 text-white rounded-[24px] rounded-tr-none' 
          : 'bg-white text-slate-800 border border-slate-100 rounded-[24px] rounded-tl-none'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.text}</p>
        <div className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 font-bold tracking-tighter uppercase ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isUser && (
            <span className="ml-1">
              {message.status === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
