import React, { useState } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next'

// Icon 元件 (新增 Zoom In/Out Icon)
const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // ★ 新增放大鏡 Icon
  Zoom: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};

interface ConfirmReceiptViewProps {
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
  const { t } = useTranslation(); // ★ 初始化翻譯
  const { createExpense, trips, activeTripId, loading } = useTripContext();
  const activeTrip = trips.find(t => t.id === activeTripId);
  const members = activeTrip?.members || [];

  // ★ 新增：控制全螢幕圖片的 State
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // State 初始化
  const [shopName, setShopName] = useState(scanResult.shopName || 'Restaurant');
  const [icon, setIcon] = useState(scanResult.icon || '💸');
  const [date, setDate] = useState(scanResult.date || new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<EditingItem[]>(
    scanResult.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      assignedTo: []
    }))
  );
  
  const [payerId, setPayerId] = useState<string>(members.find(m => m.isHost)?.id || members[0]?.id || '');

  // ... (原本的 updateItem, addItem, deleteItem, toggleMemberForItem, handleSplitAll, handleSave 邏輯保持不變) ...
  const updateItem = (index: number, field: keyof EditingItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: 'New Item', quantity: 1, price: 0, assignedTo: [] }]);
  };

  const deleteItem = (index: number) => {
    if (confirm('Delete this item?')) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
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
  
  const handleSplitAll = (index: number) => {
    const newItems = [...items];
    newItems[index].assignedTo = members.map(m => m.id);
    setItems(newItems);
  };
  const calculatedTotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const [manualTotal, setManualTotal] = useState<number>(calculatedTotal);
  const handleSave = async () => {
    let finalItems = [...items];
    // 1. 計算原始總額 (項目加總)
    
    
    // 2. 計算差額 (手動輸入總額 - 項目加總)
    const diff = manualTotal - calculatedTotal;

    // 如果有差額 (大於 1 避免浮點數誤差)
    if (Math.abs(diff) > 1) {
        
        // --- ★★★ 核心邏輯：按消費比例自動分配差額 ★★★ ---

        // A. 先算每個人在這張單原本要負擔多少錢 (Subtotal per person)
        const memberShares: Record<string, number> = {};
        let totalParticipatingAmount = 0;

        items.forEach(item => {
          
            const itemPrice = Number(item.price);
            if (itemPrice <= 0 || isNaN(itemPrice) || itemPrice === null) return; // 跳過價格為 0 的項目
            const splitCount = item.assignedTo.length;
            
            if (splitCount > 0) {
                const perPerson = itemPrice / splitCount; // 該項目每人分攤多少
                
                item.assignedTo.forEach(memberId => {
                    memberShares[memberId] = (memberShares[memberId] || 0) + perPerson;
                    totalParticipatingAmount += perPerson;
                });
            }
        });

        // B. 根據比例，為每個人建立一個「專屬的」調整項目
        // 這樣做是因為我們的資料庫不支援「單一項目按權重分」，所以我們拆成多個小項目
        Object.entries(memberShares).forEach(([memberId, shareAmount]) => {
            if (totalParticipatingAmount > 0) {
                // 算出這個人的消費佔比
                const ratio = shareAmount / totalParticipatingAmount;
                // 算出他應得的折扣金額
                const memberRefund = diff * ratio;

                // 只有金額大於 0.01 才建立項目
                if (Math.abs(memberRefund) > 0.01) {
                    finalItems.push({
                        // 名稱加上 (Auto) 方便識別，如果是負數就是 Tax Refund
                        name: diff < 0 ? t('confirm_receipt.discount_detected_item') : t('confirm_receipt.extra_charges_detected_item'),
                        quantity: 1,
                        // 修正小數點位數
                        price: parseFloat(memberRefund.toFixed(2)), 
                        // ★ 關鍵：這個折扣項目只屬於他自己 (Assigned ONLY to him)
                        assignedTo: [memberId] 
                    });
                }
            }
        });
    }

    const finalTitle = `${shopName}`; 
    await createExpense(finalTitle, payerId, finalItems, receiptUrl, date, icon); 
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div className="p-4 min-h-screen bg-gray-50 animate-in slide-in-from-bottom-10 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 z-20 py-2">
        <button onClick={onCancel} className="text-gray-500 font-bold px-2">{t('confirm_receipt.cancel')}</button>
        <h2 className="text-lg font-bold">{t('confirm_receipt.title')}</h2>
        <button className="text-primary font-bold px-2 flex items-center gap-1" onClick={addItem}>
          <Icons.Plus /> {t('confirm_receipt.add_btn')}
        </button>
      </div>

      {/* 1. 店名、日期、付款人 & 圖片縮圖 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 space-y-4">
         
         {receiptUrl && (
            <div 
              className="relative group cursor-pointer overflow-hidden rounded-xl mb-2"
              onClick={() => setIsImageZoomed(true)} 
            >
              <img 
                src={receiptUrl} 
                className="w-full h-32 object-cover opacity-90 transition-transform group-hover:scale-105" 
                alt="Receipt Thumbnail"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-white font-bold flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-xs">
                    <Icons.Zoom /> {t('confirm_receipt.view_full_image')}
                 </span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full md:hidden">
                 <Icons.Zoom /> 
              </div>
            </div>
         )}
         
         <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{t('confirm_receipt.shop_name_label')}</label>
              <input 
                value={shopName} 
                onChange={e => setShopName(e.target.value)}
                className="w-full text-lg font-bold border-b border-gray-200 outline-none rounded-none" 
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{t('confirm_receipt.date_label')}</label>
              <input 
                type="date"
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm font-bold border-b border-gray-200 outline-none py-1 rounded-none bg-transparent" 
              />
            </div>
         </div>

         <div>
           <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">{t('confirm_receipt.paid_by_label')}</label>
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
      <div className="space-y-3 pb-20">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 relative group">
            <button 
              onClick={() => deleteItem(idx)}
              className="absolute top-4 right-2 p-2 rounded-full hover:bg-red-50 transition-colors"
            >
              <Icons.Trash />
            </button>

            <div className="flex gap-2 items-start  pr-8">
              <div className="w-10">
                 <label className="text-[9px] text-gray-400 font-bold uppercase text-center block">{t('confirm_receipt.qty_label')}</label>
                 <input 
                   type="number" 
                   value={item.quantity}
                   onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                   className="w-full text-center font-bold bg-gray-50 rounded-lg py-1 text-sm"
                 />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase block">{t('confirm_receipt.item_label')}</label>
                <input 
                   value={item.name}
                   onChange={e => updateItem(idx, 'name', e.target.value)}
                   className="w-full font-bold bg-gray-50 rounded-lg py-1 px-2 text-sm"
                 />
              </div>
              <div className="w-20">
                <label className="text-[9px] text-gray-400 font-bold uppercase text-right block">{t('confirm_receipt.price_label')}</label>
                <input 
                   type="number"
                   value={item.price}
                   onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                   className="w-full text-right font-bold text-primary bg-gray-50 rounded-lg py-1 px-2 text-sm"
                 />
              </div>
            </div>

            <div className="relative group w-full overflow-hidden"> {/* 1. 外層加上 relative 和 overflow-hidden */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 border-t border-gray-50 mt-2 items-center">
                <button
                    onClick={() => handleSplitAll(idx)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                      item.assignedTo.length === members.length 
                        ? 'bg-indigo-50 text-primary border-indigo-100' 
                        : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                    }`}
                >
                    <Icons.Users /> {t('confirm_receipt.split_all')}
                </button>
                <div className="w-[1px] h-5 bg-gray-100 shrink-0"></div>
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
                <div className="flex items-center ml-auto pl-2 border-l border-gray-100">
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {item.assignedTo.length === 0 ? t('confirm_receipt.nobody') : `${item.assignedTo.length}/${members.length}`}
                  </span>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                         
              </div>
          </div>
        ))}
      </div>

      {/* 底部總計 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-2xl z-30">
        <div className="flex justify-between items-center mb-3">
           <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-bold">{t('confirm_receipt.total_amount')}</span>
              {/* 提示字：如果有差額 */}
              {Math.abs(manualTotal - calculatedTotal) > 1 && (
                  <span className={`text-[10px] font-bold ${manualTotal < calculatedTotal ? 'text-green-500' : 'text-red-500'}`}>
                    {manualTotal < calculatedTotal ? t('confirm_receipt.discount_detected') : t('confirm_receipt.extra_charges_detected')}
                  </span>
              )}
           </div>

           {/* ★ 改成可編輯的 Input */}
           <div className="flex items-center gap-1 border-b border-gray-200 focus-within:border-primary transition-colors">
             <span className="text-2xl font-bold text-gray-900">{activeTrip.currency}</span>
             <input 
               type="number"
               value={manualTotal}
               // 當用戶輸入時，更新 manualTotal
               onChange={(e) => setManualTotal(Number(e.target.value))}
               // 點擊時自動選取，方便修改
               onFocus={(e) => e.target.select()}
               className="text-2xl font-bold text-gray-900 w-32 text-right outline-none bg-transparent p-1"
             />
           </div>
        </div>
        
        {/* 顯示差額明細，讓用戶安心 */}
        {Math.abs(manualTotal - calculatedTotal) > 1 && (
             <div className="mb-3 bg-gray-50 p-2 rounded-lg text-xs text-gray-500 flex justify-between animate-in fade-in">
                <span>{t('confirm_receipt.items_sum')}: {calculatedTotal.toLocaleString()}</span>
                <span>{t('confirm_receipt.adjustment')}: {manualTotal - calculatedTotal > 0 ? '+' : ''}{(manualTotal - calculatedTotal).toLocaleString()}</span>
             </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full py-3.5 text-lg rounded-xl shadow-lg shadow-indigo-200">
           {loading ? t('confirm_receipt.saving') : t('confirm_receipt.confirm_btn')}
        </Button>
      </div>
      {/* 全螢幕圖片檢視 Modal */}
      {isImageZoomed && receiptUrl && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
            <span className="text-white font-bold text-sm">{t('confirm_receipt.receipt_image_title')}</span>
            <button 
              onClick={() => setIsImageZoomed(false)}
              className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-md"
            >
              <Icons.Close />
            </button>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 pt-16 pb-safe">
             <img 
               src={receiptUrl} 
               className="w-full h-auto max-w-none shadow-2xl" 
               style={{ minHeight: '50%' }} 
               alt="Full Receipt" 
             />
          </div>
        </div>
      )}

    </div>
  );
};