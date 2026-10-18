import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { RiSendPlaneFill } from 'react-icons/ri';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  placeholder = 'Ask your sustainability coach...',
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        onSend(input.trim());
        setInput('');
      }
    }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white disabled:opacity-50 resize-none transition-colors shadow-[0_2px_8px_rgb(0,0,0,0.02)]"
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Chat input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
          aria-label="Send message"
        >
          <RiSendPlaneFill size={20} />
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-2.5 text-center font-medium tracking-wide">
        Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">Enter</kbd> to send &nbsp;·&nbsp;
        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};
