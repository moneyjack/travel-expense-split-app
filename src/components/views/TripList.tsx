import React, { useEffect, useState } from 'react';
import { Trip } from '../../types'; 
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next'; // ★ 引入 hook
import { Skeleton } from '../ui/Skeleton';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { motion } from 'framer-motion';

// --- Icons ---
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><path d="M2 20h20v-2H2v2zm2-3h16l-3-9-4 6-4-6-5 9z"/></svg>
};

const Avatar = ({ member, size = 'md' }: { member: any, size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };
  const firstLetter = member.name?.[0] || '?';
  const bgColor = member.color || 'bg-gray-400';

  return (
    <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white shrink-0`}>
      {member.avatar || firstLetter}
    </div>
  );
};

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (id: string) => void;
  onCreateTrip: () => void;
  onSimulateGuestLink: (id: string) => void;
  loading?: boolean;
}

export const TripList: React.FC<TripListProps> = ({ trips, onSelectTrip, onCreateTrip, loading }) => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { t } = useTranslation(); // ★ 初始化翻譯函式

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const handleLogout = async () => {
    if (confirm(t('home.logout_confirm'))) { // ★ 使用翻譯
      const { error } = await supabase.auth.signOut();
      if (error) alert(error.message);
    }
  };

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'HKD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 pb-24 animate-pulse">
        
        {/* 1. Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
             {/* 模擬 Title: "My Trips" */}
             <Skeleton className="h-9 w-40 mb-3 rounded-lg" />
             {/* 模擬 Subtitle: "Let's split..." */}
             <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          
          <div className="flex items-center gap-4">
            {/* 模擬 Language Switcher */}
            <Skeleton className="h-8 w-16 rounded-full" />
            {/* 模擬 Logout Button */}
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="space-y-4">
          {/* 2. Create Trip Button Skeleton (虛線框按鈕) */}
          <div className="h-20 w-full bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200" />

          {/* 3. Trip Cards Skeleton (模擬真實卡片) */}
          {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                 {/* Top Row: Title & Amount */}
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-2 w-2/3">
                        {/* 模擬 Trip Name */}
                        <Skeleton className="h-7 w-1/2 rounded-lg" />
                        {/* 模擬 Date */}
                        <Skeleton className="h-3 w-1/3 rounded-md" />
                    </div>
                    {/* 模擬 Amount Pill */}
                    <Skeleton className="h-6 w-16 rounded-lg" />
                 </div>

                 {/* Bottom Row: Avatars & Receipt Count */}
                 <div className="flex justify-between items-center mt-6">
                    {/* 模擬頭像群組 */}
                    <div className="flex -space-x-2 pl-1">
                        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
                        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
                        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
                    </div>
                    
                    {/* 模擬 "12 Receipts" Pill */}
                    <Skeleton className="h-6 w-24 rounded-full" />
                 </div>
             </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 min-h-screen bg-gray-50 pb-24 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">{t('home.title')}</h1>
           <p className="text-gray-500 text-sm font-medium">{t('home.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button 
            onClick={handleLogout}
            className="p-3 bg-white text-gray-400 rounded-full border border-gray-100 shadow-sm hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
            title={t('home.logout_tooltip')}
          >
            <Icons.Logout />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onCreateTrip}
          className="flex items-center gap-4 p-5 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary hover:text-primary hover:bg-indigo-50/50 transition-all group w-full text-left shadow-sm"
        >
           <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-colors">
             <Icons.Plus />
           </div>
           <span className="font-bold text-lg">{t('home.create_trip')}</span>
        </button>

        {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-50 relative">
                <span className="text-8xl">🌏</span>
                {/* 裝飾一個小飄浮氣泡 */}
                <div className="absolute -right-2 top-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  {t('home.welcome')}
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('home.no_trips')}</h3>
            <p className="text-gray-400 max-w-[200px] mb-8">{t('home.no_trips_desc')}</p>
            
            <button onClick={onCreateTrip} className="px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 bg-primary text-white font-bold hover:shadow-lg transition-all active:scale-95">
              {t('home.create_first_trip')}
            </button>
          </div>
        ) : (
           trips.map((trip) => {
            const isCreator = trip.created_by === currentUserId;
            const isHostMember = trip.members.some(m => m.user_id === currentUserId && (m.isHost || m.is_host));
            const amIHost = isCreator || isHostMember;
            const totalAmount = trip.expenses?.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0) || 0;

            return (
              <div 
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-800">{trip.name}</h3>
                            {amIHost && (
                                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                                    <Icons.Crown /> {t('home.host_badge')}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium mt-1">
                            {new Date(trip.date).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="text-right">
                         <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                            {formatMoney(totalAmount, trip.currency)}
                        </span>
                    </div>
                 </div>

                 <div className="flex justify-between items-center mt-4">
                    <div className="flex -space-x-2 pl-1">
                      {trip.members && trip.members.slice(0, 4).map((member) => (
                         <div key={member.id}>
                           <Avatar member={member} size="sm" />
                         </div>
                      ))}
                      {trip.members && trip.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{trip.members.length - 4}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full">
                      {t('home.receipts_count', { count: trip.expenses?.length || 0 })}
                    </span>
                 </div>
              </div>
            );
           })
        )}
      </div>
    </div>
  );
};