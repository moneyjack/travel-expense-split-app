import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next'; // 引入 Trans
import { supabase } from '../../lib/supabase'; 
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import appLogo from '../../assets/logo.png';

export const JoinTripView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { trips, user, fetchTrips } = useTripContext();

  const [tripName, setTripName] = useState('');
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // --- Auth States ---
  const [claimingMember, setClaimingMember] = useState<{id: string, name: string} | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false); 
  const [authLoading, setAuthLoading] = useState(false);

  // 1. 檢查成員狀態
  useEffect(() => {
    if (trips.some(t => t.id === tripId)) {
        navigate('/');
    }
  }, [trips, tripId, navigate]);

  // 2. 抓取資料
  useEffect(() => {
    const fetchTripDetails = async () => {
        if (!tripId) return;
        const { data: tripData } = await supabase.from('trips').select('name').eq('id', tripId).single();
        if (tripData) setTripName(tripData.name);

        const { data: membersData } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', tripId)
            .is('user_id', null);

        if (membersData) setAvailableMembers(membersData);
        setLoadingMembers(false);
    };
    fetchTripDetails();
  }, [tripId]);

  // 3. 執行加入
  const executeJoin = async (memberId: string, specificUserId?: string) => {
      const targetUserId = specificUserId || user?.id;
      if (!targetUserId) return;

      try {
          const { error } = await supabase.from('trip_members').update({ user_id: targetUserId }).eq('id', memberId);
          if (error) throw error;
          await fetchTrips(); 
          navigate('/');
      } catch (error: any) {
          alert(t('join.alerts.join_failed') + error.message);
      }
  };

  // 4. 點擊邏輯
  const handleMemberClick = (memberId: string, memberName: string) => {
      if (user) {
          if (confirm(t('join.modal.confirm_claim', { name: memberName }))) {
              executeJoin(memberId);
          }
      } else {
          setClaimingMember({ id: memberId, name: memberName });
          setIsLoginMode(false);
          setShowOtpInput(false);
      }
  };

  const handleSendOtp = async () => {
      if (!email.trim()) return alert(t('join.alerts.enter_email'));
      setAuthLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
          if (error) throw error;
          setShowOtpInput(true);
          alert(t('join.alerts.code_sent'));
      } catch (e: any) {
          alert(e.message);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleVerifyOtp = async () => {
      if (!otpToken.trim()) return alert(t('join.alerts.enter_code'));
      setAuthLoading(true);
      try {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
              email: email.trim(),
              token: otpToken.trim(),
              type: 'email',
          });
          if (error) throw error;
          if (claimingMember && session?.user) {
              await executeJoin(claimingMember.id, session.user.id);
          } else {
              await fetchTrips();
              setIsLoginMode(false);
          }
      } catch (e: any) {
          alert(t('join.alerts.auth_failed'));
          setAuthLoading(false);
      }
  };

  if (loadingMembers) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('join.loading_details')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center animate-in fade-in relative">
       <div className="absolute top-6 right-6"><LanguageSwitcher /></div>
       
       <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
           <div className="flex justify-center mb-6">
                <img 
                src={appLogo} 
                alt="Logo" 
                className="w-24 h-24 rounded-[1.5rem] shadow-lg shadow-indigo-200 hover:scale-105 transition-transform duration-300" 
                />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">{t('app_name')}</h1>
                <p className="text-gray-500 text-center mb-8 text-sm">
                {t('app_slogan')}
                </p>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('join.title', { name: tripName })}</h2>
           <p className="text-gray-500 mb-8">{t('join.question')}</p>

           {availableMembers.length === 0 ? (
               <div className="bg-gray-50 text-gray-500 p-6 rounded-xl mb-4 border border-gray-100">
                   <p className="font-bold text-gray-800 mb-1">{t('join.no_slots_title')}</p>
                   <p className="text-xs">{t('join.no_slots_desc')}</p>
               </div>
           ) : (
               <div className="space-y-3">
                   {availableMembers.map(m => (
                       <button key={m.id} onClick={() => handleMemberClick(m.id, m.name)} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-indigo-50 transition-all group">
                           <div className={`w-12 h-12 rounded-full ${m.color || 'bg-gray-300'} flex items-center justify-center text-xl shadow-sm border-2 border-white`}>
                               {m.avatar || m.name[0]}
                           </div>
                           <div className="text-left flex-1">
                               <p className="font-bold text-gray-800 group-hover:text-primary">{m.name}</p>
                               <p className="text-xs text-gray-400">{t('join.tap_to_claim')}</p>
                           </div>
                       </button>
                   ))}
               </div>
           )}

           <div className="mt-8 space-y-3">
               {!user && (
                   <button onClick={() => setIsLoginMode(true)} className="w-full py-3 text-primary font-bold text-sm hover:bg-indigo-50 rounded-xl">
                       {t('join.already_member')}
                   </button>
               )}
               <Button variant="secondary" onClick={() => navigate('/')} className="w-full">{t('join.go_home')}</Button>
           </div>
       </div>

       {(claimingMember || isLoginMode) && !user && (
           <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                   <h3 className="text-xl font-bold text-gray-900 mb-2">
                       {showOtpInput ? t('join.modal.enter_code') : t('join.modal.login_signup')}
                   </h3>
                   
                   <div className="text-gray-500 text-sm mb-6">
                       {claimingMember ? (
                         <Trans i18nKey="join.modal.claim_hint" values={{ name: claimingMember.name }}>
                           To claim <span className="font-bold text-primary"></span>, please verify your email.
                         </Trans>
                       ) : t('join.modal.login_hint')}
                   </div>

                   {!showOtpInput ? (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('join.modal.email_label')}</label>
                               <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" placeholder="name@example.com" />
                           </div>
                           <Button onClick={handleSendOtp} className="w-full py-3" disabled={authLoading}>
                               {authLoading ? t('join.modal.sending') : t('join.modal.send_code')}
                           </Button>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('join.modal.code_label')}</label>
                               <input type="text" value={otpToken} onChange={e => setOtpToken(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 text-center text-2xl tracking-widest font-bold" placeholder="00000000" />
                           </div>
                           <Button onClick={handleVerifyOtp} className="w-full py-3" disabled={authLoading}>
                               {authLoading ? t('join.modal.verifying') : t('join.modal.verify')}
                           </Button>
                           <button onClick={() => setShowOtpInput(false)} className="w-full text-sm text-gray-400 mt-2">{t('join.modal.change_email')}</button>
                       </div>
                   )}

                   <button onClick={() => { setClaimingMember(null); setIsLoginMode(false); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};