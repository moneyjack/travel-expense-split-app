import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripContext } from '../../context/TripContext';
import { CURRENCIES } from '../../utils/currency'; 
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

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
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  Plane: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  X: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

interface TempMember {
  tempId: string;
  name: string;
  avatar: string;
  color: string;
}

// ★ 改良版 MemberChip (膠囊樣式) 用於登機證上
const MemberChip = ({ member, onClick, onRemove, isHost }: { member: TempMember, onClick: () => void, onRemove?: () => void, isHost?: boolean }) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      onClick={onClick}
      className={`
        relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border cursor-pointer select-none transition-all hover:brightness-95
        ${isHost 
           ? 'bg-indigo-50 border-indigo-100 text-indigo-900' 
           : 'bg-white border-gray-200 text-gray-700'
        }
      `}
    >
      {/* 頭像 */}
      <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-sm shadow-sm border border-white shrink-0`}>
          {member.avatar}
      </div>
      
      {/* 名字 */}
      <span className="text-sm font-bold truncate max-w-[100px]">{member.name}</span>
      
      {/* Host 標籤或刪除按鈕 */}
      {isHost ? (
         <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 bg-indigo-200 px-1 rounded">HOST</span>
      ) : (
        onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors ml-1"
          >
            <Icons.X />
          </button>
        )
      )}
    </motion.div>
  );
};

interface CreateTripViewProps {
  onCancel: () => void;
  onCreate?: (name: string, members: any[]) => void; 
}

export const CreateTripView: React.FC<CreateTripViewProps> = ({ onCancel }) => {
  const { t } = useTranslation();
  const { createTrip, loading } = useTripContext();
  
  const [newTripName, setNewTripName] = useState('');
  const [currency, setCurrency] = useState('HKD');
  
  const [hostDetails, setHostDetails] = useState<TempMember>({
    tempId: 'HOST',
    name: 'Me',
    avatar: '😎',
    color: 'bg-primary'
  });

  const [newTripMembers, setNewTripMembers] = useState<TempMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');

  // 編輯 Modal 狀態
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
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
        alert(t('create_trip.alerts.member_exists'));
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
        alert(t('create_trip.alerts.duplicate_name'));
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
    
    const allMembers = [
        { ...cleanHost, is_host: true }, 
        ...cleanMembers
    ];
    
    await createTrip(newTripName, allMembers, currency);
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      
      {/* 背景裝飾：藍色光暈 */}
      <div className="absolute top-[-10%] right-[-20%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

      {/* --- Top Navigation --- */}
      <div className="px-6 pt-6 pb-2 z-10 flex items-center">
        <button 
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-600 transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <span className="ml-2 text-lg font-bold text-gray-900">{t('create_trip.title')}</span>
      </div>

      {/* --- Main Content (Boarding Pass) --- */}
      <div className="flex-1 px-6 pt-4 pb-12 overflow-y-auto">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-white overflow-hidden relative"
        >
          
          {/* Header Strip */}
          <div className="h-3 bg-gradient-to-r from-indigo-500 to-blue-500 w-full" />

          <div className="p-6 space-y-8">
            
            {/* 1. Destination (Trip Name) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('create_trip.trip_name_label')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Icons.Plane />
                </div>
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder={t('create_trip.trip_name_placeholder') as string}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 font-bold text-lg placeholder:text-gray-300 placeholder:font-normal focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* 2. Currency (Horizontal Scroll) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('create_trip.currency_label')}</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => setCurrency(curr.code)}
                    className={`
                      px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap border-2 flex flex-col items-center
                      ${currency === curr.code 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                      }
                    `}
                  >
                    <span>{curr.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Passengers (Dynamic List) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                {t('create_trip.who_is_going')} ({newTripMembers.length + 1})
              </label>
              
              {/* Add Member Input */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Icons.Users />
                   </div>
                   <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                    placeholder={t('create_trip.friend_name_placeholder') as string}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium"
                  />
                </div>
                <button 
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Icons.Plus />
                </button>
              </div>

              {/* Members List (Chips Layout) */}
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {/* Host Chip */}
                  <MemberChip
                     member={hostDetails}
                     onClick={() => openEditModal(hostDetails)}
                     isHost={true}
                  />

                  {/* Other Members */}
                  {newTripMembers.map((m) => (
                    <React.Fragment key={m.tempId}>
                      <MemberChip
                        member={m}
                        onClick={() => openEditModal(m)}
                        onRemove={() => {
                          if (confirm(t('create_trip.alerts.remove_confirm', { name: m.name }))) {
                              setNewTripMembers(prev => prev.filter(member => member.tempId !== m.tempId));
                          }
                        }}
                      />
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 虛線撕裂處 (Tear-off Line) */}
          <div className="relative flex items-center justify-between px-2">
            <div className="w-6 h-6 bg-gray-50 rounded-full -ml-3" /> {/* 左圓缺口 */}
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
            <div className="w-6 h-6 bg-gray-50 rounded-full -mr-3" /> {/* 右圓缺口 */}
          </div>

          {/* Bottom Action Section */}
          <div className="p-6 bg-gray-50/50">
             <div className="flex justify-between items-center text-sm text-gray-500 mb-6 px-1">
                <span>Date</span>
                <span className="font-bold text-gray-900">{new Date().toLocaleDateString()}</span>
             </div>

             <Button 
               onClick={handleCreateTrip} 
               disabled={loading || !newTripName.trim()}
               className="w-full py-4 text-lg shadow-xl shadow-indigo-200 rounded-xl"
             >
               {loading ? t('create_trip.creating') : t('create_trip.create_trip')}
             </Button>
          </div>

        </motion.div>
      </div>

      {/* Edit Modal (保持原有邏輯，美化樣式) */}
      <AnimatePresence>
      {editingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setEditingMemberId(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <button onClick={() => setEditingMemberId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <Icons.Back />
                    </button>
                    <h3 className="font-bold text-lg">{editingMemberId === 'HOST' ? t('create_trip.edit_profile') : t('create_trip.edit_friend')}</h3>
                    <button onClick={saveMemberEdit} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full">
                        {t('create_trip.done')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full ${editColor} flex items-center justify-center text-6xl shadow-lg border-4 border-white mb-4 transition-all`}>
                            {editAvatar}
                        </div>
                        <input 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="text-center text-2xl font-bold border-b-2 border-gray-100 focus:border-primary outline-none w-full pb-2"
                            placeholder={t('create_trip.friend_name_placeholder') as string}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t('create_trip.color')}</label>
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

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t('create_trip.avatar')}</label>
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

                    {editingMemberId !== 'HOST' && (
                      <div className="pt-4 border-t border-gray-100">
                          <button 
                              onClick={deleteMember}
                              className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2"
                          >
                              <Icons.Trash /> {t('create_trip.remove_member')}
                          </button>
                      </div>
                    )}
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};