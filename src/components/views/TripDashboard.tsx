import React, { useState, useMemo } from 'react';
import { Trip, Expense } from '../../types'; 
import { ShareModal } from './ShareModal';      
import { SettingsModal } from './SettingsModal';  
import { formatCurrency } from '../../utils/currency';
import { useTripContext } from '../../context/TripContext'; // ★ 1. 引入 Context

// --- Icons ---
const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Receipt: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2 1-2 1-2 1-2 1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  // ★ 新增皇冠圖示
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400 drop-shadow-sm"><path d="M2 20h20v-2H2v2zm2-3h16l-3-9-4 6-4-6-5 9z"/></svg>
};

const Avatar = ({ member, size = 'md' }: { member: any, size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };
  return (
    <div className={`${sizeClasses[size]} ${member.color} rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white`}>
      {member.avatar || member.name[0]}
    </div>
  );
};

interface TripDashboardProps {
  trip: Trip;
  onViewExpense: (expense: Expense) => void;
  onNavigateTripList: () => void;
}

export const TripDashboard: React.FC<TripDashboardProps> = ({ trip, onViewExpense, onNavigateTripList }) => {
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // ★ 2. 取得當前用戶 ID
  const { currentUserId } = useTripContext();

  const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const displayMembers = useMemo(() => {
    return [...trip.members].sort((a: any, b: any) => {
        const isMeA = a.user_id === currentUserId;
        const isMeB = b.user_id === currentUserId;
        const isHostA = a.isHost || a.is_host;
        const isHostB = b.isHost || b.is_host;

        // 1. 自己 (Me) 排第一
        if (isMeA) return -1;
        if (isMeB) return 1;
        
        // 2. 房主 (Host) 排第二
        if (isHostA) return -1;
        if (isHostB) return 1;
        
        return 0; // 其他人維持原樣
    });
  }, [trip.members, currentUserId]);
  const groupedExpenses = useMemo(() => {
    const sorted = [...trip.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: Record<string, Expense[]> = {};
    sorted.forEach(exp => {
      const dateKey = new Date(exp.date).toDateString(); 
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(exp);
    });
    return groups;
  }, [trip.expenses]);

  const getDateLabel = (dateKey: string) => {
    const date = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-2 px-1">
           <button onClick={onNavigateTripList} className="flex items-center text-gray-400 font-bold text-sm gap-1 hover:text-gray-600 transition-colors">
               <Icons.Back /> My Trips
           </button>

           <div className="flex gap-2">
               <button 
                  onClick={() => setShowShare(true)} 
                  className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary transition-colors active:scale-95"
               >
                   <Icons.Share />
               </button>

               <button 
                  onClick={() => setShowSettings(true)} 
                  className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary transition-colors active:scale-95"
               >
                   <Icons.Settings />
               </button>
           </div>
      </div>

      {/* 總金額卡片 */}
      <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
        <p className="text-indigo-100 text-sm font-medium mb-1 tracking-wide uppercase">Total Expenses</p>
        <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(totalSpent, trip.currency)}</h2>
        <div className="mt-6 flex items-center justify-between">
          
          {/* ★ 3. 成員頭像列表 (加入 Host 和 Me 標記) */}
          <div className="flex -space-x-2 items-end pl-1">
             {/* ★ 修改：使用 displayMembers 來 render，而不是原本的 trip.members */}
             {displayMembers.slice(0, 4).map((m: any) => {
               const isMe = m.user_id === currentUserId;
               const isHostMember = m.isHost || m.is_host; 

               return (
                 <div key={m.id} className={`relative flex flex-col items-center ${isMe ? 'z-10' : ''}`}>
                   
                   {/* 皇冠 (Host) */}
                   {isHostMember && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                        <Icons.Crown />
                     </div>
                   )}

                   {/* 頭像 (如果是自己，加個黃色光環) */}
                   <div className={`relative ${isMe ? 'ring-2 ring-yellow-400 rounded-full' : ''}`}>
                      <Avatar member={m} />
                   </div>

                   {/* Me 標籤 */}
                   {isMe && (
                     <span className="absolute -bottom-3 bg-yellow-400 text-indigo-900 text-[8px] font-bold px-1.5 rounded-full leading-tight shadow-sm z-20">
                       Me
                     </span>
                   )}
                 </div>
               );
             })}
             
             {/* 超過 4 人的顯示 */}
             {trip.members.length > 4 && (
                <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold border-2 border-white">
                    +{trip.members.length - 4}
                </div>
             )}
          </div>

          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium">
             {trip.expenses.length} Receipts
          </div>
        </div>
      </div>

      {/* 交易列表 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Recent Transactions</h3>
        {trip.expenses.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <Icons.Receipt />
              <p className="mt-2 text-sm">No receipts yet</p>
           </div>
        ) : (
           <div className="space-y-6">
             {Object.entries(groupedExpenses).map(([dateKey, expenses]: [string, Expense[]]) => (
               <div key={dateKey}>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-1">
                    {getDateLabel(dateKey)}
                 </h4>
                 
                 <div className="space-y-3">
                   {expenses.map((exp: Expense) => (
                     <div 
                      key={exp.id} 
                      onClick={() => onViewExpense(exp)}
                      className={`p-4 rounded-2xl border shadow-sm flex justify-between items-center cursor-pointer transition-colors active:scale-[0.98] ${
                        exp.is_settled 
                        ? 'bg-gray-50 border-gray-100 opacity-60 grayscale' 
                        : 'bg-white border-gray-50 hover:bg-gray-50'
                    }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl shrink-0 ${exp.is_settled ? 'bg-gray-200 text-gray-400' : 'bg-indigo-50 text-primary'}`}>
                            {exp.is_settled ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> : <Icons.Receipt />} 
                        </div>
                        <div className="min-w-0">
                            <p className={`font-bold line-clamp-1 break-all ${exp.is_settled ? 'text-gray-500 line-through decoration-2' : 'text-gray-800'}`}>
                                {exp.description}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {exp.is_settled ? 'Settled' : `Paid by ${trip.members.find((m: any) => m.id === exp.payerId)?.name || 'Unknown'}`}
                            </p>
                        </div>
                        </div>
                       <div className="text-right shrink-0 ml-2">
                         <p className="font-bold text-gray-900">{formatCurrency(exp.totalAmount, trip.currency)}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>

      {showShare && <ShareModal trip={trip} onClose={() => setShowShare(false)} />}
      {showSettings && <SettingsModal trip={trip} onClose={() => setShowSettings(false)} />}
    </div>
  );
};