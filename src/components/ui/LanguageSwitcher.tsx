import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = ({ className = '' }: { className?: string }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // 你甚至可以存入 localStorage，下次進來自動記住
    localStorage.setItem('app-language', lng);
  };

  return (
    <div className={`flex items-center bg-gray-100 rounded-full p-1 ${className}`}>
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
          i18n.language.startsWith('en') 
            ? 'bg-white text-primary shadow-sm' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('zh')}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
          i18n.language.startsWith('zh') 
            ? 'bg-white text-primary shadow-sm' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        中文
      </button>
    </div>
  );
};