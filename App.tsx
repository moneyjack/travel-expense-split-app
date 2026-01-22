import React, { useState, useEffect, useRef } from 'react';
import { Trip, Member, ReceiptItem, Expense, Debt, AppView, TripTab } from './types';
import { processReceiptImage } from './services/geminiService';
import { Button } from './components/ui/Button';
import { Loading } from './components/ui/Loading';

// --- Icons ---
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  UserPlus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>,
  Receipt: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Pencil: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Keyboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Share: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  ZoomIn: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
};

// --- Utilities ---
const COLORS = [
  'bg-pink-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// --- Mock Data ---
const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    name: 'Tokyo 2024',
    date: new Date().toISOString(),
    members: [
      { id: 'm1', name: 'Me', avatar: '😎', color: 'bg-primary' }, // Host
      { id: 'm2', name: 'Alex', avatar: '🌸', color: 'bg-pink-400' }, // Ghost
      { id: 'm3', name: 'Ben', avatar: '🍙', color: 'bg-blue-400' }, // Ghost
    ],
    expenses: [
      {
        id: 'e1',
        tripId: 't1',
        description: 'Ramen Nagi',
        date: new Date().toISOString(),
        payerId: 'm1',
        totalAmount: 20.00,
        receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000',
        items: [
           { id: 'i1', name: 'Spicy Ramen', quantity: 1, price: 12.00, assignedTo: ['m1'] },
           { id: 'i2', name: 'Gyoza', quantity: 1, price: 5.00, assignedTo: ['m1', 'm2'] },
           { id: 'i3', name: 'Green Tea', quantity: 1, price: 3.00, assignedTo: ['m2'] },
        ]
      }
    ]
  }
];

// --- Sub-Components ---

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

