import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { dbService } from '@idle-rpg/firebase';
import { QuestTemplate, QuestType, QuestTargetType } from '@idle-rpg/shared';
import { useTranslation } from '../utils/i18n';

interface AdminPageProps {
  onNavigate: (to: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, signIn, signOut, isLoading: storeLoading } = useGameStore();
  const { language } = useTranslation();

  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quest templates management states
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<QuestType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // CRUD Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [formId, setFormId] = useState('');
  const [formType, setFormType] = useState<QuestType>('daily');
  const [formTitleVi, setFormTitleVi] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formDescVi, setFormDescVi] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formTargetType, setFormTargetType] = useState<QuestTargetType>('defeat_monster');
  const [formTargetCount, setFormTargetCount] = useState(1);
  const [formRewardGold, setFormRewardGold] = useState(100);
  const [formRewardDiamonds, setFormRewardDiamonds] = useState(10);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  // Import file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load quest templates from db
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await dbService.loadQuestTemplates();
      // Sort templates by type, then ID
      const sorted = [...data].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.id.localeCompare(b.id);
      });
      setTemplates(sorted);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (user && user.email.toLowerCase() === 'admin@gmail.com') {
      fetchTemplates();
    }
  }, [user]);

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
      setTemplates([]);
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // Date helper functions
  const timestampToInputString = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const inputStringToTimestamp = (val: string): number | undefined => {
    if (!val) return undefined;
    return new Date(val).getTime();
  };

  // Open Modal for Create
  const openCreateModal = () => {
    setFormMode('create');
    setFormId('');
    setFormType('daily');
    setFormTitleVi('');
    setFormTitleEn('');
    setFormDescVi('');
    setFormDescEn('');
    setFormTargetType('defeat_monster');
    setFormTargetCount(1);
    setFormRewardGold(100);
    setFormRewardDiamonds(10);
    setFormStartDate('');
    setFormEndDate('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (template: QuestTemplate) => {
    setFormMode('edit');
    setFormId(template.id);
    setFormType(template.type);
    setFormTitleVi(template.titleVi);
    setFormTitleEn(template.titleEn);
    setFormDescVi(template.descriptionVi);
    setFormDescEn(template.descriptionEn);
    setFormTargetType(template.targetType);
    setFormTargetCount(template.targetCount);
    setFormRewardGold(template.rewardGold);
    setFormRewardDiamonds(template.rewardDiamonds);
    setFormStartDate(timestampToInputString(template.startDate));
    setFormEndDate(timestampToInputString(template.endDate));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formId.trim()) {
      setFormError(language === 'vi' ? 'ID nhiệm vụ không được để trống' : 'Quest ID is required');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formId)) {
      setFormError(language === 'vi' ? 'ID nhiệm vụ chỉ chứa chữ cái, số, gạch dưới và gạch ngang' : 'Quest ID can only contain letters, numbers, underscores and dashes');
      return;
    }
    if (!formTitleVi.trim() || !formTitleEn.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng nhập đầy đủ tiêu đề Việt/Anh' : 'Titles in both languages are required');
      return;
    }
    if (formTargetCount <= 0) {
      setFormError(language === 'vi' ? 'Số lượng mục tiêu phải lớn hơn 0' : 'Target count must be greater than 0');
      return;
    }
    if (formRewardGold < 0 || formRewardDiamonds < 0) {
      setFormError(language === 'vi' ? 'Phần thưởng không được âm' : 'Rewards cannot be negative');
      return;
    }

    const startTs = inputStringToTimestamp(formStartDate);
    const endTs = inputStringToTimestamp(formEndDate);

    if (startTs && endTs && startTs >= endTs) {
      setFormError(language === 'vi' ? 'Ngày bắt đầu phải trước ngày kết thúc' : 'Start date must be before end date');
      return;
    }

    // Check duplicate ID for create mode
    if (formMode === 'create') {
      const isDuplicate = templates.some(t => t.id.toLowerCase() === formId.trim().toLowerCase());
      if (isDuplicate) {
        setFormError(language === 'vi' ? `ID "${formId}" đã tồn tại. Vui lòng dùng ID khác` : `ID "${formId}" already exists.`);
        return;
      }
    }

    const updatedTemplate: QuestTemplate = {
      id: formId.trim(),
      type: formType,
      titleVi: formTitleVi.trim(),
      titleEn: formTitleEn.trim(),
      descriptionVi: formDescVi.trim(),
      descriptionEn: formDescEn.trim(),
      targetType: formTargetType,
      targetCount: Number(formTargetCount),
      rewardGold: Number(formRewardGold),
      rewardDiamonds: Number(formRewardDiamonds),
      startDate: startTs,
      endDate: endTs
    };

    try {
      await dbService.saveQuestTemplate(updatedTemplate);
      await fetchTemplates();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string) => {
    const confirmMsg = language === 'vi' 
      ? `Bạn có chắc chắn muốn xóa nhiệm vụ "${templateId}" không?`
      : `Are you sure you want to delete quest "${templateId}"?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await dbService.deleteQuestTemplate(templateId);
      await fetchTemplates();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `idle_rpg_quests_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const importedTemplates = JSON.parse(text);

        if (!Array.isArray(importedTemplates)) {
          throw new Error('Imported data must be a JSON array of quest templates.');
        }

        // Validate structure
        for (const t of importedTemplates) {
          if (!t.id || !t.type || !t.titleVi || !t.titleEn || !t.targetType || typeof t.targetCount !== 'number') {
            throw new Error(`Quest template "${t.id || 'Unknown'}" is missing required fields.`);
          }
        }

        const confirmMsg = language === 'vi'
          ? `Bạn có chắc muốn nhập ${importedTemplates.length} nhiệm vụ? Thao tác này sẽ ghi đè các nhiệm vụ có trùng ID.`
          : `Do you want to import ${importedTemplates.length} quests? This will overwrite existing quests with matching IDs.`;

        if (!window.confirm(confirmMsg)) return;

        setIsLoadingTemplates(true);
        for (const t of importedTemplates) {
          await dbService.saveQuestTemplate(t);
        }
        await fetchTemplates();
        alert(language === 'vi' ? 'Nhập dữ liệu thành công!' : 'Import success!');
      } catch (err: any) {
        alert(language === 'vi' ? `Lỗi nhập dữ liệu: ${err.message}` : `Import failed: ${err.message}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Status computation for quest templates
  const getQuestStatus = (q: QuestTemplate): { label: string; style: string } => {
    const now = Date.now();
    if (!q.startDate && !q.endDate) {
      return {
        label: language === 'vi' ? 'Vĩnh viễn' : 'Permanent',
        style: 'bg-slate-900 border-slate-800/80 text-slate-400'
      };
    }
    
    if (q.startDate && now < q.startDate) {
      return {
        label: language === 'vi' ? 'Lên lịch' : 'Scheduled',
        style: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      };
    }

    if (q.endDate && now > q.endDate) {
      return {
        label: language === 'vi' ? 'Hết hạn' : 'Expired',
        style: 'bg-red-500/10 border-red-500/30 text-red-400'
      };
    }

    return {
      label: language === 'vi' ? 'Đang hoạt động' : 'Active',
      style: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse'
    };
  };

  // Filter templates list
  const filteredTemplates = templates.filter(q => {
    const matchesFilter = selectedTypeFilter === 'all' || q.type === selectedTypeFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      q.id.toLowerCase().includes(searchLower) ||
      q.titleVi.toLowerCase().includes(searchLower) ||
      q.titleEn.toLowerCase().includes(searchLower) ||
      q.descriptionVi.toLowerCase().includes(searchLower) ||
      q.descriptionEn.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  // UI Render 1: Loading auth status
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

  // UI Render 2: Unauthenticated or not admin@gmail.com
  if (!user || user.email.toLowerCase() !== 'admin@gmail.com') {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl relative z-10 border border-slate-800/80 shadow-2xl">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-block p-3.5 bg-indigo-600/10 border border-indigo-500/25 rounded-2xl">
              <span className="text-4xl block">🔑</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider font-display">
              {language === 'vi' ? 'Cổng Admin CMS' : 'Admin CMS Portal'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'vi' 
                ? 'Đăng nhập bằng tài khoản Quản trị viên tối cao để cấu hình Nhiệm vụ.' 
                : 'Sign in as Supreme Administrator to manage game configuration.'}
            </p>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {language === 'vi' ? 'Email Admin' : 'Admin Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {language === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? '...' : (language === 'vi' ? 'ĐĂNG NHẬP ADMIN' : 'SIGN IN AS ADMIN')}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full py-2.5 bg-transparent border border-slate-850 hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              ↩️ {language === 'vi' ? 'Quay lại Trang Chủ Game' : 'Return to Game'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // UI Render 3: Authenticated Admin -> Show Quest CMS Panel
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] top-1/4 left-1/4 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] bottom-1/4 right-1/4 pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 bg-slate-900/60 backdrop-blur-xl border-b border-slate-900 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/35 rounded-xl">
            <span className="text-xl block">⚙️</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wider uppercase font-display flex items-center gap-2">
              CMS Admin <span className="text-xs bg-indigo-500/20 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">REALM</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {language === 'vi' ? 'Quản lý nhiệm vụ cấu hình game' : 'Manage quest template database'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            🟢 Admin: {user.email}
          </span>

          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            🎮 {language === 'vi' ? 'Trở về Game' : 'Return to Game'}
          </button>

          <button
            onClick={handleSignOutAndReset}
            className="px-4 py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            🚪 {language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'TỔNG SỐ', enLabel: 'TOTAL QUESTS', count: templates.length, icon: '📜', color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10' },
            { label: 'TÂN THỦ', enLabel: 'NEWBIE', count: templates.filter(t => t.type === 'newbie').length, icon: '🌱', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
            { label: 'HÀNG NGÀY', enLabel: 'DAILY', count: templates.filter(t => t.type === 'daily').length, icon: '☀️', color: 'text-yellow-400 bg-yellow-500/5 border-yellow-500/10' },
            { label: 'HÀNG TUẦN', enLabel: 'WEEKLY', count: templates.filter(t => t.type === 'weekly').length, icon: '📅', color: 'text-blue-400 bg-blue-500/5 border-blue-500/10' },
            { label: 'SỰ KIỆN / THÀNH TỰU', enLabel: 'EVENT & ACHIEVE', count: templates.filter(t => t.type === 'event' || t.type === 'achievement').length, icon: '🏆', color: 'text-pink-400 bg-pink-500/5 border-pink-500/10' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-slate-900/60 backdrop-blur-xl border rounded-2xl p-4 flex items-center justify-between ${stat.color}`}>
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  {language === 'vi' ? stat.label : stat.enLabel}
                </span>
                <span className="text-2xl font-extrabold font-display text-white">{stat.count}</span>
              </div>
              <span className="text-2xl opacity-80">{stat.icon}</span>
            </div>
          ))}
        </div>

        {/* Action and Filter Control Bar */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-900/60 shadow-lg">
          {/* Tabs Filter */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
            {([
              { value: 'all', label: 'Tất cả', en: 'All' },
              { value: 'newbie', label: 'Tân Thủ', en: 'Newbie' },
              { value: 'daily', label: 'Hàng Ngày', en: 'Daily' },
              { value: 'weekly', label: 'Hàng Tuần', en: 'Weekly' },
              { value: 'event', label: 'Sự Kiện', en: 'Event' },
              { value: 'achievement', label: 'Thành Tựu', en: 'Achievement' }
            ] as { value: QuestType | 'all'; label: string; en: string }[]).map((tab) => {
              const isActive = selectedTypeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTypeFilter(tab.value)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer border whitespace-nowrap ${
                    isActive 
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow shadow-indigo-600/10' 
                      : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {language === 'vi' ? tab.label : tab.en}
                </button>
              );
            })}
          </div>

          {/* Search bar & Actions */}
          <div className="flex w-full md:w-auto items-center gap-3 justify-end flex-wrap">
            {/* Search Input */}
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm nhiệm vụ...' : 'Search quests...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 text-xs bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500/50 w-full md:w-48 placeholder-slate-600"
            />

            {/* Create Button */}
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition active:scale-[0.98] cursor-pointer flex items-center gap-1 shadow shadow-indigo-600/10"
            >
              ➕ {language === 'vi' ? 'Thêm nhiệm vụ' : 'Create Quest'}
            </button>

            {/* Backup Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              📥 Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />

            {/* Backup Export */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              📤 Export
            </button>
          </div>
        </div>

        {/* Quests Data Grid */}
        {isLoadingTemplates ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-900 rounded-3xl">
            <span className="text-3xl block animate-spin mb-4">🔮</span>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Loading configs from Firebase...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-900 rounded-3xl text-slate-500">
            <span className="text-4xl block mb-2">🕊️</span>
            <span className="text-xs uppercase tracking-widest font-bold">
              {language === 'vi' ? 'Không tìm thấy nhiệm vụ nào' : 'No quest templates found'}
            </span>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-4 py-4">{language === 'vi' ? 'Loại' : 'Type'}</th>
                    <th className="px-5 py-4">{language === 'vi' ? 'Tiêu Đề / Yêu Cầu' : 'Title / Target'}</th>
                    <th className="px-4 py-4">{language === 'vi' ? 'Phần Thưởng' : 'Rewards'}</th>
                    <th className="px-4 py-4">{language === 'vi' ? 'Thời Hạn' : 'Duration Schedule'}</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredTemplates.map((q) => {
                    const status = getQuestStatus(q);
                    return (
                      <tr key={q.id} className="hover:bg-slate-900/40 transition-colors">
                        {/* ID */}
                        <td className="px-5 py-4">
                          <span className="bg-slate-950 border border-slate-900 px-2 py-1 rounded text-[10px] text-slate-400 font-mono font-bold uppercase select-all">
                            {q.id}
                          </span>
                        </td>
                        
                        {/* Type */}
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded border tracking-wider font-mono ${
                            q.type === 'newbie' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
                            q.type === 'daily' ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-400' :
                            q.type === 'weekly' ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' :
                            q.type === 'event' ? 'bg-pink-500/10 border-pink-500/35 text-pink-400' :
                            'bg-purple-500/10 border-purple-500/35 text-purple-400'
                          }`}>
                            {q.type}
                          </span>
                        </td>

                        {/* Title / Requirements */}
                        <td className="px-5 py-4 space-y-1 max-w-sm">
                          <div className="font-extrabold text-white">
                            {language === 'vi' ? q.titleVi : q.titleEn}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {language === 'vi' ? q.descriptionVi : q.descriptionEn}
                          </div>
                          <div className="text-[9px] text-indigo-400 font-semibold flex items-center gap-1.5 pt-0.5">
                            <span>🎯 Target:</span>
                            <span className="font-mono text-slate-300">{q.targetType} ({q.targetCount})</span>
                          </div>
                        </td>

                        {/* Rewards */}
                        <td className="px-4 py-4 space-y-1">
                          <div className="flex gap-1.5">
                            <span className="bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5 text-[9px] font-bold text-yellow-400 flex items-center gap-0.5">
                              💰 {q.rewardGold}
                            </span>
                            <span className="bg-slate-950 border border-slate-900 rounded px-1.5 py-0.5 text-[9px] font-bold text-blue-400 flex items-center gap-0.5">
                              💎 {q.rewardDiamonds}
                            </span>
                          </div>
                        </td>

                        {/* Duration Schedule */}
                        <td className="px-4 py-4 space-y-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${status.style}`}>
                            {status.label}
                          </span>
                          {(q.startDate || q.endDate) && (
                            <div className="text-[9px] text-slate-500 font-mono space-y-0.5 leading-none">
                              {q.startDate && <div>Start: {new Date(q.startDate).toLocaleString()}</div>}
                              {q.endDate && <div>End: {new Date(q.endDate).toLocaleString()}</div>}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(q)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              ✏️ {language === 'vi' ? 'Sửa' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(q.id)}
                              className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/10 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              🗑️ {language === 'vi' ? 'Xóa' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CRUD Form Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative flex flex-col my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">
                {formMode === 'create' 
                  ? (language === 'vi' ? '➕ Tạo Nhiệm Vụ Mới' : '➕ Create New Quest')
                  : (language === 'vi' ? `✏️ Chỉnh Sửa: ${formId}` : `✏️ Edit Quest: ${formId}`)}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-extrabold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2 animate-pulse">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* ID field */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  ID Nhiệm vụ (không dấu, vd: `q_daily_slay_10`)
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={formMode === 'edit'}
                  placeholder="q_new_quest_id"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase"
                />
              </div>

              {/* Grid 1: Type and Target Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Loại Nhiệm Vụ
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="newbie">Tân Thủ (Newbie)</option>
                    <option value="daily">Hàng Ngày (Daily)</option>
                    <option value="weekly">Hàng Tuần (Weekly)</option>
                    <option value="event">Sự Kiện (Event)</option>
                    <option value="achievement">Thành Tựu (Achievement)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Mục Tiêu
                  </label>
                  <select
                    value={formTargetType}
                    onChange={(e) => setFormTargetType(e.target.value as QuestTargetType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="defeat_monster">Tiêu diệt quái vật (defeat_monster)</option>
                    <option value="earn_gold">Tích lũy vàng (earn_gold)</option>
                    <option value="reach_level">Đạt cấp anh hùng (reach_level)</option>
                    <option value="upgrade_equipment">Nâng cấp trang bị (upgrade_equipment)</option>
                  </select>
                </div>
              </div>

              {/* Title VI/EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Tiêu Đề (Tiếng Việt)
                  </label>
                  <input
                    type="text"
                    value={formTitleVi}
                    onChange={(e) => setFormTitleVi(e.target.value)}
                    placeholder="Tiêu diệt quái"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="Defeat Monsters"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Desc VI/EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Mô Tả (Tiếng Việt)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescVi}
                    onChange={(e) => setFormDescVi(e.target.value)}
                    placeholder="Tiêu diệt 5 quái vật bất kỳ."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Defeat 5 monsters."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Grid 2: Target Count, Gold, Diamonds */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Số Lượng Cần Đạt
                  </label>
                  <input
                    type="number"
                    value={formTargetCount}
                    onChange={(e) => setFormTargetCount(Number(e.target.value))}
                    min={1}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Thưởng Vàng
                  </label>
                  <input
                    type="number"
                    value={formRewardGold}
                    onChange={(e) => setFormRewardGold(Number(e.target.value))}
                    min={0}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Thưởng Kim Cương
                  </label>
                  <input
                    type="number"
                    value={formRewardDiamonds}
                    onChange={(e) => setFormRewardDiamonds(Number(e.target.value))}
                    min={0}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Ngày Bắt Đầu (Không bắt buộc)
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Ngày Kết Thúc (Không bắt buộc)
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Date Actions */}
              <div className="flex justify-end gap-2 text-[10px] text-slate-500 font-bold">
                <button
                  type="button"
                  onClick={() => { setFormStartDate(''); setFormEndDate(''); }}
                  className="hover:text-slate-300 transition cursor-pointer"
                >
                  🧹 Clear Dates (Make Perpetual)
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition active:scale-[0.98] cursor-pointer"
                >
                  💾 {language === 'vi' ? 'Lưu lại' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
