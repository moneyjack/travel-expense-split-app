import React, { useState } from 'react';
import { Trip, Member } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { useTripContext } from '../../context/TripContext'; // ★ 引入 Context

const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

const getRandomColor = () => {
  const COLORS = [
    'bg-pink-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'
  ];
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

const Avatar = ({ member, size = 'md' }: { member: Member, size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
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

interface CreateTripViewProps {
  onCancel: () => void;
}

export const CreateTripView: React.FC<CreateTripViewProps> = ({ onCancel, onCreate }) => {
  const { createTrip, loading } = useTripContext(); // ★ 從 Context 拿功能
  
  const [newTripName, setNewTripName] = useState('');
  const [newTripMembers, setNewTripMembers] = useState<Partial<Member>[]>([]); // 用 Partial 因為還沒有 ID
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember = {
      // 這裡不用 id 了，因為 Supabase 會產生
      name: newMemberName,
      avatar: ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨'][Math.floor(Math.random() * 6)],
      color: getRandomColor(),
    };
    setNewTripMembers([...newTripMembers, newMember]);
    setNewMemberName('');
  };

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;
    
    // ★ 直接呼叫 Context 的真功能
    await createTrip(newTripName, newTripMembers);
    
    // 成功後 Context 會自動切換頁面，這裡不需要做什麼
  };

  return (
    <div className="p-6 min-h-screen bg-white animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-2 mb-8">
        <button onClick={onCancel} className="text-gray-400 p-2"><Icons.ChevronLeft /></button>
        <h2 className="text-2xl font-bold">New Trip</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Trip Name</label>
          <input 
            className="w-full text-lg p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Hawaii 2024"
            value={newTripName}
            onChange={e => setNewTripName(e.target.value)}
            disabled={loading} // 防止重複送出
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Who is going?</label>
          <div className="flex gap-2 mb-4">
            <input 
              className="flex-1 p-3 bg-gray-50 rounded-xl border-none"
              placeholder="Friend's name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <Button onClick={handleAddMember} size="icon" className="rounded-xl"><Icons.Plus /></Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-primary/10 pl-2 pr-3 py-1 rounded-full border border-primary/20">
              <span className="text-lg">😎</span>
              <span className="font-medium text-primary-dark">Me</span>
            </div>
            {newTripMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-indigo-50 pl-2 pr-3 py-1 rounded-full">
                <div className="scale-75"><Avatar member={m} size="sm" /></div>
                <span className="font-medium text-indigo-900">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 顯示等待中的狀態 */}
        <div className="fixed bottom-6 left-6 right-6">
          <Button 
            onClick={handleCreateTrip} 
            disabled={loading || !newTripName.trim()}
            className="w-full py-6 text-lg rounded-2xl shadow-xl shadow-indigo-200"
          >
            {loading ? 'Creating...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="p-6 min-h-screen bg-white animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-2 mb-8">
        <button onClick={onCancel} className="text-gray-400 p-2"><Icons.ChevronLeft /></button>
        <h2 className="text-2xl font-bold">New Trip</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Trip Name</label>
          <input 
            className="w-full text-lg p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Hawaii 2024"
            value={newTripName}
            onChange={e => setNewTripName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Who is going?</label>
          <div className="flex gap-2 mb-4">
            <input 
              className="flex-1 p-3 bg-gray-50 rounded-xl border-none"
              placeholder="Friend's name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <Button onClick={handleAddMember} size="icon" className="rounded-xl"><Icons.Plus /></Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-primary/10 pl-2 pr-3 py-1 rounded-full border border-primary/20">
              <span className="text-lg">😎</span>
              <span className="font-medium text-primary-dark">Me</span>
            </div>
            {newTripMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-indigo-50 pl-2 pr-3 py-1 rounded-full">
                <div className="scale-75"><Avatar member={m} size="sm" /></div>
                <span className="font-medium text-indigo-900">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 right-6">
        <Button onClick={handleCreateTrip} className="w-full py-6 text-lg rounded-2xl shadow-xl shadow-indigo-200">
          Create Trip
        </Button>
      </div>
    </div>
  );
};
