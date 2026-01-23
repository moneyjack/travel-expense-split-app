import React from 'react';
import { Trip, Debt } from '../../types.ts';

const Icons = {
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
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

interface StatsViewProps {
  trip: Trip;
  currentUserId: string;
  stats: {
    debts: Debt[];
    spending: Record<string, number>;
  };
}

export const StatsView: React.FC<StatsViewProps> = ({ trip, currentUserId, stats }) => {
  const { debts, spending } = stats;
  const maxSpend = Math.max(...Object.values(spending).map(Number), 1);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in">
      <section className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Spending Breakdown</h3>
        <div className="space-y-4">
          {trip.members.map(m => {
            const amount = spending[m.id] || 0;
            const percent = (amount / maxSpend) * 100;
            const isMe = m.id === currentUserId;
            return (
              <div key={m.id}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.color}`}></div>
                    {m.name} {isMe && <span className="text-xs text-gray-400">(You)</span>}
                  </div>
                  <span className={isMe ? 'text-primary font-bold' : ''}>${amount.toFixed(2)}</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Settlement Plan</h3>
        {debts.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-3xl text-emerald-700 text-center">
            <p className="font-bold">Everything is settled! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, idx) => {
              const from = trip.members.find(m => m.id === debt.from)!;
              const to = trip.members.find(m => m.id === debt.to)!;
              const involvesMe = from.id === currentUserId || to.id === currentUserId;
              
              return (
                <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border-l-4 ${involvesMe ? 'border-l-primary bg-indigo-50/30' : 'border-l-pink-400'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar member={from} size="sm" />
                    <div className="text-sm">
                      <span className="font-bold text-gray-800">{from.id === currentUserId ? 'You' : from.name}</span>
                      <span className="text-gray-400 mx-1">owe</span>
                      <span className="font-bold text-gray-800">{to.id === currentUserId ? 'You' : to.name}</span>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">${debt.amount.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
