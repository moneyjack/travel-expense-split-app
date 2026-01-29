import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook
export const ScanLoading = () => {

    const { t } = useTranslation(); // ★ 初始化翻譯
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      
      {/* 1. 背景：深色毛玻璃 (Blur Backdrop) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      {/* 2. 主體卡片 */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* 動畫容器 */}
        <div className="relative w-32 h-40 bg-white/10 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden mb-6">
            
            {/* 收據圖示 (靜態) */}
            <div className="w-20 h-28 bg-white/20 rounded-lg flex flex-col gap-2 p-3">
                <div className="w-8 h-8 bg-white/30 rounded-full mb-1" /> {/* Logo */}
                <div className="w-14 h-1.5 bg-white/30 rounded-full" /> {/* Title */}
                <div className="w-full h-[1px] bg-white/10 my-1" /> {/* Divider */}
                <div className="w-full flex justify-between">
                   <div className="w-8 h-1.5 bg-white/30 rounded-full" />
                   <div className="w-4 h-1.5 bg-white/30 rounded-full" />
                </div>
                <div className="w-full flex justify-between">
                   <div className="w-10 h-1.5 bg-white/30 rounded-full" />
                   <div className="w-3 h-1.5 bg-white/30 rounded-full" />
                </div>
                <div className="w-full flex justify-between">
                   <div className="w-6 h-1.5 bg-white/30 rounded-full" />
                   <div className="w-5 h-1.5 bg-white/30 rounded-full" />
                </div>
                <div className="mt-auto w-10 h-1.5 bg-white/40 rounded-full self-end" /> {/* Total */}
            </div>

            {/* ★★★ 掃描光束 (Scanning Beam) ★★★ */}
            <motion.div 
              animate={{ top: ['-10%', '110%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear",
                repeatDelay: 0.1 
              }}
              className="absolute left-0 right-0 h-12 bg-gradient-to-b from-indigo-500/0 via-indigo-400/50 to-indigo-500/0 border-b-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-20"
              style={{ top: '-10%' }}
            />
            
            {/* 粒子特效 (裝飾) */}
            <motion.div 
               animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-2 right-2 text-xl"
            >
                ✨
            </motion.div>
        </div>

        {/* 3. 文字區域 */}
        <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white tracking-wide">
                {t('scan.loading.title')}
            </h3>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-indigo-200 text-sm font-medium"
            >
              {t('scan.loading.subtitle')}
            </motion.p>
        </div>

      </motion.div>
    </div>
  );
};