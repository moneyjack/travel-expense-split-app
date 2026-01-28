import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; 
import { Button } from './ui/Button'; 
import { LanguageSwitcher } from './ui/LanguageSwitcher'; 
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook

const Login = () => {
  const { t } = useTranslation(); // ★ 初始化翻譯
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email'); 

  // 1. 發送驗證碼
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return alert(t('auth.alerts.enter_email')); // ★ i18n
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, 
        },
      });

      if (error) throw error;
      
      setStep('otp');
      alert(t('auth.alerts.code_sent')); // ★ i18n
    } catch (error: any) {
      alert(error.message || t('auth.alerts.send_error')); // ★ i18n
    } finally {
      setLoading(false);
    }
  };

  // 2. 驗證 OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return alert(t('auth.alerts.enter_code')); // ★ i18n

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;
      // App.tsx 會自動處理跳轉
      
    } catch (error: any) {
      alert(t('auth.alerts.invalid_code')); // ★ i18n
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8">
        
        {/* Logo or Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ✈️
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? t('auth.welcome_title') : t('auth.check_email_title')}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'email' 
              ? t('auth.email_desc')
              : t('auth.otp_desc', { email }) // ★ 帶入 email 變數
            }
          </p>
        </div>

        {step === 'email' ? (
          // --- 步驟一：輸入 Email ---
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">{t('auth.email_label')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary outline-none transition-all font-medium"
                placeholder={t('auth.email_placeholder')} // ★ i18n
                autoFocus
              />
            </div>
            <Button className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200" disabled={loading}>
              {loading ? t('auth.sending_btn') : t('auth.send_code_btn')}
            </Button>
          </form>
        ) : (
          // --- 步驟二：輸入 OTP ---
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">{t('auth.otp_label')}</label>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary outline-none transition-all text-center text-3xl tracking-[0.5em] font-bold text-gray-800"
                placeholder={t('auth.otp_placeholder')} // ★ i18n
                autoFocus
              />
            </div>
            
            <Button className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200" disabled={loading}>
              {loading ? t('auth.verifying_btn') : t('auth.login_btn')}
            </Button>

            <button 
              type="button"
              onClick={() => { setStep('email'); setOtp(''); }}
              className="w-full text-sm text-gray-400 font-medium hover:text-gray-600 py-2"
            >
              {t('auth.back_to_email')}
            </button>
          </form>
        )}

      </div>
      
      {/* Footer info */}
      <p className="mt-8 text-center text-xs text-gray-400">
        {t('auth.footer_terms')}
      </p>
    </div>
  );
};

export default Login;