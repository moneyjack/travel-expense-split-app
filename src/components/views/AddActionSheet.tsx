// src/components/views/AddActionSheet.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'

// 定義一些可愛的 Icon
const Icons = {
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>,
  Pen: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
};

interface AddActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: () => void;
  onManual: () => void;
}

export const AddActionSheet: React.FC<AddActionSheetProps> = ({ isOpen, onClose, onScan, onManual }) => {
  const { t } = useTranslation(); // ★ 初始化翻譯
  if (!isOpen) return null;

  return (
    <>
      {/* 1. 背景遮罩 (點擊空白處關閉) */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* 2. 底部滑出面板 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{t('action_sheet.title')}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <Icons.X />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 按鈕 A: 掃描收據 */}
          <button 
            onClick={onScan}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 hover:bg-indigo-100 hover:scale-[0.98] transition-all active:scale-95"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300">
              <Icons.Camera />
            </div>
            <span className="font-bold text-indigo-900">{t('action_sheet.scan_receipt')}</span>
          </button>

          {/* 按鈕 B: 手動輸入 */}
          <button 
            onClick={onManual}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-pink-50 rounded-3xl border-2 border-pink-100 hover:bg-pink-100 hover:scale-[0.98] transition-all active:scale-95"
          >
            <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-300">
              <Icons.Pen />
            </div>
            <span className="font-bold text-pink-900">{t('action_sheet.manual_entry')}</span>
          </button>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          {t('action_sheet.footer_hint')}
        </div>
      </div>
    </>
  );
};