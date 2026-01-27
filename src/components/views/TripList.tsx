import React, { useEffect, useState } from 'react';
import { Trip } from '../../types'; // 請確認路徑
// import { formatCurrency } from '../../utils/currency'; // 如果你有這個工具函式就打開
import { supabase } from '../../lib/supabase';

// --- Icons ---
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><path d="M2 20h20v-2H2v2zm2-3h16l-3-9-4 6-4-6-5 9z"/></svg> // ★ 新增皇冠圖示
};

// --- Avatar Component (保持之前的修復) ---
const Avatar = ({ member, size = 'md' }: { member: any, size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs', // 稍微調大一點比較好看
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };
  // 防呆：如果沒有名字，給預設值
  const firstLetter = member.name?.[0] || '?';
  const bgColor = member.color || 'bg-gray-400'; // 防呆顏色

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
}

export const TripList: React.FC<TripListProps> = ({ trips, onSelectTrip, onCreateTrip }) => {
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // 1. 取得當前用戶 ID (為了比對 Host)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // 2. 登出功能
  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      const { error } = await supabase.auth.signOut();
      if (error) alert(error.message);
    }
  };

  // 簡單的貨幣格式化 (如果你沒有 utils)
  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'HKD' }).format(amount);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">算鳩數</h1>
           <p className="text-gray-500 text-sm font-medium">Let's split the bills!</p>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="p-3 bg-white text-gray-400 rounded-full border border-gray-100 shadow-sm hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
          title="Log Out"
        >
          <Icons.Logout />
        </button>
      </div>

      {/* Trip List Grid */}
      <div className="space-y-4">
        {/* Create New Trip Button */}
        <button 
          onClick={onCreateTrip}
          className="flex items-center gap-4 p-5 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary hover:text-primary hover:bg-indigo-50/50 transition-all group w-full text-left shadow-sm"
        >
           <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-colors">
             <Icons.Plus />
           </div>
           <span className="font-bold text-lg">Create New Trip</span>
        </button>

        {/* Existing Trips */}
        {trips.length === 0 ? (
           <div className="text-center py-10 opacity-50">
              <p>No trips yet.</p>
           </div>
        ) : (
           trips.map((trip) => {
            // ★ 計算是否為 Host
            // 邏輯：檢查 created_by，或者檢查成員列表裡的 is_host 標記
            const isCreator = trip.created_by === currentUserId;
            // 雙重確認：有時候 created_by 沒抓到，改抓成員表
            const isHostMember = trip.members.some(m => m.user_id === currentUserId && (m.isHost || m.is_host));
            const amIHost = isCreator || isHostMember;

            const totalAmount = trip.expenses?.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0) || 0;

            return (
              <div 
                key={trip.id} // ★ 必填 key
                onClick={() => onSelectTrip(trip.id)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden"
              >
                 {/* Top Row: Name & Date */}
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-800">{trip.name}</h3>
                            {/* ★ Host 標記 (皇冠 + 文字) */}
                            {amIHost && (
                                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                                    <Icons.Crown /> HOST
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
                    {/* Face pile */}
                    <div className="flex -space-x-2 pl-1">
                      {trip.members && trip.members.slice(0, 4).map((member) => (
                         <div key={member.id}> {/* ★ 必填 key */}
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
                      {trip.expenses?.length || 0} receipts
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