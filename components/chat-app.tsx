'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { User } from '@supabase/supabase-js';
import { TextStreamChatTransport, type UIMessage } from 'ai';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

type Lang = 'en' | 'ru';
type Chat = { id: string; title: string; created_at: string };

const T = {
  en: {
    newChat: 'New Chat',
    placeholder: 'Ask CHEEKI AI...',
    send: 'Send',
    signOut: 'Sign out',
    history: 'Chats',
    welcome: 'Hello! I am CHEEKI AI — your assistant for everything about the CHEEKI project on BNB Chain.',
    welcomeSub: 'Ask me about price, how to buy, tokenomics, security, or anything else.',
    guest: 'Guest',
    quickActions: ['💰 Current price?', '🛒 How to buy?', '🔒 Is it safe?', '📊 Tokenomics'],
  },
  ru: {
    newChat: 'Новый чат',
    placeholder: 'Спроси CHEEKI AI...',
    send: 'Отправить',
    signOut: 'Выйти',
    history: 'Чаты',
    welcome: 'Привет! Я CHEEKI AI — твой ассистент по всему, что касается проекта CHEEKI в сети BNB Chain.',
    welcomeSub: 'Спрашивай о цене, как купить, токеномике, безопасности — всё что хочешь.',
    guest: 'Гость',
    quickActions: ['💰 Текущая цена?', '🛒 Как купить?', '🔒 Это безопасно?', '📊 Токеномика'],
  },
};

// Extract plain text from UIMessage parts (ai v6)
function getMessageText(msg: UIMessage): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (msg.parts as any[])
    .filter((p: any) => p.type === 'text')
    .map((p: any) => String(p.text ?? ''))
    .join('');
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline hover:text-yellow-300">
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-zinc-950 rounded-lg p-3 my-2 overflow-x-auto text-xs">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="bg-zinc-700 rounded px-1 text-yellow-300 text-xs">{children}</code>;
        },
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        h1: ({ children }) => <h1 className="text-base font-bold text-yellow-400 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-yellow-300 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-yellow-200 mb-1">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CheekiLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#EAB308"/>
      <text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="bold" fill="black" fontFamily="Arial, sans-serif">C</text>
    </svg>
  );
}

export function ChatApp({ user }: { user: User | null }) {
  const [lang, setLang] = useState<Lang>('en');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();
  const t = T[lang];
  const isGuest = !user;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: { chatId: activeChatId, lang },
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (!isGuest) fetchChats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    const res = await fetch('/api/chats');
    if (res.ok) setChats(await res.json());
  };

  const createChat = async (title?: string) => {
    if (isGuest) return null;
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'New Chat' }),
    });
    if (res.ok) {
      const chat = await res.json();
      setActiveChatId(chat.id);
      setChats(prev => [chat, ...prev]);
      return chat;
    }
    return null;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    if (!isGuest && !activeChatId) {
      await createChat(msg.slice(0, 40));
    }

    setInput('');
    sendMessage({ text: msg });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 z-40 w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200`}>

        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="animate-pulse-slow"><CheekiLogo size={36} /></div>
          <div>
            <div className="text-yellow-400 font-bold text-lg leading-none">CHEEKI AI</div>
            <div className="text-xs text-gray-500 mt-0.5">{isGuest ? t.guest : user?.email}</div>
          </div>
        </div>

        {!isGuest && (
          <div className="p-3">
            <button
              onClick={() => { setMessages([]); setActiveChatId(null); }}
              className="w-full bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black font-bold py-2 px-4 rounded-lg text-sm transition-all duration-150"
            >
              + {t.newChat}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2">
          {!isGuest && (
            <>
              <div className="text-xs text-gray-500 px-2 py-1">{t.history}</div>
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => { setActiveChatId(chat.id); setMessages([]); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 truncate transition-all ${
                    activeChatId === chat.id
                      ? 'bg-zinc-700 text-white'
                      : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {chat.title}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
            className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500"
          >
            {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
          </button>
          {isGuest ? (
            <a href="/login" className="text-sm text-yellow-500 hover:text-yellow-300 transition font-medium">Sign in →</a>
          ) : (
            <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-red-400 transition">{t.signOut}</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z"/>
            </svg>
          </button>
          <div className="hidden md:block"><CheekiLogo size={28} /></div>
          <span className="text-yellow-400 font-bold">CHEEKI AI</span>
          <div className="ml-auto flex items-center gap-3">
            <a href="https://dexscreener.com/bsc/0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-green-400 transition hidden sm:block">📈 Chart</a>
            <a href="https://t.me/CHEEKIofficial" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-400 transition hidden sm:block">💬 TG</a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-bounce-slow">
                  <CheekiLogo size={48} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">{t.welcome}</h2>
                  <p className="text-gray-500 text-sm mt-1 max-w-sm">{t.welcomeSub}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {t.quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action.replace(/^[\p{Emoji}\s]+/u, '').trim())}
                    className="text-xs px-3 py-2 rounded-full border border-zinc-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-all duration-150 hover:scale-105"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const text = getMessageText(m);
            if (!text) return null;
            return (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <CheekiLogo size={20} />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-yellow-500 text-black font-medium' : 'bg-zinc-800 text-gray-100'
                }`}>
                  {m.role === 'assistant' ? <MarkdownMessage content={text} /> : text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <CheekiLogo size={20} />
              </div>
              <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-800 p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold px-5 py-3 rounded-xl transition-all active:scale-95"
            >
              {t.send}
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-gray-600">
            Not financial advice · CHEEKI on BNB Chain · <a href="https://bscscan.com/token/0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">BscScan</a>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
