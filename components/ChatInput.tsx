
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-lg mx-auto">
      <div className="flex-1 bg-white rounded-[28px] border border-slate-200 shadow-sm px-4 py-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all flex items-center gap-2">
        <button type="button" className="p-1 text-slate-400 hover:text-blue-500">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <textarea
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="Coba: 'Makan 20rb'..."
          disabled={disabled}
          className="flex-1 py-2 bg-transparent focus:outline-none text-slate-700 text-sm resize-none max-h-32 custom-scrollbar"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-200 shadow-lg shadow-blue-100 flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45 mr-0.5 mt-[-2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
