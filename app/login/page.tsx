import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CHEEKI AI</h1>
          <p className="text-gray-400 text-sm">
            AI assistant for the CHEEKI meme project on BNB Smart Chain
          </p>
          <p className="text-gray-500 text-xs mt-1">
            AI-ассистент мем-проекта CHEEKI в сети BNB Smart Chain
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
