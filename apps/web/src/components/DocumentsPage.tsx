import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { 
  DEFAULT_ITEM_TEMPLATES, 
  calculateItemStats, 
  calculateUpgradeCost, 
  calculateLevelUpExp, 
  generateMonsterForStage
} from '@idle-rpg/shared';
import { useTranslation, getTranslatedItemName, getTranslatedMonsterName } from '../utils/i18n';
import { ItemGraphic } from './ItemGraphic';



const getRarityUIStyles = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return {
        border: 'border-slate-800/80',
        bg: 'bg-slate-950/60',
        glow: '',
        text: 'text-slate-400',
        extraElements: null
      };
    case 'uncommon':
      return {
        border: 'border-emerald-500/35',
        bg: 'bg-emerald-950/20',
        glow: '',
        text: 'text-emerald-400',
        extraElements: (
          <>
            <div className="absolute top-1 left-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
            <div className="absolute top-1 right-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
          </>
        )
      };
    case 'rare':
      return {
        border: 'border-blue-500/40',
        bg: 'bg-blue-950/25',
        glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
        text: 'text-blue-400',
        extraElements: (
          <>
            <div className="absolute top-1.5 left-1.5 border-t border-l border-blue-400/40 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 border-b border-r border-blue-400/40 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
            <div className="absolute w-7 h-7 rounded-full border border-blue-500/5 bg-blue-500/5 pointer-events-none" />
          </>
        )
      };
    case 'epic':
      return {
        border: 'border-purple-500/70',
        bg: 'bg-purple-950/30',
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
        text: 'text-purple-400',
        extraElements: (
          <>
            <div className="absolute inset-0.5 border border-purple-500/15 rounded-lg animate-pulse pointer-events-none" />
            <div className="absolute top-1 left-1 border-t border-l border-purple-400 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-1 right-1 border-t border-r border-purple-400 w-1.5 h-1.5 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-1 left-1 border-b border-l border-purple-400 w-1.5 h-1.5 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-1 right-1 border-b border-r border-purple-400 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
            <div className="absolute w-8 h-8 rounded-full bg-purple-500/10 blur-sm animate-pulse pointer-events-none" />
          </>
        )
      };
    case 'legendary':
      return {
        border: 'border-transparent',
        bg: 'bg-gradient-to-br from-amber-500/30 via-yellow-600/15 to-orange-500/30',
        glow: 'shadow-[0_0_18px_rgba(245,158,11,0.55)] ring-1 ring-amber-400/20',
        text: 'text-amber-500 font-extrabold neon-text-gold',
        extraElements: (
          <>
            <div 
              className="absolute w-[180%] h-[180%] bg-[conic-gradient(from_0deg,transparent_10%,#f59e0b_45%,#fbbf24_55%,transparent_90%)] animate-spin pointer-events-none rounded-full" 
              style={{ animationDuration: '2.5s' }}
            />
            <div className="absolute inset-[1px] bg-slate-950 rounded-[11px] pointer-events-none" />
            <div className="absolute inset-0.5 bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-[10px] pointer-events-none" />
            <div className="absolute w-8 h-8 rounded-full bg-amber-500/15 blur-sm animate-pulse pointer-events-none" />
            <div className="absolute top-0.5 left-0.5 text-[6px] animate-pulse text-amber-300 pointer-events-none">✨</div>
            <div className="absolute bottom-0.5 right-1 text-[6px] animate-pulse text-amber-300 pointer-events-none" style={{ animationDelay: '0.6s' }}>✨</div>
          </>
        )
      };
    default:
      return { border: 'border-slate-800', bg: 'bg-slate-950/60', glow: '', text: 'text-slate-400', extraElements: null };
  }
};

