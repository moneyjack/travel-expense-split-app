import React, { useState } from 'react';
import { useTripContext } from '../../context/TripContext';
import { Button } from '../ui/Button';

// ... (AVATARS, COLORS, Icons 保持不變) ...
const AVATARS = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
    '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎',
    '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
    '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
    '😎', '🤠', '🥳', '👻', '👽', '🤖', '💩', '💀', '🤡', '👺'
  ];
  
  const COLORS = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-400',
    'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400',
    'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400',
    'bg-pink-400', 'bg-rose-400', 'bg-slate-400', 'bg-gray-400', 'bg-zinc-400'
  ];
  
  const Icons = {
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  };
  
export const SettingsModal = ({ trip, onClose }: { trip: any; onClose: () => void }) => {
  // ★ 1. 取得 currentUserId
  const { updateTripName, updateMember, deleteTrip, addMember, removeMember, isHost, currentUserId } = useTripContext();
  
  const [activeTab, setActiveTab] = useState('general');
  const [tripName, setTripName] = useState(trip.name);
  
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [tempMemberName, setTempMemberName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [tempColor, setTempColor] = useState('');

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // ... (handleSaveTrip, startEditMember, handleSaveMember, handleAddMember 邏輯保持不變) ...
  const handleSaveTrip = async () => {
    if (!tripName.trim()) return alert('Name cannot be empty');
    await updateTripName(trip.id, tripName);
    onClose();
  };

  const startEditMember = (member: any) => {
    setEditingMember(member);
    setTempMemberName(member.name);
    setTempAvatar(member.avatar);
    setTempColor(member.color);
  };

  const handleSaveMember = async () => {
    if (!tempMemberName.trim()) return alert("Name is required");

    const isDuplicate = trip.members.some((m: any) => 
      m.id !== editingMember.id && m.name.toLowerCase() === tempMemberName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert("This name is already taken. Please choose another one.");
      return;
    }

    await updateMember(editingMember.id, {
      name: tempMemberName,
      avatar: tempAvatar,
      color: tempColor
    });
    setEditingMember(null); 
  };
  
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    if (trip.members.some((m: any) => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
        alert("Member already exists");
        return;
    }
    await addMember(trip.id, newMemberName);
    setNewMemberName('');
    setIsAddingMember(false);
  };

  // --- 內部子視圖：成員編輯器 (保持不變) ---
  if (editingMember) {
    // ... (這部分 UI 保持不變，因為進入這裡代表已經通過權限檢查了)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-right">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
               <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                 <Icons.Back />
               </button>
               <h3 className="font-bold text-lg">Edit My Profile</h3>
               <button onClick={handleSaveMember} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full">
                 Save
               </button>
            </div>
  
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {/* 預覽 */}
               <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full ${tempColor} flex items-center justify-center text-6xl shadow-lg border-4 border-white mb-4`}>
                    {tempAvatar}
                  </div>
                  <input 
                    value={tempMemberName}
                    onChange={e => setTempMemberName(e.target.value)}
                    className="text-center text-2xl font-bold border-b-2 border-gray-100 focus:border-primary outline-none w-full pb-2"
                    placeholder="Name"
                  />
               </div>
  
               {/* 顏色選擇 */}
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Color</label>
                 <div className="flex flex-wrap gap-3 justify-center">
                   {COLORS.map(c => (
                     <button 
                       key={c} 
                       onClick={() => setTempColor(c)}
                       className={`w-8 h-8 rounded-full ${c} transition-transform hover:scale-110 ${tempColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                     />
                   ))}
                 </div>
               </div>
  
               {/* 頭像選擇 */}
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Avatar</label>
                 <div className="grid grid-cols-6 gap-2">
                   {AVATARS.map(emoji => (
                     <button 
                       key={emoji} 
                       onClick={() => setTempAvatar(emoji)}
                       className={`text-2xl h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${tempAvatar === emoji ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-gray-50'}`}
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )
  }

  // --- 主視圖：設定選單 ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 overflow-hidden">
        
        <div className="p-4 flex justify-between items-center border-b border-gray-50">
          <h3 className="text-xl font-bold pl-2">Settings</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><Icons.Close /></button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-50 mx-4 mt-4 rounded-xl">
           <button onClick={() => setActiveTab('general')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>General</button>
           <button onClick={() => setActiveTab('members')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>Members</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' ? (
            <div className="space-y-8">
               {/* (General Tab 內容保持不變) */}
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Trip Name</label>
                  <input 
                    value={tripName}
                    onChange={e => setTripName(e.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-xl text-lg font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all"
                  />
               </div>
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 text-sm">
                  <p className="font-bold mb-1">💡 Pro Tips:</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-80">
                    <li>Trip name is visible to all members.</li>
                    <li>You can change the base currency (Coming Soon).</li>
                  </ul>
               </div>
               {isHost && (
               <div className="pt-8 border-t border-gray-100">
                  <button onClick={() => deleteTrip(trip.id)} className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2">
                    <Icons.Trash /> Delete Trip
                  </button>
                  <p className="text-center text-xs text-gray-300 mt-2">This action cannot be undone.</p>
               </div>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 font-medium mb-2">
                 {/* 提示字根據權限變更 */}
                 Edit your profile details below.
              </p>
              {trip.members.map((m: any) => {
                // ★ 2. 判斷是否為自己
                const isMe = m.user_id === currentUserId;

                return (
                    <div key={m.id} className="flex gap-2">
                        {/* 點擊觸發編輯 (如果是自己) */}
                        <div 
                        className={`flex-1 flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl transition-all group text-left ${(isMe || isHost) ? 'hover:border-primary hover:shadow-md cursor-pointer' : 'opacity-80'}`}
                        onClick={() => (isMe || isHost) && startEditMember(m)} // ★ 只有自己能點
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center text-lg text-white shadow-sm relative`}>
                                    {m.avatar}
                                    {/* ★ 在列表中也可以標記 "Me" */}
                                    {isMe && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white">Me</div>}
                                </div>
                                <span className="font-bold text-gray-800">
                                    {m.name} 
                                    {/* 顯示是不是 Host */}
                                    {(m.isHost || m.is_host) && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">HOST</span>}
                                </span>
                            </div>
                            
                            {/* ★ 只顯示自己的編輯按鈕 */}
                            {((isMe || isHost)) && (
                                <div className="text-gray-300 group-hover:text-primary">
                                    <Icons.Edit />
                                </div>
                            )}
                        </div>
                        
                        {/* 刪除按鈕 (只有 Host 且不是刪除自己時顯示) */}
                        {isHost && m.user_id !== currentUserId && (
                        <button 
                            onClick={() => removeMember(trip.id, m.id)}
                            className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 hover:text-red-500 transition-colors"
                            title="Remove Member"
                        >
                            <Icons.Trash />
                        </button>
                        )}
                    </div>
                );
              })}
              
              {/* 新增成員 (只有 Host 可見) */}
              {isHost && (
                isAddingMember ? (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
                      {/* ... 新增成員表單 ... */}
                       <label className="text-xs font-bold text-indigo-400 uppercase mb-2 block">New Member Name</label>
                      <div className="flex gap-2">
                          <input 
                              value={newMemberName}
                              onChange={e => setNewMemberName(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-300"
                              placeholder="Name"
                              autoFocus
                          />
                          <button onClick={handleAddMember} className="bg-primary text-white px-4 rounded-xl font-bold text-sm">Add</button>
                          <button onClick={() => setIsAddingMember(false)} className="text-gray-400 px-2">Cancel</button>
                      </div>
                  </div>
              ) : (
                  <button 
                    onClick={() => setIsAddingMember(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-primary hover:text-primary hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                      <span className="text-xl">+</span> Add New Member
                  </button>
              )
            )}
            
            </div>
          )}
        </div>

        {/* General Tab Save Button */}
        {activeTab === 'general' && (
           <div className="p-4 border-t border-gray-50">
             <Button onClick={handleSaveTrip} className="w-full py-4 rounded-xl text-lg">Save Changes</Button>
           </div>
        )}

      </div>
    </div>
  );
};