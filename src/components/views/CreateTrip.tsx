import React, { useState } from 'react';
import { Member } from '../../types'; // 請確認這路徑是對的
import { Button } from '../ui/Button';
import { useTripContext } from '../../context/TripContext';
import { CURRENCIES } from '../../utils/currency'; // ★ 引入工具

// --- Constants ---
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
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
};

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

// 定義成員介面
interface TempMember {
  tempId: string;
  name: string;
  avatar: string;
  color: string;
}

// ★ 定義 Props 介面 (關鍵修復)
interface MemberPillProps {
  member: TempMember;
  onClick: () => void;
  onRemove?: () => void; // ★ 新增這一行
  isHost?: boolean;
}

// ★ 使用 React.FC 明確定義組件類型 (關鍵修復)
const MemberPill: React.FC<MemberPillProps> = ({ member, onClick, onRemove, isHost = false }) => {
  return (
    <div
      onClick={onClick}
      // ★ 注意：這裡把 <button> 改成了 <div> 並加上 cursor-pointer，避免按鈕嵌套問題
      className={`relative flex items-center gap-4 pl-2 pr-4 py-2 rounded-full border-2 transition-all hover:scale-[1.02] active:scale-95 group text-left cursor-pointer
        ${isHost ? member.color.replace('bg-', '').replace('400', '50') : 'bg-gray-50'} 
        ${isHost ? `border-${member.color.replace('bg-', '')}` : 'border-transparent hover:border-gray-200'}
      `}
    >
      {/* 頭像 */}
      <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center text-2xl shadow-sm border-2 border-white shrink-0`}>
          {member.avatar}
      </div>
      
      {/* 名字與 Host 標籤 */}
      <div className="flex flex-col flex-1 min-w-0">
         <span className={`text-lg font-bold truncate ${isHost ? 'text-gray-900' : 'text-gray-700'}`}>{member.name}</span>
         {isHost && <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Trip Host</span>}
      </div>

      {/* ★ 垃圾桶按鈕 (只在非 Host 時顯示) */}
      {!isHost && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // ★ 關鍵！阻止點擊事件傳遞，避免觸發 onClick (編輯)
            onRemove();
          }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all ml-2"
          aria-label="Remove member"
        >
          <Icons.Trash />
        </button>
      )}
    </div>
  );
};
interface CreateTripViewProps {
  onCancel: () => void;
  onCreate?: (name: string, members: any[]) => void; 
}

export const CreateTripView: React.FC<CreateTripViewProps> = ({ onCancel }) => {
  const { createTrip, loading } = useTripContext();
  
  const [newTripName, setNewTripName] = useState('');
  const [currency, setCurrency] = useState('HKD'); // ★ 預設貨幣
  // Host 狀態
  const [hostDetails, setHostDetails] = useState<TempMember>({
    tempId: 'HOST',
    name: 'Me',
    avatar: '😎',
    color: 'bg-primary'
  });

  // 其他成員狀態
  const [newTripMembers, setNewTripMembers] = useState<TempMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');

  // 編輯 Modal 狀態
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  
  // 編輯暫存
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editColor, setEditColor] = useState('');

  // 1. 新增成員
  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;

    const isDuplicate = 
        name.toLowerCase() === hostDetails.name.toLowerCase() || 
        newTripMembers.some(m => m.name.toLowerCase() === name.toLowerCase());
    
    if (isDuplicate) {
        alert('Member already exists!');
        return;
    }

    const newMember: TempMember = {
      tempId: Date.now().toString(),
      name: name,
      avatar: getRandomAvatar(),
      color: getRandomColor(),
    };

    setNewTripMembers([...newTripMembers, newMember]);
    setNewMemberName('');
  };

  // 2. 開啟編輯 Modal
  const openEditModal = (member: TempMember) => {
    setEditingMemberId(member.tempId);
    setEditName(member.name);
    setEditAvatar(member.avatar);
    setEditColor(member.color);
  };

  // 3. 儲存編輯
  const saveMemberEdit = () => {
    if (!editName.trim()) return alert("Name is required");

    const isDuplicate = newTripMembers.some(m => 
        m.tempId !== editingMemberId && 
        m.name.toLowerCase() === editName.trim().toLowerCase()
    ) || (editingMemberId !== 'HOST' && editName.toLowerCase() === hostDetails.name.toLowerCase());

    if (isDuplicate) {
        alert("Name already taken!");
        return;
    }

    if (editingMemberId === 'HOST') {
        setHostDetails({ ...hostDetails, name: editName, avatar: editAvatar, color: editColor });
    } else {
        setNewTripMembers(prev => prev.map(m => 
            m.tempId === editingMemberId 
            ? { ...m, name: editName, avatar: editAvatar, color: editColor }
            : m
        ));
    }
    setEditingMemberId(null);
  };

  // 4. 刪除成員
  const deleteMember = () => {
    if (editingMemberId === 'HOST') return;
    setNewTripMembers(prev => prev.filter(m => m.tempId !== editingMemberId));
    setEditingMemberId(null);
  };

  // 5. 建立旅程
  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;
    const cleanMembers = newTripMembers.map(({ tempId, ...rest }) => rest);
    const { tempId, ...cleanHost } = hostDetails;
    
    await createTrip(newTripName, cleanMembers, cleanHost, currency);
  };

  return (
    <div className="p-6 min-h-screen bg-white animate-in slide-in-from-bottom-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <button onClick={onCancel} className="text-gray-400 p-2"><Icons.ChevronLeft /></button>
        <h2 className="text-2xl font-bold">New Trip</h2>
      </div>

      <div className="space-y-8">
        {/* Trip Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Trip Name</label>
          <input 
            className="w-full text-lg p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-800"
            placeholder="e.g. Hawaii 2024"
            value={newTripName}
            onChange={e => setNewTripName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             {CURRENCIES.map(c => (
                <button
                   key={c.code}
                   onClick={() => setCurrency(c.code)}
                   className={`flex items-center gap-1 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${currency === c.code ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-400'}`}
                >
                   <span className="font-bold">{c.code}</span>
                   <span className="text-xs opacity-60">({c.symbol})</span>
                </button>
             ))}
          </div>
        </div>
        {/* Members Section */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Who is going?</label>
          
          {/* Add Input */}
          <div className="flex gap-2 mb-6">
            <input 
              className="flex-1 p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg font-bold text-gray-800"
              placeholder="Friend's name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <Button onClick={handleAddMember} size="icon" className="rounded-2xl w-14 h-14"><Icons.Plus /></Button>
          </div>
          
          {/* Members List */}
          <div className="flex flex-col gap-3">
            
            {/* Host */}
            <MemberPill 
                key="HOST" 
                member={hostDetails} 
                onClick={() => openEditModal(hostDetails)} 
                isHost={true} 
            />

            {/* Added Members */}
            {newTripMembers.map(m => (
              <MemberPill 
                key={m.tempId} 
                member={m} 
                onClick={() => openEditModal(m)} 
                onRemove={() => {
                    if (confirm(`Remove ${m.name}?`)) { // 加個確認比較安全
                        setNewTripMembers(prev => prev.filter(member => member.tempId !== m.tempId));
                    }
                }}
              />
            ))}
          </div>
          
          {newTripMembers.length === 0 && (
             <p className="text-center text-gray-400 mt-8 font-medium">Add friends to split costs with!</p>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="fixed bottom-6 left-6 right-6">
        <Button 
            onClick={handleCreateTrip} 
            disabled={loading || !newTripName.trim()}
            className="w-full py-6 text-xl font-bold rounded-2xl shadow-xl shadow-indigo-200"
        >
          {loading ? 'Creating...' : 'Create Trip'}
        </Button>
      </div>

      {/* Edit Modal (你要求的漂亮 UI) */}
      {editingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingMemberId(null)} />
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <button onClick={() => setEditingMemberId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <Icons.Back />
                    </button>
                    <h3 className="font-bold text-lg">{editingMemberId === 'HOST' ? 'Edit Profile' : 'Edit Friend'}</h3>
                    <button onClick={saveMemberEdit} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full">
                        Done
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* 1. 預覽與改名 (美化版) */}
                    <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full ${editColor} flex items-center justify-center text-6xl shadow-lg border-4 border-white mb-4 transition-all`}>
                            {editAvatar}
                        </div>
                        <input 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="text-center text-2xl font-bold border-b-2 border-gray-100 focus:border-primary outline-none w-full pb-2"
                            placeholder="Name"
                        />
                    </div>

                    {/* 2. 顏色選擇 */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Color</label>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {COLORS.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setEditColor(c)}
                                className={`w-8 h-8 rounded-full ${c} transition-transform hover:scale-110 ${editColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                            />
                            ))}
                        </div>
                    </div>

                    {/* 3. 頭像選擇 (網格佈局) */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Avatar</label>
                        <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {AVATARS.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => setEditAvatar(emoji)}
                                className={`text-2xl h-10 w-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${editAvatar === emoji ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-gray-50'}`}
                            >
                                {emoji}
                            </button>
                            ))}
                        </div>
                    </div>

                    {/* Delete Button */}
                    {editingMemberId !== 'HOST' && (
                      <div className="pt-4 border-t border-gray-100">
                          <button 
                              onClick={deleteMember}
                              className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2"
                          >
                              <Icons.Trash /> Remove from Trip
                          </button>
                      </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};