const ImageLightbox = ({ src, onClose }: { src: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-200 flex flex-col">
       {/* Toolbar */}
       <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-md z-10">
          <button onClick={onClose} className="text-white p-2 rounded-full bg-white/20"><Icons.Close /></button>
          <div className="flex gap-4">
             <button onClick={handleZoomOut} className="text-white p-2 rounded-full bg-white/20"><Icons.ZoomOut /></button>
             <button onClick={handleZoomIn} className="text-white p-2 rounded-full bg-white/20"><Icons.ZoomIn /></button>
          </div>
       </div>
       
       {/* Scrollable Container */}
       <div className="flex-1 overflow-auto flex items-center justify-center p-4 touch-none">
          <div 
             className="relative transition-transform duration-200 ease-out origin-center"
             style={{ transform: `scale(${scale})`, minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
             <img src={src} className="max-w-none w-full object-contain" alt="Receipt Full View" />
          </div>
       </div>
    </div>
  )
}

const MemberAssignmentSheet = ({ 
    item, 
    members, 
    onClose, 
    onToggle 
}: { 
    item: ReceiptItem, 
    members: Member[], 
    onClose: () => void, 
    onToggle: (memberId: string) => void 
}) => {
    return (
        <div className="absolute inset-0 z-20 flex items-end">
             <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
             <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom relative z-10">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg">Split "{item.name}"</h3>
                     <button onClick={onClose} className="p-1 text-gray-400 bg-gray-100 rounded-full"><Icons.Close /></button>
                 </div>
                 
                 <div className="grid grid-cols-4 gap-3">
                     {members.map(m => {
                         const isSelected = item.assignedTo.includes(m.id);
                         return (
                             <button 
                                key={m.id}
                                onClick={() => onToggle(m.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${isSelected ? `border-${m.color.replace('bg-', '')} bg-indigo-50/50` : 'border-gray-100 bg-white'}`}
                             >
                                 <Avatar member={m} size="md" />
                                 <span className={`text-xs font-bold mt-2 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{m.name}</span>
                                 {isSelected && <div className="mt-1 w-2 h-2 rounded-full bg-green-400"></div>}
                             </button>
                         )
                     })}
                 </div>
                 <Button onClick={onClose} className="w-full mt-6 rounded-xl">Done</Button>
             </div>
        </div>
    )
}

// --- Main App Component ---
export default function App() {
  const [appView, setAppView] = useState<AppView>(AppView.TRIP_LIST);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeTripTab, setActiveTripTab] = useState<TripTab>(TripTab.DASHBOARD);
  
  // User Identity State
  // Default to 'm1' (Host) for demo, can be null if acting as fresh guest
  const [currentUserId, setCurrentUserId] = useState<string>('m1'); 

  // Editor State (For New Scan)
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});
  
  // Manual Entry State
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Host/Settings State
  const [showShareModal, setShowShareModal] = useState(false);

  // Detail View State (For Existing Transaction)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailEdits, setDetailEdits] = useState<Expense | null>(null);
  
  // Lightbox & Assignment State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeAssignmentItemId, setActiveAssignmentItemId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTrip = trips.find(t => t.id === activeTripId);

  // --- Logic: Create Trip ---
  const [newTripName, setNewTripName] = useState('');
  const [newTripMembers, setNewTripMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: newMemberName,
      avatar: ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨'][Math.floor(Math.random() * 6)],
      color: getRandomColor(),
    };
    setNewTripMembers([...newTripMembers, newMember]);
    setNewMemberName('');
  };

  const handleCreateTrip = () => {
    if (!newTripName.trim()) return;
    
    // Auto-add "Me"
    const host: Member = {
        id: `m-host-${Date.now()}`,
        name: 'Me',
        avatar: '😎',
        color: 'bg-primary'
    };
    const finalMembers = [host, ...newTripMembers];

    const newTrip: Trip = {
      id: `t-${Date.now()}`,
      name: newTripName,
      date: new Date().toISOString(),
      members: finalMembers,
      expenses: []
    };
    setTrips([newTrip, ...trips]);
    setNewTripName('');
    setNewTripMembers([]);
    setCurrentUserId(host.id); // Switch to this user context
    setAppView(AppView.TRIP_LIST);
  };

  // --- Logic: Manage Members ---
  const [manageMemberName, setManageMemberName] = useState('');
  const addGhostMember = () => {
      if(!manageMemberName.trim() || !activeTrip) return;
      
      const newMember: Member = {
          id: `m-ghost-${Date.now()}`,
          name: manageMemberName,
          avatar: ['🍋', '🥑', '🍒', '🍉', '🍇'][Math.floor(Math.random() * 5)],
          color: getRandomColor()
      };
      
      const updatedTrips = trips.map(t => {
          if(t.id === activeTrip.id) {
              return { ...t, members: [...t.members, newMember] };
          }
          return t;
      });
      setTrips(updatedTrips);
      setManageMemberName('');
  }

  // --- Logic: Receipt Parsing ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeTrip) return;

    setShowActionSheet(false); // Close action sheet
    setIsProcessing(true);
    setIsEditingExpense(true); // Open Modal

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const base64Content = base64Data.split(',')[1];

      try {
        const parsedItems = await processReceiptImage(base64Content);
        
        const items: ReceiptItem[] = parsedItems.map((pi, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          name: pi.name,
          quantity: pi.quantity,
          price: pi.price,
          assignedTo: [],
        }));

        const total = items.reduce((acc, item) => acc + item.price, 0);

        setCurrentExpense({
          id: `exp-${Date.now()}`,
          tripId: activeTrip.id,
          date: new Date().toISOString(),
          payerId: currentUserId || activeTrip.members[0].id, // Default to Me
          items: items,
          totalAmount: total,
          isParsed: true,
          description: "New Scan",
          receiptImageUrl: base64Data // Store image
        });
      } catch (err) {
        alert("Parsing failed. Please try again.");
        setIsEditingExpense(false);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveExpense = () => {
    if (!currentExpense.id || !activeTrip) return;
    
    const updatedTrips = trips.map(t => {
      if (t.id === activeTrip.id) {
        return { ...t, expenses: [currentExpense as Expense, ...t.expenses] };
      }
      return t;
    });
    
    setTrips(updatedTrips);
    setIsEditingExpense(false);
    setCurrentExpense({});
  };

  // --- Logic: Manual Entry Save ---
  const handleManualSave = (expense: Expense) => {
      if(!activeTrip) return;
      
      const updatedTrips = trips.map(t => {
        if (t.id === activeTrip.id) {
          return { ...t, expenses: [expense, ...t.expenses] };
        }
        return t;
      });

      setTrips(updatedTrips);
      setShowManualEntry(false);
  }


  // --- Logic: Detail Editing ---
  const startEditingDetail = () => {
    if (viewingExpense) {
      setDetailEdits(JSON.parse(JSON.stringify(viewingExpense)));
      setIsEditingDetail(true);
    }
  };

  const saveDetailEdits = () => {
    if (!detailEdits || !activeTrip) return;

    // Recalculate total just in case
    const newTotal = detailEdits.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const finalExpense = { ...detailEdits, totalAmount: newTotal };

    const updatedTrips = trips.map(t => {
      if (t.id === activeTrip.id) {
        const updatedExpenses = t.expenses.map(e => e.id === finalExpense.id ? finalExpense : e);
        return { ...t, expenses: updatedExpenses };
      }
      return t;
    });

    setTrips(updatedTrips);
    setViewingExpense(finalExpense);
    setIsEditingDetail(false);
    setDetailEdits(null);
  };

  const updateDetailItem = (itemId: string, field: 'name' | 'price', value: string | number) => {
    if (!detailEdits) return;
    const updatedItems = detailEdits.items.map(item => {
      if (item.id === itemId) {
        const finalValue = field === 'price' ? parseFloat(value.toString()) : value;
        return { ...item, [field]: finalValue };
      }
      return item;
    });
    const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setDetailEdits({ ...detailEdits, items: updatedItems, totalAmount: newTotal });
  };

  const updateDetailItemAssignment = (itemId: string, memberId: string) => {
    if (!detailEdits) return;
    const updatedItems = detailEdits.items.map(item => {
        if (item.id === itemId) {
            const current = item.assignedTo;
            const newAssign = current.includes(memberId)
                ? current.filter(id => id !== memberId)
                : [...current, memberId];
            return { ...item, assignedTo: newAssign };
        }
        return item;
    });
    setDetailEdits({ ...detailEdits, items: updatedItems });
  };

  const deleteDetailItem = (itemId: string) => {
    if (!detailEdits) return;
    const updatedItems = detailEdits.items.filter(i => i.id !== itemId);
    const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setDetailEdits({ ...detailEdits, items: updatedItems, totalAmount: newTotal });
  };

  const addDetailItem = () => {
    if (!detailEdits) return;
    const newItem: ReceiptItem = {
      id: `item-added-${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      price: 0,
      assignedTo: []
    };
    const updatedItems = [...detailEdits.items, newItem];
    setDetailEdits({ ...detailEdits, items: updatedItems });
  };


  // --- Logic: Stats & Debt ---
  const calculateStats = (trip: Trip) => {
    const balances: Record<string, number> = {};
    const spending: Record<string, number> = {};
    
    trip.members.forEach(m => {
      balances[m.id] = 0;
      spending[m.id] = 0;
    });

    trip.expenses.forEach(exp => {
      spending[exp.payerId] = (spending[exp.payerId] || 0) + exp.totalAmount;
      balances[exp.payerId] += exp.totalAmount;

      exp.items.forEach(item => {
        if (item.assignedTo.length > 0) {
          const split = item.price / item.assignedTo.length;
          item.assignedTo.forEach(uid => {
            balances[uid] -= split;
          });
        } else {
           balances[exp.payerId] -= item.price;
        }
      });
    });

    const debtors: {id: string, amount: number}[] = [];
    const creditors: {id: string, amount: number}[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
      const val = parseFloat(amount.toFixed(2));
      if (val < -0.01) debtors.push({ id, amount: val });
      if (val > 0.01) creditors.push({ id, amount: val });
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debts: Debt[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
      
      debts.push({ from: debtor.id, to: creditor.id, amount: parseFloat(amount.toFixed(2)) });

      debtor.amount += amount;
      creditor.amount -= amount;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { debts, spending };
  };

  // --- VIEWS ---

  const TripListView = () => (
    <div className="p-6 space-y-6 animate-in fade-in">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-500 font-medium">Ready for your next adventure?</p>
        </div>
      </header>
      
      <div className="space-y-4">
        {trips.map(trip => {
           const total = trip.expenses.reduce((s, e) => s + e.totalAmount, 0);
           return (
             <div 
                key={trip.id} 
                className="bg-white p-5 rounded-3xl shadow-soft border border-indigo-50 relative group active:scale-95 transition-transform"
             >
                <div 
                  onClick={() => { setActiveTripId(trip.id); setAppView(AppView.TRIP_DETAIL); setActiveTripTab(TripTab.DASHBOARD); }}
                  className="cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{trip.name}</h3>
                        <p className="text-xs text-gray-400 font-medium">{new Date(trip.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        ${total.toFixed(0)}
                    </div>
                    </div>
                    <div className="flex -space-x-2">
                    {trip.members.map(m => <Avatar key={m.id} member={m} />)}
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-xs">
                        <Icons.ChevronLeft />
                    </div>
                    </div>
                </div>
                
                {/* Simulation Button */}
                <button 
                  onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveTripId(trip.id); 
                      // Reset identity to simulate guest link
                      setCurrentUserId(''); 
                      setAppView(AppView.GUEST_WELCOME); 
                  }}
                  className="absolute top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 shadow-md px-3 py-1 rounded-full text-xs font-bold text-primary"
                >
                    Simulate Link
                </button>
             </div>
           );
        })}
      </div>

      <div className="fixed bottom-6 right-6">
        <button 
          onClick={() => setAppView(AppView.CREATE_TRIP)}
          className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg shadow-indigo-400/40 transition-all active:scale-90"
        >
          <Icons.Plus />
        </button>
      </div>
    </div>
  );

  const CreateTripView = () => (
    <div className="p-6 min-h-screen bg-white animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-2 mb-8">
        <button onClick={() => setAppView(AppView.TRIP_LIST)} className="text-gray-400 p-2"><Icons.ChevronLeft /></button>
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

  const GuestWelcomeView = () => {
      if(!activeTrip) return null;

      return (
          <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-white animate-in fade-in">
              <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold mb-2">Welcome to {activeTrip.name}!</h1>
                  <p className="opacity-80">Join the trip to start splitting expenses.</p>
              </div>

              <div className="bg-white text-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                  <h2 className="text-lg font-bold text-center mb-6">Who are you?</h2>
                  <div className="grid grid-cols-2 gap-4">
                      {activeTrip.members.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => { setCurrentUserId(m.id); setAppView(AppView.TRIP_DETAIL); }}
                            className="flex flex-col items-center p-4 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-indigo-50 transition-all"
                          >
                              <Avatar member={m} size="lg" />
                              <span className="mt-3 font-bold">{m.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )
  };

  const ManageMembersView = () => {
    if(!activeTrip) return null;

    return (
        <div className="p-6 min-h-screen bg-white animate-in slide-in-from-right">
             <div className="flex items-center gap-2 mb-8">
                <button onClick={() => setAppView(AppView.TRIP_DETAIL)} className="text-gray-400 p-2"><Icons.ChevronLeft /></button>
                <h2 className="text-2xl font-bold">Trip Members</h2>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    {activeTrip.members.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Avatar member={m} />
                                <span className="font-bold text-gray-800">{m.name}</span>
                                {m.id === currentUserId && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">You</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Add Ghost Member</label>
                    <div className="flex gap-2">
                        <input 
                        className="flex-1 p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Name (e.g. Sarah)"
                        value={manageMemberName}
                        onChange={e => setManageMemberName(e.target.value)}
                        />
                        <Button onClick={addGhostMember} className="rounded-xl">Add</Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Ghost members can be assigned expenses but don't have login accounts.</p>
                </div>
            </div>
        </div>
    );
  };

  const TripDashboard = ({ trip }: { trip: Trip }) => {
    const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return (
      <div className="space-y-6 pb-24 animate-in fade-in">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-2 px-1">
             <button onClick={() => setAppView(AppView.TRIP_LIST)} className="flex items-center text-gray-400 font-bold text-sm gap-1 hover:text-gray-600 transition-colors">
                 <Icons.ChevronLeft /> My Trips
             </button>
             <div className="flex gap-2">
                 <button onClick={() => setShowShareModal(true)} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary">
                     <Icons.Share />
                 </button>
                 <button onClick={() => setAppView(AppView.MANAGE_MEMBERS)} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary">
                     <Icons.Settings />
                 </button>
             </div>
        </div>

        <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <p className="text-indigo-100 text-sm font-medium mb-1 tracking-wide uppercase">Total Expenses</p>
          <h2 className="text-5xl font-bold tracking-tight">${totalSpent.toFixed(0)}</h2>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex -space-x-2">
               {trip.members.slice(0, 4).map(m => <Avatar key={m.id} member={m} />)}
               {trip.members.length > 4 && <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold">+{trip.members.length - 4}</div>}
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium">
               {trip.expenses.length} Receipts
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Recent Transactions</h3>
          {trip.expenses.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <Icons.Receipt />
                <p className="mt-2 text-sm">No receipts yet</p>
             </div>
          ) : (
             <div className="space-y-3">
               {trip.expenses.map(exp => (
                 <div 
                  key={exp.id} 
                  onClick={() => setViewingExpense(exp)}
                  className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.98]"
                >
                   <div className="flex items-center gap-3">
                     <div className="bg-indigo-50 p-3 rounded-2xl text-primary">
                       <Icons.Receipt /> 
                     </div>
                     <div>
                       <p className="font-bold text-gray-800">{exp.description}</p>
                       <p className="text-xs text-gray-400 font-medium">{new Date(exp.date).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-gray-900">${exp.totalAmount.toFixed(2)}</p>
                     <p className="text-xs text-gray-400">
                       by {trip.members.find(m => m.id === exp.payerId)?.name}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    );
  };

  const StatsView = ({ trip }: { trip: Trip }) => {
    const { debts, spending } = calculateStats(trip);
    const maxSpend = Math.max(...Object.values(spending), 1);

    return (
      <div className="space-y-8 pb-24 animate-in fade-in">
        <section className="bg-white p-6 rounded-3xl shadow-sm">
           <h3 className="text-lg font-bold text-gray-800 mb-6">Spending Breakdown</h3>
           <div className="space-y-4">
             {trip.members.map(m => {
               const amount = spending[m.id] || 0;
               const percent = (amount / maxSpend) * 100;
               const isMe = m.id === currentUserId;
               return (
                 <div key={m.id}>
                    <div className="flex justify-between text-sm mb-1 font-medium">
                       <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${m.color}`}></div>
                         {m.name} {isMe && <span className="text-xs text-gray-400">(You)</span>}
                       </div>
                       <span className={isMe ? 'text-primary font-bold' : ''}>${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full ${m.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                    </div>
                 </div>
               );
             })}
           </div>
        </section>

        <section>
           <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Settlement Plan</h3>
           {debts.length === 0 ? (
             <div className="p-6 bg-emerald-50 rounded-3xl text-emerald-700 text-center">
                <p className="font-bold">Everything is settled! 🎉</p>
             </div>
           ) : (
             <div className="space-y-3">
               {debts.map((debt, idx) => {
                 const from = trip.members.find(m => m.id === debt.from)!;
                 const to = trip.members.find(m => m.id === debt.to)!;
                 const involvesMe = from.id === currentUserId || to.id === currentUserId;
                 
                 return (
                    <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border-l-4 ${involvesMe ? 'border-l-primary bg-indigo-50/30' : 'border-l-pink-400'}`}>
                       <div className="flex items-center gap-3">
                          <Avatar member={from} size="sm" />
                          <div className="text-sm">
                             <span className="font-bold text-gray-800">{from.id === currentUserId ? 'You' : from.name}</span>
                             <span className="text-gray-400 mx-1">owe</span>
                             <span className="font-bold text-gray-800">{to.id === currentUserId ? 'You' : to.name}</span>
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">${debt.amount.toFixed(2)}</div>
                    </div>
                 );
               })}
             </div>
           )}
        </section>
      </div>
    );
  };

  const ManualEntryOverlay = () => {
    if (!activeTrip) return null;

    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payerId, setPayerId] = useState(currentUserId || activeTrip.members[0].id);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const toggleMember = (id: string) => {
      if (selectedMembers.includes(id)) {
        setSelectedMembers(selectedMembers.filter(m => m !== id));
      } else {
        setSelectedMembers([...selectedMembers, id]);
      }
    };

    const toggleAll = () => {
        if(selectedMembers.length === activeTrip.members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(activeTrip.members.map(m => m.id));
        }
    }

    const onSave = () => {
        if(!amount || !description) return;
        
        const priceVal = parseFloat(amount);

        const manualItem: ReceiptItem = {
            id: `manual-item-${Date.now()}`,
            name: description,
            quantity: 1,
            price: priceVal,
            assignedTo: selectedMembers.length > 0 ? selectedMembers : [] 
        };

        const newExpense: Expense = {
            id: `exp-manual-${Date.now()}`,
            tripId: activeTrip.id,
            description: description,
            date: new Date(date).toISOString(),
            payerId: payerId,
            items: [manualItem],
            totalAmount: priceVal,
            isParsed: false
        };

        handleManualSave(newExpense);
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-5">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <button onClick={() => setShowManualEntry(false)} className="p-2 text-gray-400 hover:text-gray-600">
                   <Icons.Close />
                </button>
                <h2 className="font-bold text-lg">Add Expense</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Amount */}
                <div className="text-center space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wide">Amount</label>
                    <div className="flex items-center justify-center text-primary">
                        <span className="text-4xl font-bold mr-1">$</span>
                        <input 
                          type="number" 
                          autoFocus
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="text-6xl font-bold text-center w-full bg-transparent focus:outline-none placeholder-gray-200"
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                        <input 
                           value={description}
                           onChange={e => setDescription(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                           placeholder="What is this for?"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                        <input 
                           type="date"
                           value={date}
                           onChange={e => setDate(e.target.value)}
                           className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                     <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Who Paid?</label>
                       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                          {activeTrip.members.map(m => (
                            <button 
                              key={m.id}
                              onClick={() => setPayerId(m.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all shrink-0 ${payerId === m.id ? `border-${m.color.replace('bg-', '')} bg-gray-50` : 'border-transparent bg-gray-50'}`}
                            >
                              <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                              <span className={`text-sm font-bold ${payerId === m.id ? 'text-gray-900' : 'text-gray-500'}`}>{m.name}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Split With</label>
                            <button onClick={toggleAll} className="text-xs font-bold text-primary">
                                {selectedMembers.length === activeTrip.members.length ? 'Select None' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                             {activeTrip.members.map(m => {
                                 const isSelected = selectedMembers.includes(m.id);
                                 return (
                                     <button 
                                        key={m.id}
                                        onClick={() => toggleMember(m.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${isSelected ? `border-${m.color.replace('bg-', '')} bg-indigo-50/50` : 'border-gray-100 bg-white'}`}
                                     >
                                         <Avatar member={m} size="md" />
                                         <span className={`text-xs font-bold mt-2 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{m.name}</span>
                                         {isSelected && <div className="mt-1 w-2 h-2 rounded-full bg-green-400"></div>}
                                     </button>
                                 )
                             })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100">
                <Button onClick={onSave} className="w-full py-6 text-lg rounded-2xl shadow-xl shadow-indigo-200">
                    Add Expense
                </Button>
            </div>
        </div>
    );
  };

  const ActionSheet = () => {
      if(!showActionSheet) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowActionSheet(false)}></div>
              <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
                  <div className="space-y-4">
                      <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-900 p-6 rounded-3xl flex items-center gap-4 transition-colors group"
                      >
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                              <Icons.Camera />
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-bold">Scan Receipt</h3>
                              <p className="text-sm text-indigo-400/80 font-medium">Auto-extract items with AI</p>
                          </div>
                      </button>

                      <button 
                         onClick={() => { setShowActionSheet(false); setShowManualEntry(true); }}
                         className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 p-6 rounded-3xl flex items-center gap-4 transition-colors group"
                      >
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                              <Icons.Keyboard />
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-bold">Manual Entry</h3>
                              <p className="text-sm text-emerald-600/60 font-medium">Type in amount and split</p>
                          </div>
                      </button>
                  </div>
                  <button onClick={() => setShowActionSheet(false)} className="w-full mt-6 py-4 text-gray-400 font-bold hover:text-gray-600">Cancel</button>
              </div>
          </div>
      )
  }

  const ShareModal = () => {
    if(!showShareModal || !activeTrip) return null;

    const dummyLink = `https://splittrek.app/trip/${activeTrip.id}?join=true`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Icons.Share />
                    </div>
                    <h3 className="text-xl font-bold">Invite Friends</h3>
                    <p className="text-sm text-gray-500 mt-2">Share this link so friends can join <b>{activeTrip.name}</b> and split costs.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 mb-6 border border-gray-100">
                    <div className="p-2 bg-white rounded-lg text-gray-400">
                        <Icons.Link />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-gray-400 uppercase">Trip Link</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{dummyLink}</p>
                    </div>
                </div>

                <Button className="w-full py-4 rounded-xl flex items-center gap-2" onClick={() => setShowShareModal(false)}>
                    <Icons.Copy /> Copy Link
                </Button>
            </div>
        </div>
    );
  };

  const ExpenseEditorOverlay = () => {
    if (!activeTrip) return null;
    
    const items = currentExpense.items || [];

    const toggleAssignment = (itemId: string, userId: string) => {
        const updatedItems = items.map(item => {
          if (item.id !== itemId) return item;
          const current = item.assignedTo;
          const newAssign = current.includes(userId) 
            ? current.filter(id => id !== userId)
            : [...current, userId];
          return { ...item, assignedTo: newAssign };
        });
        setCurrentExpense({ ...currentExpense, items: updatedItems });
    };

    const toggleAllForUser = (userId: string) => {
        const allAssigned = items.every(item => item.assignedTo.includes(userId));
        const updatedItems = items.map(item => {
            let newAssign = item.assignedTo;
            if (allAssigned) {
                newAssign = newAssign.filter(id => id !== userId);
            } else {
                if (!newAssign.includes(userId)) newAssign = [...newAssign, userId];
            }
            return { ...item, assignedTo: newAssign };
        });
        setCurrentExpense({ ...currentExpense, items: updatedItems });
    };

    if (isProcessing) {
      return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
           <Loading />
           <p className="mt-4 font-bold text-primary animate-pulse">Reading receipt...</p>
        </div>
      );
    }

    return (
       <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-in slide-in-from-bottom-5">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between shadow-sm">
             <button onClick={() => setIsEditingExpense(false)} className="p-2 rounded-full hover:bg-gray-100">
               <Icons.ChevronLeft />
             </button>
             <h2 className="font-bold text-lg">Edit Receipt</h2>
             <Button size="sm" onClick={saveExpense} className="rounded-full px-6">Save</Button>
          </div>

          <div className="p-4 pb-24 space-y-6">
             <div className="bg-white p-5 rounded-3xl shadow-sm">
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                  <input 
                    className="w-full text-xl font-bold border-b border-gray-100 py-2 focus:outline-none focus:border-primary"
                    value={currentExpense.description || ''}
                    onChange={e => setCurrentExpense({...currentExpense, description: e.target.value})}
                    placeholder="What is this for?"
                  />
                </div>
                
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Who Paid?</label>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {activeTrip.members.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setCurrentExpense({...currentExpense, payerId: m.id})}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${currentExpense.payerId === m.id ? `border-${m.color.replace('bg-', '')} bg-gray-50` : 'border-transparent bg-gray-50'}`}
                        >
                          <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                          <span className={`text-sm font-bold ${currentExpense.payerId === m.id ? 'text-gray-900' : 'text-gray-500'}`}>{m.name}</span>
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div>
                <div className="flex justify-between items-center mb-4 px-2">
                   <h3 className="font-bold text-gray-800">Items</h3>
                   <div className="flex gap-1">
                      {activeTrip.members.map(m => (
                         <button key={m.id} onClick={() => toggleAllForUser(m.id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm">{m.avatar}</button>
                      ))}
                   </div>
                </div>
                
                <div className="space-y-3">
                   {items.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                         <div className="flex justify-between mb-3">
                            <span className="font-bold text-gray-800">{item.name} <span className="text-gray-400 font-normal text-sm">x{item.quantity}</span></span>
                            <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                         </div>
                         <div className="flex gap-2 flex-wrap">
                            {activeTrip.members.map(m => {
                               const selected = item.assignedTo.includes(m.id);
                               return (
                                  <button
                                     key={m.id}
                                     onClick={() => toggleAssignment(item.id, m.id)}
                                     className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all ${selected ? `${m.color} text-white border-transparent` : 'bg-white border-gray-200 text-gray-400'}`}
                                  >
                                     {m.avatar} {m.name}
                                  </button>
                               )
                            })}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    );
  };

  const TransactionDetailModal = () => {
    if (!viewingExpense || !activeTrip) return null;
    
    // Determine which data to show
    const displayExpense = isEditingDetail && detailEdits ? detailEdits : viewingExpense;
    
    // Helper to close modal completely
    const closeModal = () => {
      setViewingExpense(null);
      setIsEditingDetail(false);
      setDetailEdits(null);
    }

    const activeAssignmentItem = detailEdits?.items.find(i => i.id === activeAssignmentItemId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal}></div>
         <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* New Clean Header */}
            <div className="pt-6 px-6 pb-2 flex justify-between items-start bg-white z-10">
               <div>
                  <h2 className="text-2xl font-bold text-gray-800">{displayExpense.description}</h2>
                  <p className="text-sm text-gray-400 font-medium mt-1">
                     {new Date(displayExpense.date).toLocaleDateString()} • Paid by {activeTrip.members.find(m => m.id === displayExpense.payerId)?.name}
                  </p>
               </div>
               
                {isEditingDetail ? (
                  <button onClick={saveDetailEdits} className="bg-primary text-white px-5 py-2 rounded-full font-bold shadow-md text-sm hover:bg-primary-dark transition-colors">
                    Save
                  </button>
               ) : (
                   <div className="flex gap-2">
                        <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <Icons.Close />
                        </button>
                        <button onClick={startEditingDetail} className="p-2 text-primary hover:bg-indigo-50 rounded-full">
                            <Icons.Pencil />
                        </button>
                   </div>
               )}
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
               
               {/* Receipt Thumbnail Section */}
               {displayExpense.receiptImageUrl && (
                  <div className="mb-6 relative group cursor-pointer" onClick={() => setLightboxImage(displayExpense.receiptImageUrl || '')}>
                     <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img 
                           src={displayExpense.receiptImageUrl} 
                           className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                           alt="Receipt Thumbnail" 
                        />
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-gray-800 shadow-sm flex items-center gap-2 group-hover:bg-white transition-colors">
                           <Icons.Search /> Tap to View Receipt
                        </div>
                     </div>
                  </div>
               )}

               <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isEditingDetail ? 'Edit Breakdown' : 'Breakdown'}
                 </h3>
                 <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">{displayExpense.items.length} Items</span>
               </div>
               
               <div className="space-y-4 pb-20">
                  {displayExpense.items.map(item => (
                     <div key={item.id} className={`flex items-center justify-between group ${isEditingDetail ? 'bg-gray-50 p-3 rounded-2xl border border-gray-100' : 'py-1'}`}>
                        {isEditingDetail ? (
                           // EDIT MODE ROW
                           <div className="w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <input 
                                   value={item.name}
                                   onChange={(e) => updateDetailItem(item.id, 'name', e.target.value)}
                                   className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                   placeholder="Item Name"
                                />
                                <button 
                                  onClick={() => deleteDetailItem(item.id)}
                                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 w-24">
                                      <span className="text-gray-400 text-xs">$</span>
                                      <input 
                                          type="number"
                                          value={item.price}
                                          onChange={(e) => updateDetailItem(item.id, 'price', e.target.value)}
                                          className="w-full py-2 text-sm font-bold text-primary outline-none text-right"
                                          placeholder="0.00"
                                      />
                                  </div>
                                  
                                  {/* Member Assignment Button */}
                                  <button 
                                    onClick={() => setActiveAssignmentItemId(item.id)}
                                    className="flex-1 flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
                                  >
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                          {item.assignedTo.length > 0 ? item.assignedTo.map(uid => {
                                              const m = activeTrip.members.find(mem => mem.id === uid);
                                              if (!m) return null;
                                              return <div key={uid} className="scale-75"><Avatar member={m} size="sm" /></div>
                                          }) : <span className="text-xs text-gray-400 italic">Unassigned</span>}
                                      </div>
                                      <Icons.Users />
                                  </button>
                              </div>
                           </div>
                        ) : (
                           // VIEW MODE ROW
                           <>
                            <div className="flex flex-col">
                               <span className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{item.name}</span>
                               {item.quantity > 1 && <span className="text-xs text-gray-400 font-medium">Qty: {item.quantity}</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <span className="font-bold text-gray-800">${item.price.toFixed(2)}</span>
                               <div className="flex -space-x-2">
                                  {item.assignedTo.map(uid => {
                                     const m = activeTrip.members.find(mem => mem.id === uid);
                                     if (!m) return null;
                                     return <div key={uid} className="scale-75 origin-right"><Avatar member={m} size="sm" /></div>
                                  })}
                               </div>
                            </div>
                           </>
                        )}
                     </div>
                  ))}
               
                  {isEditingDetail && (
                    <button 
                        onClick={addDetailItem}
                        className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.Plus /> Add Item
                    </button>
                  )}
                </div>
            </div>
            
            {/* Total Footer */}
             <div className="bg-white border-t border-gray-100 p-6 flex justify-between items-center z-10">
                  <span className="font-bold text-gray-500">Total Paid</span>
                  <span className="text-3xl font-bold text-primary">${displayExpense.totalAmount.toFixed(2)}</span>
             </div>

             {/* Member Assignment Overlay (Nested in Modal) */}
             {activeAssignmentItemId && activeAssignmentItem && (
                 <MemberAssignmentSheet 
                    item={activeAssignmentItem}
                    members={activeTrip.members}
                    onClose={() => setActiveAssignmentItemId(null)}
                    onToggle={(mid) => updateDetailItemAssignment(activeAssignmentItem.id, mid)}
                 />
             )}
         </div>
         
         {/* Full Screen Lightbox (Outside Modal Flow) */}
         {lightboxImage && (
            <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
         )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans selection:bg-primary-light">
      <main className="max-w-lg mx-auto min-h-screen relative">
         
         <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
         />

         {appView === AppView.TRIP_LIST && <TripListView />}
         {appView === AppView.CREATE_TRIP && <CreateTripView />}
         
         {appView === AppView.TRIP_DETAIL && activeTrip && (
            <>
               <div className="px-6 pt-6">
                 {activeTripTab === TripTab.DASHBOARD ? <TripDashboard trip={activeTrip} /> : <StatsView trip={activeTrip} />}
               </div>

               {/* Bottom Navigation */}
               <div className="fixed bottom-6 left-6 right-6">
                  <div className="bg-white rounded-3xl shadow-2xl p-2 flex justify-between items-center px-6 border border-gray-50">
                     <button 
                        onClick={() => setActiveTripTab(TripTab.DASHBOARD)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTripTab === TripTab.DASHBOARD ? 'text-primary' : 'text-gray-300'}`}
                     >
                        <Icons.Home />
                        <span className="text-[10px] font-bold">Home</span>
                     </button>

                     <div className="relative -top-8">
                        <button 
                           onClick={() => setShowActionSheet(true)}
                           className="w-16 h-16 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white hover:bg-primary-dark transition-transform active:scale-95 border-4 border-background"
                        >
                           <Icons.Camera />
                        </button>
                     </div>

                     <button 
                        onClick={() => setActiveTripTab(TripTab.STATS)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTripTab === TripTab.STATS ? 'text-primary' : 'text-gray-300'}`}
                     >
                        <Icons.Chart />
                        <span className="text-[10px] font-bold">Stats</span>
                     </button>
                  </div>
               </div>
            </>
         )}

         {appView === AppView.GUEST_WELCOME && <GuestWelcomeView />}
         {appView === AppView.MANAGE_MEMBERS && <ManageMembersView />}

         {isEditingExpense && <ExpenseEditorOverlay />}
         {viewingExpense && <TransactionDetailModal />}
         {showActionSheet && <ActionSheet />}
         {showManualEntry && <ManualEntryOverlay />}
         {showShareModal && <ShareModal />}
      </main>
    </div>
  );
}