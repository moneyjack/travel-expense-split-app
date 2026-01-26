import React, { useState } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';

// Icon 元件 (保持一致)
const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
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
  const { createExpense, trips, activeTripId, loading } = useTripContext();
  const activeTrip = trips.find(t => t.id === activeTripId);
  const members = activeTrip?.members || [];

  // --- State 初始化 (全空) ---
  const [shopName, setShopName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 預設先給一個空項目，方便使用者直接打
  const [items, setItems] = useState<EditingItem[]>([
    { name: '', quantity: 1, price: 0, assignedTo: [] }
  ]);
  
  // 預設 payer (Host 或第一位成員)
  const [payerId, setPayerId] = useState<string>(members.find(m => m.isHost)?.id || members[0]?.id || '');

  // --- 邏輯功能 (跟 ConfirmReceiptView 一模一樣) ---

  const updateItem = (index: number, field: keyof EditingItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, assignedTo: [] }]);
  };

  const deleteItem = (index: number) => {
    // 如果只剩一行，不要刪除，改成清空內容（選擇性 UX）
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

  const handleSave = async () => {
    // 簡單驗證
    if (!shopName.trim()) {
        alert("Please enter a Shop Name");
        return;
    }
    const validItems = items.filter(i => i.name.trim() !== '' || i.price > 0);
    if (validItems.length === 0) {
        alert("Please add at least one item");
        return;
    }

    // 呼叫 Context
    await createExpense(shopName, payerId, validItems, undefined, date); 
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="p-4 min-h-screen bg-gray-50 animate-in slide-in-from-bottom-10 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 z-20 py-2">
        <button onClick={onCancel} className="text-gray-500 font-bold px-2">Cancel</button>
        <h2 className="text-lg font-bold">Manual Entry</h2>
        <button className="text-primary font-bold px-2 flex items-center gap-1" onClick={addItem}>
          <Icons.Plus /> Add
        </button>
      </div>

      {/* 1. 店名、日期、付款人 (無圖片版) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 space-y-4">
         <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Shop Name</label>
              <input 
                value={shopName} 
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. 7-Eleven"
                className="w-full text-lg font-bold border-b border-gray-200 outline-none rounded-none placeholder-gray-300" 
                autoFocus
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Date</label>
              <input 
                type="date"
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm font-bold border-b border-gray-200 outline-none py-1 rounded-none bg-transparent" 
              />
            </div>
         </div>

         <div>
           <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Paid By</label>
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

      {/* 2. 項目列表 (跟 ConfirmReceiptView 完全一致) */}
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
                 <label className="text-[9px] text-gray-400 font-bold uppercase text-center block">Qty</label>
                 <input 
                   type="number" 
                   value={item.quantity}
                   onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                   className="w-full text-center font-bold bg-gray-50 rounded-lg py-1 text-sm"
                 />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase block">Item</label>
                <input 
                   value={item.name}
                   onChange={e => updateItem(idx, 'name', e.target.value)}
                   placeholder="Item name"
                   className="w-full font-bold bg-gray-50 rounded-lg py-1 px-2 text-sm placeholder-gray-300"
                 />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 font-bold uppercase text-right block">Price</label>
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
            <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-t border-gray-50">
               {members.map(member => {
                 const isSelected = item.assignedTo.includes(member.id);
                 return (
                   <button
                     key={member.id}
                     onClick={() => toggleMemberForItem(idx, member.id)}
                     className={`flex flex-col items-center min-w-[32px] gap-1 transition-all ${isSelected ? 'opacity-100 scale-105' : 'opacity-40 scale-95 grayscale'}`}
                   >
                     <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm ${member.color} ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                       {member.avatar}
                     </div>
                   </button>
                 );
               })}
               <div className="flex items-center ml-2">
                 <span className="text-[10px] text-gray-400 font-medium">
                   {item.assignedTo.length === 0 ? 'Split All' : `${item.assignedTo.length}`}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部總計 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-2xl z-30">
        <div className="flex justify-between items-end mb-3">
           <span className="text-gray-400 text-sm font-bold">Total Amount</span>
           <span className="text-2xl font-bold text-gray-900">${grandTotal.toLocaleString()}</span>
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full py-3.5 text-lg rounded-xl shadow-lg shadow-indigo-200">
          {loading ? 'Saving...' : 'Save Expense'}
        </Button>
      </div>
    </div>
  );
};