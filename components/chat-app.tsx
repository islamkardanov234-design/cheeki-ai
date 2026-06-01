'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

type Lang = 'en' | 'ru';
type Chat = { id: string; title: string; created_at: string };

const T = {
  en: {
    newChat: 'New Chat',
    placeholder: 'Ask CHEEKI AI...',
    send: 'Send',
    signOut: 'Sign out',
    history: 'Chats',
    thinking: 'Thinking...',
    welcome: 'Hello! I am CHEEKI AI. Ask me anything about the CHEEKI project.',
  },
  ru: {
    newChat: 'Новый чат',
    placeholder: 'Спроси CHEEKI AI...',
    send: 'Отправить',
    signOut: 'Выйти',
    history: 'Чаты',
    thinking: 'Думаю...',
    welcome: 'Привет! Я CHEEKI AI. Спрашивай всё о проекте CHEEKI.',
  },
};

export function ChatApp({ user }: { user: User }) {
  const [lang, setLang] = useState<Lang>('en');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();
  const t = T[lang];

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: { chatId: activeChatId, lang },
  });

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    const res = await fetch('/api/chats');
    if (res.ok) setChats(await res.json());
  };

  const createChat = async () => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    });
    if (res.ok) {
      const chat = await res.json();
      setActiveChatId(chat.id);
      setMessages([]);
      setChats(prev => [chat, ...prev]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    if (!activeChatId) {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.slice(0, 40) || 'New Chat' }),
      });
      if (res.ok) {
        const chat = await res.json();
        setActiveChatId(chat.id);
        setChats(prev => [chat, ...prev]);
      }
    }
    handleSubmit(e);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 z-40 w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="text-yellow-400 font-bold text-lg">CHEEKI AI</div>
          <div className="text-xs text-gray-500 mt-1">{user.email}</div>
        </div>
        <div className="p-3">
          <button
            onClick={createChat}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg text-sm transition"
          >
            + {t.newChat}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <div className="text-xs text-gray-500 px-2 py-1">{t.history}</div>
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => { setActiveChatId(chat.id); setMessages([]); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 truncate transition ${
                activeChatId === chat.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
            className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded border border-zinc-700"
          >
            {lang === 'en' ? 'RU' : 'EN'}
          </button>
          <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-red-400 transition">
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white mr-3">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-yellow-400 font-bold">CHEEKI AI</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-20">
              {t.welcome}
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${ m.role === 'user' ? 'justify-end' : 'justify-start' }`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-zinc-800 text-gray-100'
              }`}>
                {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-gray-400 animate-pulse">
                {t.thinking}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold px-5 py-3 rounded-xl transition"
            >
              {t.send}
            </button>
          </form>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
