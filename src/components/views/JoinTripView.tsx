import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';

export const JoinTripView = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  // ★ 1. 把 fetchTrips 拿出來，登入成功後要手動刷新
  const { joinTripAsMember, trips, user, fetchTrips } = useTripContext();

  const [tripName, setTripName] = useState('');
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // --- Auth & OTP States ---
  const [claimingMember, setClaimingMember] = useState<{id: string, name: string} | null>(null);
  // ★ 2. 新增：控制是否為「純登入模式」
  const [isLoginMode, setIsLoginMode] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false); 
  const [authLoading, setAuthLoading] = useState(false);

  // 1. 檢查是否已經是成員了 (如果登入後發現 user 在這個 trip 裡，會自動跳轉)
  useEffect(() => {
    if (trips.some(t => t.id === tripId)) {
        navigate('/');
    }
  }, [trips, tripId, navigate]);

  // 2. 抓取旅程資料
  useEffect(() => {
    const fetchTripDetails = async () => {
        if (!tripId) return;
        
        const { data: tripData } = await supabase
            .from('trips')
            .select('name')
            .eq('id', tripId)
            .single();
            
        if (tripData) setTripName(tripData.name);

        const { data: membersData } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', tripId)
            .is('user_id', null);

        if (membersData) {
            setAvailableMembers(membersData);
        }
        setLoadingMembers(false);
    };

    fetchTripDetails();
  }, [tripId]);

  // 3. 執行加入 (認領模式用)
  const executeJoin = async (memberId: string, specificUserId?: string) => {
      const targetUserId = specificUserId || user?.id;
      if (!targetUserId) return alert("Error: User not identified.");

      try {
          const { error } = await supabase
              .from('trip_members')
              .update({ user_id: targetUserId })
              .eq('id', memberId);

          if (error) throw error;
          await fetchTrips(); 
          navigate('/');
      } catch (error: any) {
          alert("Join failed: " + error.message);
      }
  };

  // 4. 點擊成員 (認領邏輯)
  const handleMemberClick = (memberId: string, memberName: string) => {
      if (user) {
          if (confirm(`Confirm that you are "${memberName}"?`)) {
              executeJoin(memberId);
          }
      } else {
          setClaimingMember({ id: memberId, name: memberName });
          setIsLoginMode(false); // 確保不是純登入模式
          setShowOtpInput(false);
          setOtpToken('');
      }
  };

  // ★ 5. 點擊登入按鈕 (純登入邏輯)
  const handleGeneralLoginClick = () => {
      setIsLoginMode(true);
      setClaimingMember(null); // 確保不是認領模式
      setShowOtpInput(false);
      setOtpToken('');
  };

  const handleSendOtp = async () => {
      if (!email.trim()) return alert("Please enter email");
      setAuthLoading(true);

      try {
          const { error } = await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: { shouldCreateUser: true } 
          });

          if (error) throw error;
          
          setShowOtpInput(true);
          alert("Verification code sent to your email!");
      } catch (e: any) {
          alert(e.message);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleVerifyOtp = async () => {
      if (!otpToken.trim()) return alert("Please enter the code");
      setAuthLoading(true);

      try {
          const { data: { session }, error } = await supabase.auth.verifyOtp({
              email: email.trim(),
              token: otpToken.trim(),
              type: 'email',
          });

          if (error) throw error;
          if (!session?.user) throw new Error("No user session created");

          // ★ 登入成功後的處理
          if (claimingMember) {
              // 情況 A: 認領模式 -> 執行綁定
              await executeJoin(claimingMember.id, session.user.id);
          } else {
              // 情況 B: 純登入模式 -> 刷新列表
              // Context 的 useEffect 會偵測到 trips 變化，如果 user 是成員，上面的 useEffect 就會自動跳轉
              await fetchTrips();
              
              // 關閉 Modal
              setIsLoginMode(false);
          }
          
      } catch (e: any) {
          alert("Invalid code or expired. Please try again.");
          setAuthLoading(false);
      }
  };

  const closeModal = () => {
      setClaimingMember(null);
      setIsLoginMode(false);
  };

  if (loadingMembers) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading trip details...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center animate-in fade-in relative">
       
       <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
               ✈️
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Join "{tripName}"</h2>
           <p className="text-gray-500 mb-8">Who are you in this trip?</p>

           {availableMembers.length === 0 ? (
               <div className="bg-gray-50 text-gray-500 p-6 rounded-xl mb-4 border border-gray-100">
                   <p className="font-bold text-gray-800 mb-1">No empty slots?</p>
                   <p className="text-xs">If you are already a member, please log in below.</p>
               </div>
           ) : (
               <div className="space-y-3">
                   {availableMembers.map(m => (
                       <button
                           key={m.id}
                           onClick={() => handleMemberClick(m.id, m.name)}
                           className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-indigo-50 transition-all group active:scale-95"
                       >
                           <div className={`w-12 h-12 rounded-full ${m.color || 'bg-gray-300'} flex items-center justify-center text-xl shadow-sm border-2 border-white`}>
                               {m.avatar || m.name[0]}
                           </div>
                           <div className="text-left flex-1">
                               <p className="font-bold text-gray-800 group-hover:text-primary transition-colors">{m.name}</p>
                               <p className="text-xs text-gray-400">Tap to claim</p>
                           </div>
                       </button>
                   ))}
               </div>
           )}

           <div className="mt-8 space-y-3">
               {/* ★ 6. 新增：純登入按鈕 */}
               {!user && (
                   <button 
                       onClick={handleGeneralLoginClick}
                       className="w-full py-3 text-primary font-bold text-sm hover:bg-indigo-50 rounded-xl transition-colors"
                   >
                       Already a member? Log In
                   </button>
               )}

               <Button variant="secondary" onClick={() => navigate('/')} className="w-full">
                   Go to Home
               </Button>
           </div>
       </div>

       {/* ★ Auth Modal (控制條件：claimingMember 或 isLoginMode) */}
       {(claimingMember || isLoginMode) && !user && (
           <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                   <h3 className="text-xl font-bold text-gray-900 mb-2">
                       {showOtpInput ? 'Enter Verification Code' : 'Login / Sign Up'}
                   </h3>
                   
                   {/* 動態顯示提示文字 */}
                   <p className="text-gray-500 text-sm mb-6">
                       {claimingMember 
                         ? <span>To claim <span className="font-bold text-primary">{claimingMember.name}</span>, please verify your email.</span>
                         : <span>Log in to access your trip dashboard.</span>
                       }
                   </p>

                   {!showOtpInput ? (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                               <input 
                                   type="email" 
                                   value={email}
                                   onChange={e => setEmail(e.target.value)}
                                   className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 mt-1"
                                   placeholder="name@example.com"
                                   autoFocus
                               />
                           </div>
                           <Button onClick={handleSendOtp} className="w-full py-3" disabled={authLoading}>
                               {authLoading ? 'Sending...' : 'Send Code'}
                           </Button>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-400 uppercase ml-1">8h-Digit Code</label>
                               <input 
                                   type="text" 
                                   inputMode="numeric"
                                   maxLength={8}
                                   value={otpToken}
                                   onChange={e => setOtpToken(e.target.value)}
                                   className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 mt-1 text-center text-2xl tracking-widest font-bold"
                                   placeholder="00000000"
                                   autoFocus
                               />
                           </div>
                           <Button onClick={handleVerifyOtp} className="w-full py-3" disabled={authLoading}>
                               {authLoading ? 'Verifying...' : 'Login'}
                           </Button>
                           
                           <button 
                             onClick={() => setShowOtpInput(false)} 
                             className="w-full text-sm text-gray-400 mt-2 hover:text-gray-600"
                           >
                               ← Change Email
                           </button>
                       </div>
                   )}

                   <button 
                       onClick={closeModal}
                       className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                   >
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};