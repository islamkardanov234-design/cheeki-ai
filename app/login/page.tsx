import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black text-3xl font-black shadow-lg shadow-yellow-500/30">
              C
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">CHEEKI AI</h1>
          <p className="text-gray-400 text-sm mt-2">
            Your AI assistant for the CHEEKI meme project
          </p>
          <p className="text-gray-600 text-xs mt-1">
            BNB Smart Chain · Community driven · 0% tax
          </p>
        </div>

        <LoginForm />

        {/* Guest option */}
        <div className="text-center mt-4">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-yellow-400 transition"
          >
            Continue as guest →
          </a>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-gray-700">
          <a href="https://x.com/cheekiofficial" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">X/Twitter</a>
          <a href="https://t.me/CHEEKIofficial" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Telegram</a>
          <a href="https://dexscreener.com/bsc/0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Chart</a>
        </div>
      </div>
    </div>
  );
}