interface DocumentsPageProps {
  onNavigate: (to: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const { user, signIn, signOut, isLoading: storeLoading } = useGameStore();
  const { t, language } = useTranslation();

  // Admin Login Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General Tabs state
  const [activeTab, setActiveTab] = useState<'monsters' | 'items' | 'exp' | 'classes'>('monsters');

  // Monster search/filters
  const [monsterSearchStage, setMonsterSearchStage] = useState<string>('');
  const [stagePage, setStagePage] = useState<number>(1);
  const stagesPerPage = 20;

  // Equipment Preview state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_ITEM_TEMPLATES[0]?.id || '');
  const [previewLevel, setPreviewLevel] = useState<number>(1);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
      setAuthError(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill in all fields');
      return;
    }
    
    if (email.toLowerCase() !== 'admin@gmail.com') {
      setAuthError(
        language === 'vi' 
          ? 'Chỉ tài khoản admin@gmail.com mới được phép truy cập!' 
          : 'Only admin@gmail.com is allowed to access!'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutAndReset = async () => {
    try {
      await signOut();
      setEmail('');
      setPassword('');
      setAuthError(null);
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // 1. Auth check
  if (storeLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="absolute w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
        <div className="text-center relative z-10 space-y-6">
          <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-pulse">
            <span className="text-5xl block animate-spin duration-[4s]">🛡️</span>
          </div>
          <h1 className="text-xl font-bold tracking-widest text-slate-300 font-display">
            VERIFYING ACCREDITATION...
          </h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border-slate-800 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-red-500/10 rounded-2xl border border-red-500/30 mb-4 animate-pulse">
              <span className="text-4xl">🔑</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent font-display uppercase">
              {language === 'vi' ? 'Thư Viện Admin' : 'Admin Encyclopedia'}
            </h1>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest leading-relaxed">
              {language === 'vi' 
                ? 'Chỉ quản trị viên (admin@gmail.com) mới có quyền truy cập.' 
                : 'Only administrative accounts can view game configurations.'}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-semibold">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                placeholder="admin@gmail.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {language === 'vi' ? 'Mật Khẩu' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl border border-red-400/20 shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm tracking-wider uppercase cursor-pointer"
            >
              {isSubmitting ? '...' : (language === 'vi' ? 'ĐĂNG NHẬP ADMIN' : 'SIGN IN AS ADMIN')}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <span>◀</span> {language === 'vi' ? 'Quay lại game' : 'Return to game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in but not admin@gmail.com
  if (user.email.toLowerCase() !== 'admin@gmail.com') {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border-red-900/30 shadow-2xl relative z-10 text-center space-y-6">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse">
            <span className="text-4xl">🚫</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-red-500 uppercase tracking-tight font-display">
              {language === 'vi' ? 'Từ Chối Truy Cập' : 'Access Denied'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'vi' 
                ? `Bạn đang đăng nhập bằng tài khoản ${user.email}. Chỉ quản trị viên tối cao (admin@gmail.com) mới có quyền truy cập khu vực này.`
                : `You are signed in as ${user.email}. Only the supreme administrator (admin@gmail.com) is authorized.`}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleSignOutAndReset}
              className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.97] cursor-pointer"
            >
              🔄 {language === 'vi' ? 'Đăng xuất & Đổi tài khoản' : 'Sign Out & Change Account'}
            </button>
            
            <button
              onClick={() => onNavigate('/')}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.97] cursor-pointer"
            >
              {language === 'vi' ? 'Quay Lại Bảng Game' : 'Return to Game HUD'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is admin@gmail.com -> Access Granted! Show Encyclopedia tables
  
  // Pre-calculate stages data for Monster Tab
  const stagesList = Array.from({ length: 100 }, (_, i) => i + 1);
  const filteredStages = stagesList.filter(stage => {
    if (!monsterSearchStage) return true;
    return stage === parseInt(monsterSearchStage);
  });

  const totalPages = Math.ceil(filteredStages.length / stagesPerPage);
  const startIndex = (stagePage - 1) * stagesPerPage;
  const currentStages = filteredStages.slice(startIndex, startIndex + stagesPerPage);

  // Equipment Item detail table generator
  const selectedTemplate = DEFAULT_ITEM_TEMPLATES.find(t => t.id === selectedTemplateId) || DEFAULT_ITEM_TEMPLATES[0];
  const equipmentLevels = Array.from({ length: 20 }, (_, i) => i + 1);

  // Exp scaling table generator (Levels 1 to 100)
  const expProgressLevels = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6 select-text select-none">
      {/* Background neon glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="glass-panel rounded-2xl py-4 px-6 flex flex-col sm:flex-row justify-between items-center relative z-10 border-slate-800 shadow-xl gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-2xl shadow">
            📖
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent font-display">
              {language === 'vi' ? 'BÁCH KHOA TOÀN THƯ ADMIN' : 'ADMIN GAME ENCYCLOPEDIA'}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              {language === 'vi' ? 'Cân bằng game, chỉ số quái, trang bị và kinh nghiệm' : 'Game design values, monster stats, gear, and experience progression'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🟢 Admin Session</span>
            <span className="text-[11px] text-slate-400">{user.email}</span>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            🎮 {language === 'vi' ? 'Quay Lại Game' : 'Return to Game'}
          </button>

          <button
            onClick={handleSignOutAndReset}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition active:scale-95 cursor-pointer"
            title={language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
          >
            🚪
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="flex flex-wrap gap-2 mb-6 relative z-10">
        {[
          { id: 'monsters', icon: '👹', label: language === 'vi' ? 'Quái Vật & Boss' : 'Monsters & Bosses' },
          { id: 'items', icon: '🎒', label: language === 'vi' ? 'Vật Phẩm & Chỉ Số' : 'Gear & Item Stats' },
          { id: 'exp', icon: '⚡', label: language === 'vi' ? 'Ma Trận Kinh Nghiệm' : 'EXP Progression Matrix' },
          { id: 'classes', icon: '🛡️', label: language === 'vi' ? 'Hệ Phái & Nhiệm Vụ' : 'Classes & Quests' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer select-none ${
              activeTab === tab.id
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CORE DATA PANEL */}
      <main className="glass-panel rounded-3xl p-6 border-slate-850 shadow-2xl relative z-10 mb-6 flex flex-col">
        
        {/* TAB 1: MONSTERS & BOSSES */}
        {activeTab === 'monsters' && (
          <div className="space-y-6 flex flex-col">
            {/* Filter control header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  {language === 'vi' ? 'Chỉ số Quái Vật theo từng Ải' : 'Monster Stats Scaling by Stage'}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {language === 'vi' 
                    ? 'Chỉ số được tính toán tại Hero Level = 1. Cấp quái vật = Max(Stage, HeroLevel * 0.85).'
                    : 'Stats calculated at Hero Level = 1. Monster level = Max(Stage, HeroLevel * 0.85).'}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-xs text-slate-400 shrink-0 font-bold">
                  {language === 'vi' ? 'Tìm Ải nhanh:' : 'Search Stage:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={monsterSearchStage}
                  onChange={(e) => {
                    setMonsterSearchStage(e.target.value);
                    setStagePage(1);
                  }}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-24"
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            {/* Raid Boss spotlight panel */}
            <div className="bg-gradient-to-r from-red-950/40 via-purple-950/20 to-slate-950/40 border border-red-500/20 p-5 rounded-2xl shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl animate-bounce">🐉</span>
                <div>
                  <h4 className="text-sm font-black text-red-400 tracking-wider uppercase font-display">
                    {language === 'vi' ? 'Raid Boss Đặc Biệt: Void Behemoth' : 'Special Raid Boss: Void Behemoth'}
                  </h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                    {language === 'vi' ? 'Phó bản Đột Kích Bang Hội - Yêu cầu cấp độ 80' : 'Guild Raid Instance - Requires Level 80'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                {[
                  { label: language === 'vi' ? 'Cấp độ' : 'Level', value: 80, color: 'text-indigo-400' },
                  { label: language === 'vi' ? 'HP' : 'Max HP', value: '50,000', color: 'text-red-400' },
                  { label: language === 'vi' ? 'Tấn Công' : 'Attack', value: 85, color: 'text-amber-400' },
                  { label: language === 'vi' ? 'Phòng Thủ' : 'Defense', value: 35, color: 'text-emerald-400' },
                  { label: language === 'vi' ? 'Tốc độ' : 'Speed', value: 90, color: 'text-sky-400' },
                  { label: language === 'vi' ? 'Kinh Nghiệm' : 'Exp reward', value: 5000, color: 'text-purple-400' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                    <span className="block text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">{s.label}</span>
                    <span className={`text-xs sm:text-sm font-black font-display mt-0.5 block ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{language === 'vi' ? 'Danh sách Rơi Đồ:' : 'Loot Drops:'}</span>
                <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/25 rounded-md font-bold">🗡️ Sword (Legendary)</span>
                <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/25 rounded-md font-bold">🔮 Staff (Legendary)</span>
                <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/25 rounded-md font-bold">🗡️ Dagger (Legendary)</span>
              </div>
            </div>

            {/* Stages Table */}
            <div className="overflow-x-auto border border-slate-900 rounded-2xl select-text">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4 text-center">Ải</th>
                    <th className="py-3 px-4">Tên Quái</th>
                    <th className="py-3 px-4 text-center">Cấp</th>
                    <th className="py-3 px-4 text-right">Máu (HP)</th>
                    <th className="py-3 px-4 text-right">Tấn Công</th>
                    <th className="py-3 px-4 text-right">Thủ</th>
                    <th className="py-3 px-4 text-center">Tốc Độ</th>
                    <th className="py-3 px-4 text-right">EXP Nhận</th>
                    <th className="py-3 px-4 text-right">Vàng Rơi</th>
                    <th className="py-3 px-4 text-center">Tỉ Lệ Đồ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-medium">
                  {currentStages.map((stage) => {
                    // Generate monster stats for level 1 hero
                    const mob = generateMonsterForStage(stage, 1);
                    return (
                      <tr key={stage} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">#{stage}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {getTranslatedMonsterName(t, mob.name)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black font-display text-indigo-400">{mob.level}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-red-400">{mob.baseStats.maxHp.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">{mob.baseStats.attack.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{mob.baseStats.defense.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-sky-400">{mob.baseStats.speed}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-purple-400">+{mob.expReward.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-yellow-400">
                          {mob.goldRewardRange[0]} - {mob.goldRewardRange[1]}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-slate-900 px-1.5 py-0.8 rounded text-[10px] text-indigo-300 font-bold">
                            {Math.round(mob.dropChance * 100)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-slate-950/20 p-3 border border-slate-900 rounded-xl select-none">
                <button
                  disabled={stagePage <= 1}
                  onClick={() => setStagePage(p => p - 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer text-xs font-bold transition"
                >
                  ◀ {language === 'vi' ? 'Trang Trước' : 'Previous'}
                </button>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {language === 'vi' ? `Trang ${stagePage} / ${totalPages}` : `Page ${stagePage} of ${totalPages}`}
                </span>
                <button
                  disabled={stagePage >= totalPages}
                  onClick={() => setStagePage(p => p + 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer text-xs font-bold transition"
                >
                  {language === 'vi' ? 'Trang Sau' : 'Next'} ▶
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EQUIPMENT & STATS */}
        {activeTab === 'items' && (
          <div className="space-y-6 flex flex-col">
            {/* Template Selector Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-5 rounded-2xl border-slate-850 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                  {language === 'vi' ? 'Chọn Trang Bị Mẫu' : 'Select Gear Template'}
                </h3>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {DEFAULT_ITEM_TEMPLATES.map((item) => {
                    const rarityColors = {
                      common: 'border-slate-800 text-slate-400 hover:bg-slate-900/40',
                      uncommon: 'border-emerald-950/40 text-emerald-400 hover:bg-emerald-950/10',
                      rare: 'border-blue-950/40 text-blue-400 hover:bg-blue-950/10',
                      epic: 'border-purple-950/40 text-purple-400 hover:bg-purple-950/10',
                      legendary: 'border-amber-950/40 text-amber-500 hover:bg-amber-950/10'
                    }[item.rarity];
                    
                    const isSelected = item.id === selectedTemplateId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedTemplateId(item.id); setPreviewLevel(1); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border text-[11px] font-bold transition flex justify-between items-center cursor-pointer ${rarityColors} ${
                          isSelected ? 'ring-1 ring-indigo-500 bg-indigo-950/10 scale-[1.02]' : ''
                        }`}
                      >
                        <span>{getTranslatedItemName(t, item as any)}</span>
                        <span className="text-[9px] uppercase opacity-75 font-semibold">
                          {item.slot === 'weapon' ? 'Vũ khí' : item.slot === 'armor' ? 'Giáp' : item.slot === 'helmet' ? 'Mũ' : item.slot === 'boots' ? 'Giày' : 'Nhẫn'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live UI Preview Card */}
              <div className="glass-panel p-5 rounded-2xl border-slate-850 space-y-4 flex flex-col items-center justify-between">
                <h3 className="w-full text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2 text-center md:text-left">
                  {language === 'vi' ? 'Giao Diện Trong Game' : 'In-game UI Preview'}
                </h3>
                
                {/* Visual Card slot */}
                {(() => {
                  const ui = getRarityUIStyles(selectedTemplate.rarity);
                  return (
                    <div className="flex flex-col items-center py-4 space-y-3.5 w-full">
                      <div
                        className={`w-20 h-20 relative flex flex-col items-center justify-center border rounded-2xl overflow-hidden transition-all shadow select-none ${ui.border} ${ui.bg} ${ui.glow}`}
                      >
                        {/* Rarity Specific Visuals */}
                        {ui.extraElements}

                        {/* Item Graphic Illustration */}
                        <ItemGraphic templateId={selectedTemplate.id} className="w-12 h-12 mb-1 relative z-10" />

                        {/* Level text */}
                        <span className="absolute bottom-1 right-1 text-[10px] font-extrabold text-slate-400 bg-slate-950/70 px-1.5 py-0.2 rounded z-10 font-display">
                          +{previewLevel}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="text-center">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${ui.bg} ${ui.text}`}>
                          {t('rarity_' + selectedTemplate.rarity)}
                        </span>
                        <h4 className={`text-md font-black mt-2 font-display ${ui.text}`}>
                          {getTranslatedItemName(t, selectedTemplate as any)}
                        </h4>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mt-0.5">
                          Slot: {t('slot_' + selectedTemplate.slot)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Level Slider Control */}
                <div className="w-full space-y-2 bg-slate-950/40 p-3.5 border border-slate-900 rounded-xl">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>{language === 'vi' ? 'Cấp độ xem thử:' : 'Preview Level:'}</span>
                    <span className="text-indigo-400 font-extrabold font-display">+{previewLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={previewLevel}
                    onChange={(e) => setPreviewLevel(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-900 h-1 rounded-lg cursor-pointer appearance-none"
                  />
                  {/* Small stats summary box for previewLevel */}
                  {(() => {
                    const stats = calculateItemStats(selectedTemplate.slot, selectedTemplate.rarity, previewLevel);
                    return (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-900 text-[10px] space-y-1">
                        {stats.attack > 0 && (
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">{t('attack_power')}</span>
                            <span className="text-amber-400 font-bold">+{stats.attack}</span>
                          </div>
                        )}
                        {stats.maxHp > 0 && (
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">{t('max_health')}</span>
                            <span className="text-red-400 font-bold">+{stats.maxHp}</span>
                          </div>
                        )}
                        {stats.defense > 0 && (
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">{t('defense_rating')}</span>
                            <span className="text-emerald-400 font-bold">+{stats.defense}</span>
                          </div>
                        )}
                        {stats.speed > 0 && (
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">{t('attack_speed')}</span>
                            <span className="text-sky-400 font-bold">+{Math.round(stats.speed * 100)}%</span>
                          </div>
                        )}
                        {stats.critRate > 0 && (
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-500">{t('critical_rate')}</span>
                            <span className="text-indigo-400 font-bold">+{Math.round(stats.critRate * 100)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Rarity breakdown detail card */}
              <div className="glass-panel p-5 rounded-2xl border-slate-850 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                  {language === 'vi' ? 'Hệ số Phẩm chất Trang Bị' : 'Equipment Quality Coefficients'}
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  {[
                    { title: 'Common (Thường)', mult: 'x1.0', color: 'text-slate-400', bg: 'bg-slate-950/50' },
                    { title: 'Uncommon (Đặc biệt)', mult: 'x1.3', color: 'text-emerald-400', bg: 'bg-emerald-950/10' },
                    { title: 'Rare (Hiếm)', mult: 'x1.8', color: 'text-blue-400', bg: 'bg-blue-950/10' },
                    { title: 'Epic (Sử thi)', mult: 'x2.6', color: 'text-purple-400', bg: 'bg-purple-950/10' },
                    { title: 'Legendary (Huyền thoại)', mult: 'x4.0', color: 'text-amber-500 font-extrabold', bg: 'bg-amber-950/10' }
                  ].map((coef, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border border-slate-900 ${coef.bg}`}>
                      <span className="block text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">{coef.title}</span>
                      <span className={`text-sm font-black font-display mt-0.5 block ${coef.color}`}>{coef.mult}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1.5 text-[10px] text-slate-400 leading-relaxed">
                  <p className="font-bold text-slate-300">💡 Công thức Tính chỉ số Trang Bị:</p>
                  <code className="block bg-slate-950 p-2 rounded-lg border border-slate-900 text-indigo-400 font-mono">
                    Stat = BaseSlotStat * RarityMultiplier * (1 + (Level - 1) * 0.1)
                  </code>
                  <p>Mỗi cấp nâng cấp (+1) sẽ giúp trang bị gia tăng thêm **10% chỉ số thuộc tính gốc**.</p>
                </div>
              </div>
            </div>

            {/* Equipment levels stat table */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                {language === 'vi' ? `Biểu Đồ Nâng Cấp: ${getTranslatedItemName(t, selectedTemplate as any)} (+1 đến +20)` : `Upgrade Table: ${getTranslatedItemName(t, selectedTemplate as any)} (+1 to +20)`}
              </h4>
              <div className="overflow-x-auto border border-slate-900 rounded-2xl select-text">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4 text-center">Cấp độ (Level)</th>
                      <th className="py-3 px-4 text-right">Máu (HP)</th>
                      <th className="py-3 px-4 text-right">Tấn Công</th>
                      <th className="py-3 px-4 text-right">Phòng Thủ</th>
                      <th className="py-3 px-4 text-right">Tốc Độ CD</th>
                      <th className="py-3 px-4 text-right">Chí Mạng</th>
                      <th className="py-3 px-4 text-right">Sát Thương Chí Mạng</th>
                      <th className="py-3 px-4 text-right">Vàng Yêu Cầu</th>
                      <th className="py-3 px-4 text-right">Vàng Tích Lũy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-medium">
                    {(() => {
                      let cumulativeGold = 0;
                      return equipmentLevels.map((lvl) => {
                        const stats = calculateItemStats(selectedTemplate.slot, selectedTemplate.rarity, lvl);
                        const cost = calculateUpgradeCost(selectedTemplate.slot, selectedTemplate.rarity, lvl);
                        cumulativeGold += cost;
                        
                        return (
                          <tr key={lvl} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-slate-400">+{lvl}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.maxHp > 0 ? 'text-red-400' : 'text-slate-600'}`}>{stats.maxHp > 0 ? `+${stats.maxHp}` : '-'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.attack > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{stats.attack > 0 ? `+${stats.attack}` : '-'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.defense > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{stats.defense > 0 ? `+${stats.defense}` : '-'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.speed > 0 ? 'text-sky-400' : 'text-slate-600'}`}>{stats.speed > 0 ? `+${Math.round(stats.speed * 100)}%` : '-'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.critRate > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>{stats.critRate > 0 ? `+${Math.round(stats.critRate * 100)}%` : '-'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${stats.critDamage > 0 ? 'text-purple-400' : 'text-slate-600'}`}>{stats.critDamage > 0 ? `${Math.round(stats.critDamage * 100)}%` : '-'}</td>
                            <td className="py-3 px-4 text-right font-bold text-yellow-500 font-display">{cost.toLocaleString()} 💰</td>
                            <td className="py-3 px-4 text-right font-bold text-yellow-600/70 font-display">{cumulativeGold.toLocaleString()} 💰</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXP PROGRESSION MATRIX */}
        {activeTab === 'exp' && (
          <div className="space-y-6 flex flex-col">
            <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                {language === 'vi' ? 'Ma Trận Kinh Nghiệm Hệ Thống' : 'System Experience Curves'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {language === 'vi' 
                  ? 'Bảng đối chiếu giữa EXP thăng cấp của Anh Hùng và EXP phần thưởng từ quái thường ở Ải tương đương. Giúp cân bằng tốc độ thăng cấp.'
                  : 'A comparative sheet showing Hero level-up requirements versus experience gained from same-stage monsters, indicating leveling pacing.'}
              </p>
            </div>

            {/* Calculations Table */}
            <div className="overflow-x-auto border border-slate-900 rounded-2xl select-text">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4 text-center">Cấp độ (Lvl)</th>
                    <th className="py-3 px-4 text-right">EXP Để Lên Cấp</th>
                    <th className="py-3 px-4 text-center">Ải Tương Ứng</th>
                    <th className="py-3 px-4 text-center">Cấp Quái Vật</th>
                    <th className="py-3 px-4 text-right">EXP Quái Thường</th>
                    <th className="py-3 px-4 text-right">Số Quái Cần Đánh</th>
                    <th className="py-3 px-4 text-right">EXP Boss Đột Kích</th>
                    <th className="py-3 px-4 text-right">Số Boss Cần Đánh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-medium">
                  {expProgressLevels.map((lvl) => {
                    const reqExp = calculateLevelUpExp(lvl);
                    const stage = lvl; // assume stage equivalents for balance reference
                    const mobLevel = Math.max(stage, Math.floor(lvl * 0.85));
                    
                    // Monster EXP Reward is based on stage: Math.round(8 * Math.pow(1.11, stage - 1))
                    const monsterExp = Math.round(8 * Math.pow(1.11, stage - 1));
                    const killsNeeded = Math.ceil(reqExp / monsterExp);
                    
                    const raidBossExp = 5000;
                    const bossesNeeded = Math.round((reqExp / raidBossExp) * 10) / 10;

                    return (
                      <tr key={lvl} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 text-center font-extrabold text-slate-400">Lv.{lvl}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-400 font-display">{reqExp.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-500">#{stage}</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">{mobLevel}</td>
                        <td className="py-3 px-4 text-right font-bold text-purple-400">+{monsterExp}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-400 font-display">
                          {killsNeeded.toLocaleString()} {language === 'vi' ? 'quái' : 'mobs'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-purple-500 font-display">+{raidBossExp}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-amber-500 font-display">
                          {bossesNeeded} {language === 'vi' ? 'trận' : 'raids'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CHARACTER CLASSES & QUESTS */}
        {activeTab === 'classes' && (
          <div className="space-y-6 flex flex-col">
            {/* Hero Class growth statistics */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                {language === 'vi' ? 'Hệ Số Tăng Trưởng Hệ Phái' : 'Character Class Base & Growth Stats'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: language === 'vi' ? 'Chiến Binh (Knight)' : 'Knight',
                    icon: '🛡️',
                    stats: [
                      { key: 'HP gốc', val: '120 (+18 / lvl)' },
                      { key: 'Tấn Công gốc', val: '8 (+1.6 / lvl)' },
                      { key: 'Phòng Thủ gốc', val: '8 (+1.2 / lvl)' },
                      { key: 'Tốc độ đánh', val: 95 },
                      { key: 'Chí mạng', val: '5%' },
                      { key: 'Kỹ Năng Nộ', val: 'THẦN KIẾM TRẢM (Chém Lan)' }
                    ],
                    bg: 'from-emerald-950/20 to-slate-900/60 border-emerald-500/20'
                  },
                  {
                    name: language === 'vi' ? 'Pháp Sư (Mage)' : 'Mage',
                    icon: '🔮',
                    stats: [
                      { key: 'HP gốc', val: '85 (+12 / lvl)' },
                      { key: 'Tấn Công gốc', val: '14 (+2.8 / lvl)' },
                      { key: 'Phòng Thủ gốc', val: '3 (+0.6 / lvl)' },
                      { key: 'Tốc độ đánh', val: 100 },
                      { key: 'Chí mạng', val: '8%' },
                      { key: 'Kỹ Năng Nộ', val: 'BÃO THIÊN THẠCH (Chém Lan Phép)' }
                    ],
                    bg: 'from-purple-950/20 to-slate-900/60 border-purple-500/20'
                  },
                  {
                    name: language === 'vi' ? 'Sát Thủ (Assassin)' : 'Assassin',
                    icon: '🗡️',
                    stats: [
                      { key: 'HP gốc', val: '90 (+13 / lvl)' },
                      { key: 'Tấn Công gốc', val: '11 (+2.2 / lvl)' },
                      { key: 'Phòng Thủ gốc', val: '4 (+0.8 / lvl)' },
                      { key: 'Tốc độ đánh', val: 125 },
                      { key: 'Chí mạng', val: '15%' },
                      { key: 'Kỹ Năng Nộ', val: 'VÔ ẢNH BỘ (Sát Thương Đơn)' }
                    ],
                    bg: 'from-amber-950/20 to-slate-900/60 border-amber-500/20'
                  }
                ].map((c, idx) => (
                  <div key={idx} className={`bg-gradient-to-b ${c.bg} border p-5 rounded-2xl space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span className="text-2xl">{c.icon}</span>
                      <span className="font-bold text-sm text-white font-display uppercase">{c.name}</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {c.stats.map((s, sIdx) => (
                        <li key={sIdx} className="flex justify-between border-b border-slate-900/40 pb-1">
                          <span className="text-slate-500">{s.key}</span>
                          <span className="font-bold text-slate-300">{s.val}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Quests encyclopedia */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                {language === 'vi' ? 'Danh Sách Nhiệm Vụ Hệ Thống' : 'System Quests & Bounties'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'q1', title: 'First Blood', desc: 'Defeat 5 monsters to prove your combat skills.', req: 'defeat_monster (5)', reward: '100 Vàng, 10 Kim cương' },
                  { id: 'q2', title: 'Accumulate Wealth', desc: 'Gather 1,000 total gold.', req: 'earn_gold (1000)', reward: '200 Vàng, 15 Kim cương' },
                  { id: 'q3', title: 'Ready for Battle', desc: 'Upgrade an equipment item to Level 2.', req: 'upgrade_equipment (1)', reward: '150 Vàng, 10 Kim cương' }
                ].map((q) => (
                  <div key={q.id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-xs font-bold text-slate-200">{q.title}</span>
                      <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[8px] text-slate-500 font-extrabold uppercase font-mono">{q.id}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 min-h-[30px]">{q.desc}</p>
                    <div className="text-[9px] text-slate-500 space-y-1">
                      <div>Yêu cầu: <span className="text-slate-300 font-semibold">{q.req}</span></div>
                      <div>Thưởng: <span className="text-indigo-400 font-semibold">{q.reward}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
