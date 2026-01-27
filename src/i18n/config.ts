import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 引入你的 json 檔
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(LanguageDetector) // 自動偵測瀏覽器語言
  .use(initReactI18next) // 綁定 React
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'en', // 如果偵測不到語言，預設用英文
    interpolation: {
      escapeValue: false, // React 已經預設防 XSS，這裡不用處理
    },
  });

export default i18n;