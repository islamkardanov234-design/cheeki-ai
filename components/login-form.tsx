'use client';

import { useState } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'en' | 'ru'>('en');

  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const t = {
    en: {
      title: 'Sign in with Magic Link',
      placeholder: 'your@email.com',
      button: 'Send Magic Link',
      sending: 'Sending...',
      sent: 'Check your email! Click the magic link to sign in.',
      switchLang: 'RU',
    },
    ru: {
      title: 'Вход через Magic Link',
      placeholder: 'your@email.com',
      button: 'Отправить Magic Link',
      sending: 'Отправка...',
      sent: 'Проверьте почту! Нажмите на ссылку для входа.',
      switchLang: 'EN',
    },
  }[lang];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          {t.switchLang}
        </button>
      </div>

      {sent ? (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300 text-sm text-center">
          {t.sent}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <h2 className="text-white font-medium text-center">{t.title}</h2>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
          >
            {loading ? t.sending : t.button}
          </button>
        </form>
      )}
    </div>
  );
}
