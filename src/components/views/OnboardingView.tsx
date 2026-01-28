import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook


export const OnboardingView = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const { t } = useTranslation(); // ★ 初始化翻譯

  const STEPS = [
    {
      title: t('onboarding.step1_title'),
      desc: t('onboarding.step1_desc'),
      color: 'bg-blue-50'
    },
    {
      title: t('onboarding.step2_title'),
      desc: t('onboarding.step2_desc'),
      color: 'bg-indigo-50'
    },
    {
      title: t('onboarding.step3_title'),
      desc: t('onboarding.step3_desc'),
      color: 'bg-green-50'
    }
  ];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  // 內容切換動畫參數
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: "spring", bounce: 0.3 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-between p-6 overflow-hidden">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
        </div>
      {/* 頂部裝飾：稍微淡入淡出 */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />

      {/* --- 主要內容區 --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mt-10">
        
        {/* 動畫插圖容器 (固定高度避免跳動) */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
          <AnimatePresence mode='popLayout' initial={false} custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              
              {/* === 場景 1: 飛機繞地球 (動感加速版) === */}
              {step === 0 && (
                <div className="relative w-full h-full flex items-center justify-center">
                   {/* 背景雲朵 - 加速移動製造速度感 */}
                   <motion.div 
                     animate={{ x: [50, -50], opacity: [0, 0.4, 0] }} 
                     transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                     className="absolute top-10 right-4 text-6xl opacity-20 blur-[1px]"
                   >☁️</motion.div>
                   <motion.div 
                     animate={{ x: [60, -60], opacity: [0, 0.3, 0] }} 
                     transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
                     className="absolute bottom-16 left-6 text-5xl opacity-20 blur-[2px]"
                   >☁️</motion.div>

                   {/* 地球 - 輕微縮放 */}
                   <motion.div 
                     animate={{ scale: [1, 1.05, 1] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                     className="relative z-10 text-[8rem] drop-shadow-2xl"
                   >
                     🌏
                   </motion.div>

                   {/* 飛機軌道容器 (旋轉) - 加快速度 */}
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }} // 從 8s 改成 4s
                     className="absolute inset-0 z-20"
                   >
                      {/* 飛機 (定位在軌道邊緣) */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8">
                        <motion.div 
                          className="text-6xl drop-shadow-lg"
                          // 加入機身搖擺 (Banking) 效果
                          animate={{ rotate: [90, 80, 100, 90] }} 
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ✈️
                        </motion.div>
                      </div>
                   </motion.div>
                </div>
              )}

              {/* === 場景 2: AI 掃描收據 (保持不變) === */}
              {step === 1 && (
                <div className="relative w-full h-full flex items-center justify-center">
                   {/* 收據卡片 */}
                   <div className="w-40 h-56 bg-white border-2 border-gray-100 rounded-xl shadow-xl flex flex-col items-center pt-4 gap-3 relative overflow-hidden transform -rotate-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full mb-2"></div>
                      <div className="w-24 h-3 bg-gray-100 rounded-full"></div>
                      <div className="w-20 h-2 bg-gray-50 rounded-full"></div>
                      <div className="w-full border-t border-dashed border-gray-200 my-1"></div>
                      <div className="w-28 h-2 bg-gray-50 rounded-full"></div>
                      <div className="w-28 h-2 bg-gray-50 rounded-full"></div>
                      <div className="w-16 h-2 bg-gray-50 rounded-full mr-auto ml-6"></div>

                      {/* 掃描光線動畫 */}
                      <motion.div 
                        animate={{ top: ['0%', '120%', '0%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-12 bg-gradient-to-b from-primary/20 to-transparent border-t-2 border-primary/50 z-10"
                      />
                   </div>

                   {/* 相機圖示 */}
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1, rotate: [0, 10, 0] }}
                     transition={{ 
                        scale: { type: "spring", bounce: 0.5, delay: 0.3 },
                        rotate: { duration: 0.5, delay: 0.4, ease: "easeInOut" }
                     }}
                     className="absolute -right-2 bottom-10 text-6xl drop-shadow-xl"
                   >
                     📸
                   </motion.div>
                </div>
              )}

              {/* === 場景 3: 分帳結算 (錢幣大爆炸版) === */}
              {step === 2 && (
                <div className="relative w-full h-full flex items-center justify-center">
                   {/* 錢袋 (核心) */}
                   <motion.div 
                     animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} // 加入搖晃
                     transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                     className="text-[8rem] drop-shadow-2xl z-20"
                   >
                     💰
                   </motion.div>

                   {/* 飛出的鈔票與金幣 - 使用陣列生成更多 */}
                   {[
                     { icon: '💸', x: -100, y: -120, delay: 0.1, scale: 1.2 },
                     { icon: '💵', x: 100, y: -120, delay: 0.2, scale: 1 },
                     { icon: '💴', x: -80, y: -160, delay: 0.3, scale: 0.8 },
                     { icon: '💶', x: 80, y: -160, delay: 0.15, scale: 0.9 },
                     { icon: '🪙', x: -120, y: -60, delay: 0.25, scale: 1.1 },
                     { icon: '🪙', x: 120, y: -60, delay: 0.35, scale: 1 },
                     { icon: '✨', x: 0, y: -180, delay: 0.4, scale: 1.5 }, // 頂部閃光
                   ].map((item, index) => (
                     <motion.div 
                       key={index}
                       initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                       animate={{ 
                         opacity: [0, 1, 0], 
                         scale: [0, item.scale, item.scale * 0.8],
                         x: item.x, 
                         y: item.y,
                         rotate: Math.random() * 360 // 隨機旋轉
                       }}
                       transition={{ 
                         duration: 2, 
                         repeat: Infinity, 
                         delay: item.delay, 
                         ease: "easeOut" 
                       }}
                       className="absolute top-1/2 left-1/2 text-4xl z-10"
                     >
                       {item.icon}
                     </motion.div>
                   ))}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* 文字區 */}
        <div className="text-center space-y-4 px-4 h-32">
          <AnimatePresence mode='wait'>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                {STEPS[step].title}
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                {STEPS[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- 底部按鈕區 --- */}
      <div className="w-full max-w-sm space-y-8 pb-8 z-10">
        {/* 進度點 */}
        <div className="flex justify-center gap-3">
          {STEPS.map((_, idx) => (
            <motion.div 
              key={idx}
              className={`h-2.5 rounded-full ${idx === step ? 'bg-primary' : 'bg-gray-200'}`}
              animate={{ 
                width: idx === step ? 32 : 10,
                backgroundColor: idx === step ? '#4F46E5' : '#E5E7EB'
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <Button 
          onClick={handleNext} 
          className="w-full py-4 text-xl rounded-2xl shadow-xl shadow-indigo-200 font-bold active:scale-95 transition-transform"
        >
          {step === STEPS.length - 1 ? t('onboarding.start') : t('onboarding.next')}
        </Button>
        
        {step < STEPS.length - 1 && (
            <button onClick={onFinish} className="w-full text-gray-400 text-sm font-bold py-2 hover:text-gray-600">
                {t('onboarding.skip')}
            </button>
        )}
      </div>

    </div>
  );
};