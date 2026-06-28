import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { isUsingMock } from '@idle-rpg/firebase';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, isLoading } = useGameStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30 mb-4 animate-bounce">
            <span className="text-4xl">⚔️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent font-display">
            IDLE RPG WEB
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            A modern browser idle adventure
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center space-y-1">
            <p className="font-bold">⚠️ {error}</p>
            <p className="text-[10px] text-slate-400 font-normal leading-relaxed pt-1 border-t border-red-500/10 mt-1">
              Tip: Hãy bật <strong>"Email/Password"</strong> Provider trong bảng điều khiển <strong>Firebase Console &gt; Authentication</strong> cho dự án <em>soraly-todo</em>, hoặc xóa tệp <code>.env</code> để chơi ở chế độ Offline giả lập.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
              placeholder="hero@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl border border-blue-400/20 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm tracking-wider uppercase"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Enter Adventure'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have a hero?' : 'New to the realm?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-400 hover:text-blue-300 font-bold ml-1.5 focus:outline-none transition-colors"
            >
              {isRegister ? 'Login Here' : 'Create Character (Instantly)'}
            </button>
          </p>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-4 text-center">
          {isUsingMock ? (
            <>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest block mb-1 font-semibold">
                ⚡ Chế độ Giả lập Offline (LocalStorage)
              </span>
              <span className="text-[10px] text-slate-500 block leading-relaxed max-w-xs mx-auto">
                Không cần mạng hay mật khẩu. Điền email bất kỳ để trải nghiệm game ngay lập tức.
              </span>
              {localStorage.getItem('idle_rpg_force_mock') === 'true' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('idle_rpg_force_mock');
                    window.location.reload();
                  }}
                  className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 block mx-auto font-bold focus:outline-none hover:underline"
                >
                  🔄 Kết nối lại với Firebase Online
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest block mb-1 font-semibold">
                🌐 Chế độ Online (Firebase Live)
              </span>
              <span className="text-[10px] text-slate-500 block leading-relaxed max-w-xs mx-auto mb-3">
                Đang kết nối tới Realtime Database. Bạn cần đăng nhập bằng tài khoản Firebase thực tế.
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('idle_rpg_force_mock', 'true');
                  window.location.reload();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[10px] tracking-wider uppercase transition-colors"
              >
                🕹️ Chơi Chế độ Offline (Demo)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
