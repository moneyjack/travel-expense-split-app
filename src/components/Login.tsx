import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // 請確認你的 supabase路徑
import { Button } from './ui/Button'; // 假設你有這個 Button 組件

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email'); // 控制目前是輸入 Email 還是 OTP

  // 1. 發送驗證碼
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return alert("Please enter your email");
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // 如果沒帳號就自動註冊
        },
      });

      if (error) throw error;
      
      // 發送成功，切換到輸入 OTP 模式
      setStep('otp');
      alert('Verification code sent to your email!');
    } catch (error: any) {
      alert(error.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // 2. 驗證 OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return alert("Please enter the code");

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;
      // 驗證成功後，Supabase 會自動更新 Session
      // App.tsx 裡的 onAuthStateChange 會偵測到並自動切換畫面，這裡不用做 navigate
      
    } catch (error: any) {
      alert('Invalid code or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8">
        
        {/* Logo or Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ✈️
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? 'Welcome 算鳩數' : 'Check your Email'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'email' 
              ? 'Enter your email to sign in or create an account.' 
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          // --- 步驟一：輸入 Email ---
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary outline-none transition-all font-medium"
                placeholder="name@example.com"
                autoFocus
              />
            </div>
            <Button className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200" disabled={loading}>
              {loading ? 'Sending...' : 'Send Code'}
            </Button>
          </form>
        ) : (
          // --- 步驟二：輸入 OTP ---
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Verification Code</label>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-primary outline-none transition-all text-center text-3xl tracking-[0.5em] font-bold text-gray-800"
                placeholder="000000"
                autoFocus
              />
            </div>
            
            <Button className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </Button>

            <button 
              type="button"
              onClick={() => { setStep('email'); setOtp(''); }}
              className="w-full text-sm text-gray-400 font-medium hover:text-gray-600 py-2"
            >
              ← Enter a different email
            </button>
          </form>
        )}

      </div>
      
      {/* Footer info */}
      <p className="mt-8 text-center text-xs text-gray-400">
        By continuing, you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
};

export default Login;