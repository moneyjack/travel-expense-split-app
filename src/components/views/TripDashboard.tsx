import React from 'react';
import { Trip, AppView } from '../../types.ts';

const Icons = {
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Receipt: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  Share: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
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
  onViewExpense: (expense: any) => void;
  onNavigateTripList: () => void;
  onShowShareModal: () => void;
  onNavigateManageMembers: () => void;
}

export const TripDashboard: React.FC<TripDashboardProps> = ({ 
  trip, 
  onViewExpense, 
  onNavigateTripList,
  onShowShareModal,
  onNavigateManageMembers
}) => {
  const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-2 px-1">
        <button onClick={onNavigateTripList} className="flex items-center text-gray-400 font-bold text-sm gap-1 hover:text-gray-600 transition-colors">
          <Icons.ChevronLeft /> My Trips
        </button>
        <div className="flex gap-2">
          <button onClick={onShowShareModal} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary">
            <Icons.Share />
          </button>
          <button onClick={onNavigateManageMembers} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary">
            <Icons.Settings />
          </button>
        </div>
      </div>

      <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
        <p className="text-indigo-100 text-sm font-medium mb-1 tracking-wide uppercase">Total Expenses</p>
        <h2 className="text-5xl font-bold tracking-tight">${totalSpent.toFixed(0)}</h2>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex -space-x-2">
            {trip.members.slice(0, 4).map(m => <Avatar key={m.id} member={m} />)}
            {trip.members.length > 4 && <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold">+{trip.members.length - 4}</div>}
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium">
            {trip.expenses.length} Receipts
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Recent Transactions</h3>
        {trip.expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Icons.Receipt />
            <p className="mt-2 text-sm">No receipts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trip.expenses.map(exp => (
              <div 
                key={exp.id} 
                onClick={() => onViewExpense(exp)}
                className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-primary">
                    <Icons.Receipt /> 
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{exp.description}</p>
                    <p className="text-xs text-gray-400 font-medium">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${exp.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    by {trip.members.find(m => m.id === exp.payerId)?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
