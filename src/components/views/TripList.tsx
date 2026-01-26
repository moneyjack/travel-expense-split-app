import React from 'react';
import { Trip } from '../../types.ts';
import { formatCurrency } from '../../utils/currency';

const Icons = {
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
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

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: () => void;
  onSimulateGuestLink: (tripId: string) => void;
}

export const TripList: React.FC<TripListProps> = ({ 
  trips, 
  onSelectTrip, 
  onCreateTrip,
  onSimulateGuestLink
}) => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-500 font-medium">Ready for your next adventure?</p>
        </div>
      </header>
      
      <div className="space-y-4">
        {trips.map(trip => {
          const total = trip.expenses.reduce((s, e) => s + e.totalAmount, 0);
          return (
            <div 
              key={trip.id} 
              className="bg-white p-5 rounded-3xl shadow-soft border border-indigo-50 relative group active:scale-95 transition-transform"
            >
              <div 
                onClick={() => onSelectTrip(trip.id)}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{trip.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{new Date(trip.date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    {formatCurrency(total, trip.currency)}
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {trip.members.map(m => (
                    <div key={m.id}>
                      <Avatar member={m} />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-xs">
                    <Icons.ChevronLeft />
                  </div>
                </div>
              </div>
              
              {/* Simulation Button */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSimulateGuestLink(trip.id);
                }}
                className="absolute top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 shadow-md px-3 py-1 rounded-full text-xs font-bold text-primary"
              >
                Simulate Link
              </button>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-6 right-6">
        <button 
          onClick={onCreateTrip}
          className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg shadow-indigo-400/40 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
      </div>
    </div>
  );
};
