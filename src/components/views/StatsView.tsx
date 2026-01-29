import React, { useMemo, useState } from 'react';
import { Trip, Debt } from '../../types';
import { useTripContext } from '../../context/TripContext'; 
import { formatCurrency, CURRENCIES } from '../../utils/currency'; // 確保 CURRENCIES 有被引入
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook
import { motion } from 'framer-motion';

// Icons
const Icons = {
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
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

// 核心演算法：計算債務與花費
const calculateTripStats = (trip: Trip) => {
  const balances: Record<string, number> = {}; 
  const spending: Record<string, number> = {}; 

  trip.members.forEach(m => {
    balances[m.id] = 0;
    spending[m.id] = 0;
  });

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
        if (balances[uid] !== undefined) balances[uid] -= splitAmount;
      });
    });

    const discrepancy = amount - itemsTotal;
    if (Math.abs(discrepancy) > 0.01) {
       const splitDiff = discrepancy / trip.members.length;
       trip.members.forEach(m => balances[m.id] -= splitDiff);
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

  return { debts, spending, hasUnsettled: activeExpenses.length > 0 };
};

interface StatsViewProps {
  trip: Trip;
  currentUserId: string;
}

export const StatsView: React.FC<StatsViewProps> = ({ trip, currentUserId, onNavigateDashboard }) => {
  const { t } = useTranslation(); // ★ 初始化翻譯
  const { settleAllExpenses, loading } = useTripContext();
  const { debts, spending, hasUnsettled } = useMemo(() => calculateTripStats(trip), [trip]);
  const maxSpend = Math.max(...Object.values(spending).map(Number), 1);

  // ★ 新增：匯率轉換狀態
  const [showConversion, setShowConversion] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState('HKD');
  // 預設匯率 (這是一個簡單的估算，或者你可以預設為 1)
  // 如果是 JPY -> HKD，預設 0.053
  const [exchangeRate, setExchangeRate] = useState(
      trip.currency === 'JPY' && targetCurrency === 'HKD' ? 0.053 : 
      trip.currency === 'TWD' && targetCurrency === 'HKD' ? 0.25 : 1
  );
  const totalSpent = useMemo(() => {
    return trip.expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [trip.expenses]);
  return (
    <motion.div 
    
    initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      
      // --- 拖曳手勢 (右滑返回) ---
      drag="x" // 允許水平拖曳
      dragConstraints={{ left: 0, right: 0 }} // 限制拖曳範圍 (雖然設為0，但配合 elastic 可以產生拉動阻力感)
      dragElastic={{ left: 0, right: 0.2 }} // 向右拉有彈性，向左拉不動
      onDragEnd={(e, { offset, velocity }) => {
        // 如果向右拖超過 100px 或者 快速甩動
        if (offset.x > 100 || velocity.x > 500) {
           onNavigateDashboard(); // 觸發返回
        }
      }}
      
      className="space-y-8 pb-24 animate-in fade-in">
      
      {/* 1. 結算按鈕 */}
      {/* {hasUnsettled && (
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
      )} */}

      {/* 2. 花費圖表 */}
      <section className="bg-white p-6 rounded-3xl shadow-sm">
        {/* ★ i18n: Spending Breakdown */}
        <h3 className="text-lg font-bold text-gray-800 mb-6">{t('stats.spending_breakdown')}</h3>
        <div className="space-y-4">
          {trip.members.map(m => {
            const amount = spending[m.id] || 0;
            const percent = (amount / maxSpend) * 100;
            const isMe = m.user_id === currentUserId;
            return (
              <div key={m.id}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar member={m} size="md" />
                      {/* ★ i18n: You (已經有了，保持) */}
                      <span className="text-xs font-bold text-gray-700 truncate">{m.name} {isMe ? `(${t('stats.you')})` : ''}</span>
                  </div>
                  <span className={isMe ? 'text-primary font-bold items-center' : ''}>{formatCurrency(amount, trip.currency)}</span>
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
        <div className="flex justify-between items-end mb-4 px-2">
            {/* ★ i18n: Settlement Plan */}
            <h3 className="text-lg font-bold text-gray-800">{t('stats.settlement_plan')}</h3>
            
            {/* ★ 匯率切換按鈕 i18n */}
            <button 
                onClick={() => setShowConversion(!showConversion)}
                className="text-xs font-bold text-primary bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors"
            >
               <Icons.Refresh /> {showConversion ? t('stats.hide_converter') : t('stats.convert_currency')}
            </button>
        </div>

        {/* ★ 匯率輸入工具列 */}
        {showConversion && (
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100 animate-in slide-in-from-top-2">
                {/* ★ i18n: Exchange Rate Calculator */}
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">{t('stats.calculator_title')}</div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Base Currency (唯讀) */}
                    <div className="bg-white px-3 py-2 rounded-xl font-bold text-gray-500 border border-gray-200">
                        1 {trip.currency}
                    </div>
                    <span className="text-gray-400">=</span>
                    
                    {/* 2. Rate Input */}
                    <input 
                        type="number" 
                        value={exchangeRate}
                        onChange={e => setExchangeRate(Number(e.target.value))}
                        step="0.001"
                        className="w-24 px-3 py-2 rounded-xl font-bold text-gray-900 border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 text-center"
                    />

                    {/* 3. Target Currency Selector */}
                    <select 
                        value={targetCurrency}
                        onChange={e => setTargetCurrency(e.target.value)}
                        className="bg-white px-3 py-2 rounded-xl font-bold text-primary border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {CURRENCIES.filter(c => c.code !== trip.currency).map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                    </select>
                </div>
                <div className="mt-2 text-[10px] text-gray-400">
                    {/* ★ i18n: Rate hint */}
                    {t('stats.rate_hint')}
                </div>
            </div>
        )}

        {debts.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-3xl text-emerald-700 text-center border border-emerald-100">
            {/* ★ i18n: All settled */}
            <p className="font-bold text-lg mb-1">{t('stats.all_settled_title')}</p>
            <p className="text-sm opacity-80">{t('stats.all_settled_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, idx) => {
              const from = trip.members.find(m => m.id === debt.from);
              const to = trip.members.find(m => m.id === debt.to);
              
              if (!from || !to) return null;
              const involvesMe = from.id === currentUserId || to.id === currentUserId;
              
              // ★ 計算轉換後的金額
              const convertedAmount = debt.amount * exchangeRate;
              
              return (
                <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border-l-4 ${involvesMe ? 'border-l-primary bg-indigo-50/30' : 'border-l-pink-400'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar member={from} size="md" />
                    <div className="text-sm flex flex-col">
                      <div className="flex items-center gap-1">
                          {/* ★ i18n: You or Name */}
                          <span className="font-bold text-gray-800">{from.id === currentUserId ? t('stats.you') : from.name}</span>
                          {/* ★ i18n: owe */}
                          <span className="text-gray-400 text-xs">{t('stats.owe')}</span>
                          {/* ★ i18n: You or Name */}
                          <span className="font-bold text-gray-800">{to.id === currentUserId ? t('stats.you') : to.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                      {/* 原幣金額 */}
                      <div className="font-bold text-gray-900">{formatCurrency(debt.amount, trip.currency)}</div>
                      
                      {/* ★ 顯示轉換後的金額 */}
                      {showConversion && (
                          <div className="text-sm font-bold text-primary mt-0.5">
                              ≈ {formatCurrency(convertedAmount, targetCurrency)}
                          </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
};