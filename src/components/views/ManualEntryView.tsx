import React, { useState } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next'; // ★ 引入 Hook
const Avatar = ({ member, size = 'sm' }: { member: any, size?: 'sm' | 'md' }) => (
  <div className={`${size === 'sm' ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-lg'} ${member.color} rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-white`}>
    {member.avatar || member.name[0]}
  </div>
);
// Icon 元件
const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

interface ManualEntryViewProps {
  onCancel: () => void;
}

interface EditingItem {
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[];
}

export const ManualEntryView: React.FC<ManualEntryViewProps> = ({ onCancel }) => {
  const { t } = useTranslation(); // ★ 初始化翻譯
  const { createExpense, trips, activeTripId, loading } = useTripContext();
  const activeTrip = trips.find(t => t.id === activeTripId);
  const members = activeTrip?.members || [];

  // --- State 初始化 ---
  const [shopName, setShopName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 預設先給一個空項目
  const [items, setItems] = useState<EditingItem[]>([
    { name: '', quantity: 1, price: 0, assignedTo: [] }
  ]);
  
  // 預設 payer
  const [payerId, setPayerId] = useState<string>(members.find(m => m.isHost)?.id || members[0]?.id || '');

  const updateItem = (index: number, field: keyof EditingItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, assignedTo: [] }]);
  };

  const deleteItem = (index: number) => {
    if (items.length === 1 && index === 0) {
        setItems([{ name: '', quantity: 1, price: 0, assignedTo: [] }]);
        return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const toggleMemberForItem = (itemIndex: number, memberId: string) => {
    const newItems = [...items];
    const current = newItems[itemIndex].assignedTo;
    if (current.includes(memberId)) {
      newItems[itemIndex].assignedTo = current.filter(id => id !== memberId);
    } else {
      newItems[itemIndex].assignedTo = [...current, memberId];
    }
    setItems(newItems);
  };

  // ★ 新增功能：一鍵全選 (除大數)
  const handleSplitAll = (index: number) => {
    const newItems = [...items];
    const allMemberIds = members.map(m => m.id);
    
    // 邏輯：直接把 assignedTo 設為所有成員 ID
    // (如果想做成 toggle：判斷是否已全選，是則清空，否則全選。這裡先做單純的「全選」)
    newItems[index].assignedTo = allMemberIds;
    
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
        alert("Please enter a Shop Name");
        return;
    }
    const validItems = items.filter(i => i.name.trim() !== '' || i.price > 0);
    if (validItems.length === 0) {
        alert("Please add at least one item");
        return;
    }

    // ★ 關鍵：在儲存前，確保如果 assignedTo 是空的 (代表忘了選)，預設邏輯是「所有人」還是「沒人」？
    // 為了安全起見，這裡我們保持原樣，讓 createExpense 去處理（通常後端或 Context 會處理空陣列 = 所有人，或者你可以在這裡強制轉換）
    // 建議：既然 UI 已經有明確的 Split All 按鈕，這裡就照實傳送。
    await createExpense(shopName, payerId, validItems, undefined, date); 
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="p-4 min-h-screen bg-gray-50 animate-in slide-in-from-bottom-10 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 z-20 py-2">
        <button onClick={onCancel} className="text-gray-500 font-bold px-2">{t('manual_entry.cancel')}</button>
        <h2 className="text-lg font-bold">{t('manual_entry.title')}</h2>
        <button className="text-primary font-bold px-2 flex items-center gap-1" onClick={addItem}>
          <Icons.Plus /> {t('manual_entry.add_item')}
        </button>
      </div>

      {/* 1. 店名、日期、付款人 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 space-y-4">
         <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{t('manual_entry.shop_name_label')}</label>
              <input 
                value={shopName} 
                onChange={e => setShopName(e.target.value)}
                placeholder={t('manual_entry.shop_name_placeholder')} // ★ i18n
                className="w-full text-lg font-bold border-b border-gray-200 outline-none rounded-none placeholder-gray-300" 
                autoFocus
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{t('manual_entry.date_label')}</label>
              <input 
                type="date"
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm font-bold border-b border-gray-200 outline-none py-1 rounded-none bg-transparent" 
              />
            </div>
         </div>

         <div>
           <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">{t('manual_entry.paid_by_label')}</label>
           <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {members.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setPayerId(m.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                    payerId === m.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  <span className="text-xs">{m.avatar}</span>
                  <span className="text-xs font-bold">{m.name}</span>
                </button>
              ))}
           </div>
         </div>
      </div>

      {/* 2. 項目列表 */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 relative group">
            
            {/* 刪除按鈕 */}
            <button 
              onClick={() => deleteItem(idx)}
              className="absolute top-2 right-2 p-2 bg-gray-50 rounded-full hover:bg-red-50 transition-colors"
            >
              <Icons.Trash />
            </button>

            {/* 第一行：輸入欄位 */}
            <div className="flex gap-2 items-start mb-3 pr-8">
              <div className="w-10">
                 <label className="text-[9px] text-gray-400 font-bold uppercase text-center block">{t('manual_entry.qty_label')}</label>
                 <input 
                   type="number" 
                   value={item.quantity}
                   onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                   className="w-full text-center font-bold bg-gray-50 rounded-lg py-1 text-sm"
                 />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase block">{t('manual_entry.item_label')}</label>
                <input 
                   value={item.name}
                   onChange={e => updateItem(idx, 'name', e.target.value)}
                   placeholder={t('manual_entry.item_name_placeholder')} // ★ i18n
                   className="w-full font-bold bg-gray-50 rounded-lg py-1 px-2 text-sm placeholder-gray-300"
                 />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 font-bold uppercase text-right block">{t('manual_entry.price_label')}</label>
                <input 
                   type="number"
                   value={item.price || ''}
                   onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                   placeholder="0"
                   className="w-full text-right font-bold text-primary bg-gray-50 rounded-lg py-1 px-2 text-sm"
                 />
              </div>
            </div>

            {/* 第二行：分帳選擇 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 border-t border-gray-50 items-center">
               
               {/* ★ Split All 按鈕 */}
               <button
                  onClick={() => handleSplitAll(idx)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                    item.assignedTo.length === members.length 
                      ? 'bg-indigo-50 text-primary border-indigo-100' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
               >
                  <Icons.Users /> {t('manual_entry.split_all')}
               </button>

               {/* 分隔線 */}
               <div className="w-[1px] h-6 bg-gray-100 shrink-0"></div>

               {/* 成員列表 */}
               {members.map(member => {
                 const isSelected = item.assignedTo.includes(member.id);
                 return (
                   <button 
                    key={member.id}
                    onClick={() => toggleMemberForItem(idx, member.id)}
                    className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                      isSelected 
                      ? `bg-white border-${member.color.replace('bg-', '')} shadow-sm ring-1 ring-${member.color.replace('bg-', '')}` 
                      : 'bg-gray-100 border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Avatar member={member} size="sm" />
                    <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{member.name}</span>
                  </button>
                  
                 );
               })}
               
               {/* 計數器 */}
               <div className="flex items-center ml-auto pl-2">
                 <span className="text-[10px] text-gray-300 font-bold">
                   {item.assignedTo.length}/{members.length}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部總計 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-2xl z-30">
        <div className="flex justify-between items-end mb-3">
           <span className="text-gray-400 text-sm font-bold">{t('manual_entry.total_amount')}</span>
           <span className="text-2xl font-bold text-gray-900">${grandTotal.toLocaleString()}</span>
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full py-3.5 text-lg rounded-xl shadow-lg shadow-indigo-200">
          {loading ? t('manual_entry.saving') : t('manual_entry.save')}
        </Button>
      </div>
    </div>
  );
};