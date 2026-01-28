import React, { useState, useEffect, useMemo } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook

// --- Icons ---
const Icons = {
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Pencil: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};

// --- Sub-components ---
const Avatar = ({ member, size = 'sm' }: { member: any, size?: 'sm' | 'md' }) => (
  <div className={`${size === 'sm' ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-lg'} ${member.color} rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-white`}>
    {member.avatar || member.name[0]}
  </div>
);

const ImageLightbox = ({ src, onClose }: { src: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in">
    <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full z-10"><Icons.Close /></button>
    <div className="flex-1 flex items-center justify-center p-2">
      <img src={src} className="max-w-full max-h-full object-contain" alt="Receipt" />
    </div>
  </div>
);

interface TransactionDetailModalProps {
  expense: any;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ expense, onClose }) => {
  // ★ 1. 引入 toggleExpenseSettled
  const { t } = useTranslation(); // ★ 初始化翻譯
  const { trips, activeTripId, updateExpense, deleteExpense, toggleExpenseSettled, loading, isHost} = useTripContext();
  const activeTrip = trips.find(t => t.id === activeTripId);
  const members = activeTrip?.members || [];

  // --- UI States ---
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  
  // --- Data States (Buffer for editing) ---
  const [editedTitle, setEditedTitle] = useState(expense.description || expense.title);
  const [editedPayerId, setEditedPayerId] = useState(expense.payerId);
  const [editedDate, setEditedDate] = useState(new Date(expense.date).toISOString().split('T')[0]);
  const [editedItems, setEditedItems] = useState<any[]>([]);

  // Initialize buffer when opening edit mode
  useEffect(() => {
    if (isEditing) {
        setEditedTitle(expense.description || expense.title);
        setEditedPayerId(expense.payerId);
        setEditedDate(new Date(expense.date).toISOString().split('T')[0]);
        const itemsCopy = (expense.items || []).map((i: any) => ({
            ...i,
            assignedTo: i.assignedTo || [] 
        }));
        setEditedItems(itemsCopy);
    }
  }, [isEditing, expense]);

  const handleSave = async () => {
    const newTotal = editedItems.reduce((sum, item) => sum + Number(item.price), 0);
    const finalizedItems = editedItems.map(item => {
          const assignedTo = (item.assignedTo && item.assignedTo.length > 0)
              ? item.assignedTo 
              : members.map((m: any) => m.id); // 強制轉成明確名單

          return {
              ...item,
              assignedTo
          };
      });

      await updateExpense(
          expense.id, 
          { 
              title: editedTitle, 
              amount: newTotal,
              payer_id: editedPayerId,
              date: editedDate 
          }, 
          finalizedItems // 使用處理過的 items
      );
      
      setIsEditing(false);
      onClose();
  };

  const handleDeleteExpense = async () => {
    if (confirm(t('transaction.alerts.delete_confirm'))) {
        await deleteExpense(expense.id);
        onClose();
    }
  };

  // ★ 2. 處理切換結算狀態
  const handleToggleSettle = async () => {
      // 根據當前狀態選擇正確的翻譯字串
      const confirmMessage = expense.is_settled 
        ? t('transaction.alerts.unsettle_confirm') 
        : t('transaction.alerts.settle_confirm');

      if (confirm(confirmMessage)) {
          await toggleExpenseSettled(expense.id, expense.is_settled);
          onClose(); // 切換後關閉視窗，讓使用者在 Dashboard 看到變灰的效果
      }
  };
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const toggleAssignment = (itemIndex: number, memberId: string) => {
    const newItems = [...editedItems];
    const current = newItems[itemIndex].assignedTo;
    
    if (current.includes(memberId)) {
        newItems[itemIndex].assignedTo = current.filter((id: string) => id !== memberId);
    } else {
        newItems[itemIndex].assignedTo = [...current, memberId];
    }
    setEditedItems(newItems);
  };

  const deleteItem = (index: number) => {
    if (confirm(t('transaction.alerts.remove_item'))) {
        setEditedItems(editedItems.filter((_, i) => i !== index));
    }
  };

  const addItem = () => {
    setEditedItems([...editedItems, { name: 'New Item', price: 0, quantity: 1, assignedTo: [] }]);
  };

  const displayItems = isEditing ? editedItems : (expense.items || []);
  const displayTotal = isEditing 
    ? editedItems.reduce((s, i) => s + Number(i.price), 0) 
    : (expense.totalAmount || expense.amount);

  const memberShares = useMemo(() => {
    const shares: Record<string, number> = {};
    
    displayItems.forEach((item: any) => {
      const price = Number(item.price) || 0;
      const assignees = item.assignedTo || [];
      
      if (assignees.length > 0) {
        const perPerson = price / assignees.length;
        assignees.forEach((uid: string) => {
          shares[uid] = (shares[uid] || 0) + perPerson;
        });
      } else {
        if (members.length > 0) {
            const perPerson = price / members.length;
            members.forEach((m: any) => {
                shares[m.id] = (shares[m.id] || 0) + perPerson;
            });
        }
      }
    });
    return Object.entries(shares).sort(([, a], [, b]) => b - a);
  }, [displayItems, members]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-start z-10 bg-white border-b border-gray-50">
           <div className="flex-1 mr-4 space-y-2">
              {isEditing ? (
                <>
                  <input 
                    value={editedTitle} 
                    onChange={e => setEditedTitle(e.target.value)}
                    className="text-xl font-bold border-b border-gray-300 focus:border-primary outline-none w-full"
                    autoFocus
                    placeholder={t('transaction.title_placeholder')}
                  />
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">{t('transaction.date')}</label>
                       <input 
                         type="date"
                         value={editedDate}
                         onChange={e => setEditedDate(e.target.value)}
                         className="bg-gray-100 border-none rounded-lg px-2 py-1 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
                       />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">{t('transaction.paid_by')}</label>
                        <select 
                          value={editedPayerId}
                          onChange={e => setEditedPayerId(e.target.value)}
                          className="bg-gray-100 border-none rounded-lg px-2 py-1 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20 w-full"
                        >
                          {members.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">
                      {expense.description || expense.title}
                      {/* 狀態標記 */}
                      {expense.is_settled && <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full align-middle">{t('transaction.settled')}</span>}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                     {new Date(expense.date).toLocaleDateString()} • {t('dashboard.expense.paid_by', { name: members.find((m: any) => m.id === expense.payerId)?.name || t('dashboard.expense.unknown_payer') })}
                  </p>
                </>
              )}
           </div>
           
           <div className="flex gap-2">
             {isEditing ? (
                <Button size="sm" onClick={handleSave} disabled={loading} className="rounded-full px-4">{t('transaction.save')}</Button>
             ) : (
                <>
                  {/* ★ 3. Settle Toggle Button */}
                  <button 
                    onClick={handleToggleSettle}
                    className={`p-2 rounded-full transition-colors ${
                        expense.is_settled 
                        ? 'bg-green-100 text-green-600 border border-green-200' // 已結算：綠色
                        : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500' // 未結算：灰色 -> 懸停綠色
                    }`}
                    title={expense.is_settled ? t('transaction.tooltips.mark_unsettled') : t('transaction.tooltips.mark_settled')}
                  >
                     <Icons.CheckCircle />
                  </button>

                  <button onClick={() => setIsEditing(true)} className="p-2 text-primary hover:bg-indigo-50 rounded-full"><Icons.Pencil /></button>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Icons.Close /></button>
                </>
             )}
           </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Receipt Image */}
           {expense.receiptUrl && (
              <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-100 bg-gray-50" onClick={() => setLightboxSrc(expense.receiptUrl)}>
                 <img src={expense.receiptUrl} className="w-full h-40 object-cover opacity-90 group-hover:scale-105 transition-transform" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="text-white text-xs font-bold flex items-center gap-1"><Icons.Search /> {t('transaction.view_receipt')}</span>
                 </div>
              </div>
           )}

           {/* Items List */}
           <div className="space-y-1">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold text-gray-400 uppercase">{t('transaction.breakdown')}</h3>
                 {isEditing && <button onClick={addItem} className="text-xs font-bold text-primary flex items-center gap-1"><Icons.Plus /> {t('transaction.add_item')}</button>}
              </div>

              {displayItems.map((item: any, idx: number) => (
                 <div key={idx} className={`flex items-start justify-between ${isEditing ? 'bg-gray-50 p-3 rounded-xl border border-gray-100' : 'py-1'}`}>
                    {isEditing ? (
                       // --- EDIT MODE ROW ---
                       <div className="w-full space-y-2">
                          <div className="flex gap-2">
                             <input 
                               value={item.name} 
                               onChange={e => updateItem(idx, 'name', e.target.value)}
                               className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-bold outline-none"
                               placeholder="Item Name"
                             />
                             <div className="w-14 relative">
                                <span className="absolute left-1 top-1.5 text-[10px] text-gray-400 font-bold">x</span>
                                <input 
                                  type="number"
                                  value={item.quantity} 
                                  onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                  className="w-full bg-white border border-gray-200 rounded px-1 py-1 pl-3 text-sm font-bold text-center outline-none"
                                />
                             </div>
                             <input 
                               type="number"
                               value={item.price} 
                               onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                               className="w-20 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-bold text-right outline-none"
                             />
                             <button onClick={() => deleteItem(idx)} className="text-red-400 p-1"><Icons.Trash /></button>
                          </div>
                          
                          {/* Member Selector */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
                             {members.map((m: any) => {
                                const isSelected = item.assignedTo.includes(m.id);
                                return (
                                  <button 
                                    key={m.id}
                                    onClick={() => toggleAssignment(idx, m.id)}
                                    className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                                      isSelected 
                                      ? `bg-white border-${m.color.replace('bg-', '')} shadow-sm ring-1 ring-${m.color.replace('bg-', '')}` 
                                      : 'bg-gray-100 border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <Avatar member={m} size="sm" />
                                    <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{m.name}</span>
                                  </button>
                                );
                             })}
                             {item.assignedTo.length === 0 && <span className="text-[10px] text-red-400 self-center font-medium px-2">{t('transaction.unassigned')}</span>}
                          </div>
                       </div>
                    ) : (
                    // --- VIEW MODE ROW ---
                       <div className="py-1 border-b border-gray-50 last:border-0 w-full">
                          <div className="flex items-start w-full gap-3 mb-2">
                             <span className="flex-1 text-sm font-bold text-gray-900 leading-tight pt-1 break-words">
                                {item.name}
                             </span>
                             <div className="w-10 shrink-0 flex justify-center pt-0.5">
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md block whitespace-nowrap">
                                  x{item.quantity}
                                </span>
                             </div>
                             <span className="w-20 shrink-0 text-sm font-bold text-gray-900 text-right pt-1">
                                ${Number(item.price).toLocaleString()}
                             </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pl-0.5">
                             {(!item.assignedTo || item.assignedTo.length === 0) ? (
                               <div className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all whitespace-nowrap bg-gray-100 border-transparent`}>
                                    <span className={`pl-2 text-xs font-bold text-gray-500`}> {t('transaction.everyone')}</span>
                                </div>
                             ) : (
                               item.assignedTo.map((uid: string) => {
                                  const m = members.find((mem: any) => mem.id === uid);
                                  if (!m) return null;
                                  return (
                                    <div 
                                        key={m.id}
                                        className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all whitespace-nowrap bg-gray-100 border-transparent`}
                                    >
                                        <Avatar member={m} size="sm" />
                                        <span className={`text-xs font-bold text-gray-500`}>{m.name}</span>
                                    </div>
                                  );
                               })
                             )}
                          </div>
                       </div>
                    )}
                 </div>
              ))}
           </div>
           
           {!isEditing && memberShares.length > 0 && (
             <div className="mt-6 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('transaction.member_shares')}</h3>
                <div className="space-y-2">
                   {memberShares.map(([memberId, amount]) => {
                      const m = members.find((mem: any) => mem.id === memberId);
                      if (!m) return null;
                      return (
                        <div key={memberId} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                           <div className="flex items-center gap-2">
                              <Avatar member={m} size="sm" />
                              <span className="text-sm font-bold text-gray-700">{m.name}</span>
                           </div>
                           <span className="text-sm font-bold text-gray-900">${amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})}</span>
                        </div>
                      );
                   })}
                </div>
             </div>
           )}

           {isEditing && (
             <div className="pt-6 border-t border-gray-100 mt-4">
              {isHost ? (
                <button 
                  onClick={handleDeleteExpense}
                  className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <Icons.Trash /> {t('transaction.delete_expense')}
                </button>
              ):
              (
                <p className="text-center text-xs text-gray-400">
                  {t('transaction.host_only_delete')}
                </p>
              )}
             </div>
           )}

        </div>

        {/* Footer Total */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-500">{t('transaction.total')}</span>
            <span className="text-2xl font-bold text-primary">${Number(displayTotal).toLocaleString()}</span>
        </div>

      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
};