import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
// import { isUsingMock } from '@idle-rpg/firebase';
import { useTranslation } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, isLoading } = useGameStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [characterName, setCharacterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [selectedClass, setSelectedClass] = useState<'knight' | 'mage' | 'assassin'>('knight');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (isRegister) {
        if (!characterName.trim()) {
          setError(language === 'vi' ? 'Tên nhân vật không được để trống!' : 'Character name cannot be empty!');
          return;
        }
        if (characterName.length > 12) {
          setError(language === 'vi' ? 'Tên nhân vật không được dài quá 12 ký tự!' : 'Character name cannot exceed 12 characters!');
          return;
        }
        if (password.length < 6) {
          setError(t('auth_error_pass_length'));
          return;
        }
        localStorage.setItem('selected_class', selectedClass);
        localStorage.setItem('selected_name', characterName.trim());
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
            {t('auth_title')}
          </h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">
            {t('auth_subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center space-y-1">
            <p className="font-bold">⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('email_label')}
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
              {t('password_label')}
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

          {isRegister && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'vi' ? 'Tên Nhân Vật (Tối đa 12 ký tự)' : 'Character Name (Max 12 chars)'}
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value.slice(0, 12))}
                  maxLength={12}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  placeholder={language === 'vi' ? 'Nhập tên nhân vật...' : 'Enter character name...'}
                  disabled={isLoading}
                />
              </div>

              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('select_class_label')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'knight', name: t('class_knight'), icon: '🛡️', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' },
                  { id: 'mage', name: t('class_mage'), icon: '🔮', color: 'border-purple-500/40 text-purple-400 bg-purple-950/20' },
                  { id: 'assassin', name: t('class_assassin'), icon: '🗡️', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
                ].map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClass(cls.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                      selectedClass === cls.id 
                        ? `${cls.color} scale-105 border-2 shadow-lg ring-1 ring-white/10` 
                        : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xl">{cls.icon}</span>
                    <span className="text-[10px] font-bold tracking-tight">{cls.name}</span>
                  </button>
                ))}
              </div>
              <div className="p-2.5 bg-slate-900/40 border border-slate-900 rounded-xl text-[10px] text-slate-400 leading-relaxed text-center">
                {selectedClass === 'knight' && t('class_desc_knight')}
                {selectedClass === 'mage' && t('class_desc_mage')}
                {selectedClass === 'assassin' && t('class_desc_assassin')}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl border border-blue-400/20 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm tracking-wider uppercase cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                ...
              </span>
            ) : isRegister ? (
              t('register_btn')
            ) : (
              t('login_btn')
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-400 hover:text-blue-300 font-bold focus:outline-none transition-colors cursor-pointer"
            >
              {isRegister ? t('auth_mode_toggle_login') : t('auth_mode_toggle_register')}
            </button>
          </p>
        </div>

        {/* <div className="mt-8 border-t border-slate-900 pt-4 text-center">
          {isUsingMock ? (
            <>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest block mb-1 font-semibold">
                ⚡ {t('auth_offline_mode')}
              </span>
              <span className="text-[10px] text-slate-500 block leading-relaxed max-w-xs mx-auto">
                {t('auth_offline_desc')}
              </span>
              {localStorage.getItem('idle_rpg_force_mock') === 'true' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('idle_rpg_force_mock');
                    window.location.reload();
                  }}
                  className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 block mx-auto font-bold focus:outline-none hover:underline cursor-pointer"
                >
                  🔄 {t('auth_reconnect_firebase')}
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest block mb-1 font-semibold">
                🌐 {t('auth_online_mode')}
              </span>
              <span className="text-[10px] text-slate-500 block leading-relaxed max-w-xs mx-auto mb-3">
                {t('auth_online_desc')}
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('idle_rpg_force_mock', 'true');
                  window.location.reload();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[10px] tracking-wider uppercase transition-colors cursor-pointer"
              >
                🕹️ {t('auth_play_offline')}
              </button>
            </>
          )}
        </div> */}
      </div>
    </div>
  );
};
