import React, { useMemo } from 'react';
import { Trip, Debt } from '../../types';
import { useTripContext } from '../../context/TripContext'; // 引入 Context
import { formatCurrency } from '../../utils/currency';

// Icons
const Icons = {
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
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

// 核心演算法：計算債務與花費 (加入 is_settled 過濾)
const calculateTripStats = (trip: Trip) => {
  const balances: Record<string, number> = {}; 
  const spending: Record<string, number> = {}; 

  trip.members.forEach(m => {
    balances[m.id] = 0;
    spending[m.id] = 0;
  });

  // ★ 關鍵：只計算 is_settled 為 false (或 undefined) 的項目
  const activeExpenses = trip.expenses.filter(e => !e.is_settled);

  activeExpenses.forEach(expense => {
    const payerId = expense.payerId;
    const amount = Number(expense.totalAmount);

    spending[payerId] = (spending[payerId] || 0) + amount;
    balances[payerId] += amount;

    let itemsTotal = 0;

    expense.items.forEach(item => {
      const itemPrice = Number(item.price);
      itemsTotal += itemPrice;

      const splitters = (item.assignedTo && item.assignedTo.length > 0) 
        ? item.assignedTo 
        : trip.members.map(m => m.id);

      const splitAmount = itemPrice / splitters.length;

      splitters.forEach((uid: string) => {
        if (balances[uid] !== undefined) {
           balances[uid] -= splitAmount;
        }
      });
    });

    const discrepancy = amount - itemsTotal;
    if (Math.abs(discrepancy) > 0.01) {
       const splitDiff = discrepancy / trip.members.length;
       trip.members.forEach(m => {
          balances[m.id] -= splitDiff;
       });
    }
  });

  const debtors: {id: string, amount: number}[] = [];
  const creditors: {id: string, amount: number}[] = [];

  Object.entries(balances).forEach(([id, amount]) => {
    if (amount < -0.01) debtors.push({ id, amount: amount }); 
    if (amount > 0.01) creditors.push({ id, amount: amount }); 
  });

  debtors.sort((a, b) => a.amount - b.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let i = 0; 
  let j = 0; 

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    
    if (amount > 0.01) { 
        debts.push({ 
            from: debtor.id, 
            to: creditor.id, 
            amount: Number(amount.toFixed(2)) 
        });
    }

    debtor.amount += amount;
    creditor.amount -= amount;

    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  // 回傳多一個參數：是否有未結算項目
  return { debts, spending, hasUnsettled: activeExpenses.length > 0 };
};

interface StatsViewProps {
  trip: Trip;
  currentUserId: string;
}

export const StatsView: React.FC<StatsViewProps> = ({ trip, currentUserId }) => {
  const { settleAllExpenses, loading } = useTripContext(); // 使用 Context
  const { debts, spending, hasUnsettled } = useMemo(() => calculateTripStats(trip), [trip]);
  
  const maxSpend = Math.max(...Object.values(spending).map(Number), 1);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in">
      
      {/* 1. 結算按鈕區塊 (只有當有未結算項目時顯示) */}
      {hasUnsettled && (
        <div className="bg-indigo-50 p-4 rounded-3xl flex justify-between items-center border border-indigo-100">
            <div>
                <h3 className="font-bold text-indigo-900">Outstanding Balance</h3>
                <p className="text-xs text-indigo-600">Calculated from unsettled expenses</p>
            </div>
            <button 
                onClick={() => settleAllExpenses(trip.id)}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
            >
                <Icons.CheckCircle /> Settle All
            </button>
        </div>
      )}

      {/* 2. 花費圖表 */}
      <section className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Spending Breakdown (Unsettled)</h3>
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
                  <span className={isMe ? 'text-primary font-bold' : ''}>{formatCurrency(amount, trip.currency)}</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 結算方案 */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Settlement Plan</h3>
        {debts.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-3xl text-emerald-700 text-center border border-emerald-100">
            <p className="font-bold text-lg mb-1">All settled up! 🎉</p>
            <p className="text-sm opacity-80">No one owes anything right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, idx) => {
              const from = trip.members.find(m => m.id === debt.from);
              const to = trip.members.find(m => m.id === debt.to);
              
              if (!from || !to) return null;

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
                  <div className="font-bold text-gray-900">{formatCurrency(debt.amount, trip.currency)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};