import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../stores/languageStore';

export const LoadingScreen: React.FC = () => {
  const { language } = useLanguageStore();
  const [progress, setProgress] = useState(0);

  const tipsVi = [
    'Đang kết nối tới thánh địa Lumoria...',
    'Đang mài bén thanh kiếm rỉ sét của Hiệp Sĩ...',
    'Đang hồi phục năng lượng phép thuật cho Pháp Sư...',
    'Đang chuẩn bị hòm đồ và sắp xếp trang bị...',
    'Đang triệu hồi quái vật Jelly tinh nghịch...',
    'Đang chất đầy vàng và kim cương vào phụ bản...',
    'Đang tính toán thuộc tính chỉ số các trang bị...',
    'Đang chuẩn bị sảnh bang hội và phòng rèn đồ...'
  ];

  const tipsEn = [
    'Connecting to the sacred realm of Lumoria...',
    'Sharpening the Knight\'s rusty sword...',
    'Restoring magical energy for the Mage...',
    'Preparing the inventory and arranging gear...',
    'Summoning playful Jelly monsters...',
    'Filling the dungeons with gold and diamonds...',
    'Calculating stats and attributes for equipment...',
    'Setting up the guild hall and blacksmith forge...'
  ];

  const tips = language === 'vi' ? tipsVi : tipsEn;
  const [tipIndex, setTipIndex] = useState(Math.floor(Math.random() * tips.length));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const changeTip = () => {
      setTipIndex((prev) => {
        if (tips.length <= 1) return 0;
        let nextIdx = prev;
        while (nextIdx === prev) {
          nextIdx = Math.floor(Math.random() * tips.length);
        }
        return nextIdx;
      });
      const nextDelay = Math.floor(Math.random() * 1300) + 1500; // 1.5s to 2.8s
      timer = setTimeout(changeTip, nextDelay);
    };

    timer = setTimeout(changeTip, 1800);
    return () => clearTimeout(timer);
  }, [tips]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateProgress = () => {
      setProgress((prev) => {
        if (prev >= 99) return 99;

        let inc = 1;
        if (prev < 40) {
          inc = Math.floor(Math.random() * 8) + 4; // 4-11%
        } else if (prev < 75) {
          inc = Math.floor(Math.random() * 5) + 2; // 2-6%
        } else if (prev < 90) {
          inc = Math.floor(Math.random() * 3) + 1; // 1-3%
        } else {
          inc = Math.random() > 0.65 ? 1 : 0; // 0-1%
        }

        const next = prev + inc;
        return next > 99 ? 99 : next;
      });

      const nextDelay = Math.floor(Math.random() * 100) + 40; // 40-140ms
      timer = setTimeout(updateProgress, nextDelay);
    };

    timer = setTimeout(updateProgress, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#070b19] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
      {/* Radiant Background Glows */}
      <div className="absolute w-[450px] h-[450px] bg-purple-900/10 rounded-full blur-[120px] -top-20 -left-20 animate-pulse duration-[8s]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] -bottom-20 -right-20 animate-pulse duration-[6s]" />
      <div className="absolute w-[350px] h-[350px] bg-indigo-900/15 rounded-full blur-[90px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Loading Card Container */}
      <div className="relative z-10 w-[90%] max-w-sm bg-slate-950/45 backdrop-blur-xl border border-slate-900/80 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6">

        {/* Animated Spinners Wrapper */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Pulsing Backglow */}
          <div className="absolute inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full blur-md opacity-25 animate-pulse" />

          {/* Outer Rotating Dotted Circle */}
          <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-spin duration-[20s]" />

          {/* Middle Glowing Ring */}
          <div className="absolute inset-2 border-2 border-transparent border-t-blue-500 border-b-purple-500 rounded-full animate-spin duration-[3s]" />

          {/* Inner Glowing Ring (Reverse spin) */}
          <div className="absolute inset-4 border border-transparent border-l-cyan-400 border-r-indigo-400 rounded-full animate-spin-reverse duration-[1.5s]" />

          {/* Center Pulsing Emblem */}
          <div className="relative z-10 w-12 h-12 bg-slate-950/80 border border-slate-850 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <span className="text-2xl animate-bounce duration-[1.5s]">⚔️</span>
          </div>
        </div>

        {/* Text Headers */}
        <div className="space-y-1.5 w-full">
          <h1 className="text-lg font-black tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 uppercase font-display drop-shadow-[0_0_8px_rgba(99,102,241,0.25)]">
            {language === 'vi' ? 'Đang Đồng Bộ Hóa' : 'Synchronizing Realm'}
          </h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
            {language === 'vi' ? 'Thiết lập kết nối an toàn...' : 'Establishing secure channel...'}
          </p>
        </div>

        {/* Dynamic Tip Text Wrapper */}
        <div className="h-10 flex items-center justify-center w-full px-2">
          <p
            className="text-[10.5px] text-slate-400 leading-relaxed font-semibold italic animate-fade-in text-center"
          >
            {tips[tipIndex]}
          </p>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full space-y-2.5">
          <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80 p-[1.5px] relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            {/* Pulsing Gradient Flow */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-200 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

              {/* Glowing tip */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full blur-[2px] opacity-90 shadow-[0_0_8px_#3b82f6]" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider px-0.5">
            <span>{language === 'vi' ? 'Tiến độ đồng bộ' : 'Sync Progress'}</span>
            <span className="font-mono text-indigo-400 font-black">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
