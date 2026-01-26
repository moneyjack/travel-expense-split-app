import React, { useState } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';
// Icon 元件
const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

};

interface ConfirmReceiptViewProps {
  // 注意：這裡接收的資料結構變了，包含 metadata
  scanResult: { shopName: string; date: string; items: any[] }; 
  receiptUrl?: string;
  onCancel: () => void;
}

interface EditingItem {
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[];
}

export const ConfirmReceiptView: React.FC<ConfirmReceiptViewProps> = ({ scanResult, receiptUrl, onCancel }) => {
  const { createExpense, trips, activeTripId, loading } = useTripContext();
  const activeTrip = trips.find(t => t.id === activeTripId);
  const members = activeTrip?.members || [];

  // State 初始化
  const [shopName, setShopName] = useState(scanResult.shopName || 'Restaurant');
  const [date, setDate] = useState(scanResult.date || new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<EditingItem[]>(
    scanResult.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      assignedTo: []
    }))
  );
  
  // 預設 payer
  const [payerId, setPayerId] = useState<string>(members.find(m => m.isHost)?.id || members[0]?.id || '');

  // 更新項目
  const updateItem = (index: number, field: keyof EditingItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // ★ 新增項目
  const addItem = () => {
    setItems([...items, { name: 'New Item', quantity: 1, price: 0, assignedTo: [] }]);
  };

  // ★ 刪除項目
  const deleteItem = (index: number) => {
    if (confirm('Delete this item?')) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // 切換分帳成員
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
  const handleSplitAll = (index: number) => {
    const newItems = [...items];
    // 直接將 assignedTo 設為所有成員 ID
    newItems[index].assignedTo = members.map(m => m.id);
    setItems(newItems);
  };
  const handleSave = async () => {
    // 這裡我們之後可能要把 Date 也傳給 createExpense，目前先傳標題
    // 建議將 shopName 和 Date 合併成 Title，或者修改 createExpense 支援 date 參數
    const finalTitle = `${shopName}`; 
    await createExpense(finalTitle, payerId, items, receiptUrl, date); 
    // TODO: 如果你想把 date 存入資料庫，記得去 TripContext 的 createExpense 增加 date 參數
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="p-4 min-h-screen bg-gray-50 animate-in slide-in-from-bottom-10 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 z-20 py-2">
        <button onClick={onCancel} className="text-gray-500 font-bold px-2">Cancel</button>
        <h2 className="text-lg font-bold">Edit Receipt</h2>
        <button className="text-primary font-bold px-2 flex items-center gap-1" onClick={addItem}>
          <Icons.Plus /> Add
        </button>
      </div>

      {/* 1. 店名、日期、付款人 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 space-y-4">
         {receiptUrl && (
            <img src={receiptUrl} className="w-full h-32 object-cover rounded-xl opacity-90 mb-2" />
         )}
         
         <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Shop Name</label>
              <input 
                value={shopName} 
                onChange={e => setShopName(e.target.value)}
                className="w-full text-lg font-bold border-b border-gray-200 outline-none rounded-none" 
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

      {/* 2. 項目列表 */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 relative group">
            
            {/* 刪除按鈕 (右上角) */}
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
                   className="w-full font-bold bg-gray-50 rounded-lg py-1 px-2 text-sm"
                 />
              </div>
              <div className="w-16">
                <label className="text-[9px] text-gray-400 font-bold uppercase text-right block">Total</label>
                <input 
                   type="number"
                   value={item.price}
                   onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                   className="w-full text-right font-bold text-primary bg-gray-50 rounded-lg py-1 px-2 text-sm"
                 />
              </div>
            </div>

            {/* 第二行：分帳選擇 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 border-t border-gray-50 mt-2 items-center">
               
               {/* ★ 1. 新增：All 按鈕 */}
               <button
                  onClick={() => handleSplitAll(idx)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                    item.assignedTo.length === members.length 
                      ? 'bg-indigo-50 text-primary border-indigo-100' // 全選狀態
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
               >
                  <Icons.Users /> All
               </button>
               
               {/* 分隔線 */}
               <div className="w-[1px] h-5 bg-gray-100 shrink-0"></div>

               {/* ★ 2. 原本的成員列表 (保持不變) */}
               {members.map(member => {
                 const isSelected = item.assignedTo.includes(member.id);
                 return (
                   <button
                     key={member.id}
                     onClick={() => toggleMemberForItem(idx, member.id)}
                     className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                        isSelected 
                        ? `bg-indigo-50 border-${member.color.replace('bg-', '')} ring-1 ring-${member.color.replace('bg-', '')}` 
                        : 'bg-white border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                     }`}
                   >
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm ${member.color}`}>
                       {member.avatar}
                     </div>
                     <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                        {member.name}
                     </span>
                   </button>
                 );
               })}
               
               {/* 顯示選取人數 */}
               <div className="flex items-center ml-auto pl-2 border-l border-gray-100">
                 <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                   {item.assignedTo.length === 0 ? 'Nobody' : `${item.assignedTo.length}/${members.length}`}
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
          {loading ? 'Saving...' : 'Confirm Receipt'}
        </Button>
      </div>
    </div>
  );
};