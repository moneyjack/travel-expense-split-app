import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, AppView, TripTab, Member } from '../types'; // 確保引用了 Member
import { supabase } from '../lib/supabase'; // 確保路徑正確
import { Session } from '@supabase/supabase-js';

interface TripContextType {
  // --- UI 狀態 ---
  appView: AppView;
  setAppView: (view: AppView) => void;
  activeTripTab: TripTab;
  setActiveTripTab: (tab: TripTab) => void;
  loading: boolean;

  // --- 資料狀態 ---
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;
  
  // --- 用戶身份 ---
  session: Session | null; // 新增：讓 App 知道現在是誰登入
  currentUserId: string;
  setCurrentUserId: (id: string) => void;

  // --- 動作 (Actions) ---
  fetchTrips: () => Promise<void>;
  createTrip: (name: string, ghostMembers: Partial<Member>[]) => Promise<void>; // 新增：建立旅程
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI State
  const [appView, setAppView] = useState<AppView>(AppView.TRIP_LIST);
  const [activeTripTab, setActiveTripTab] = useState<TripTab>(TripTab.DASHBOARD);
  const [loading, setLoading] = useState<boolean>(false);

  // Data State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(''); 

  // 1. 監聽 Supabase Auth 狀態 (一載入就檢查有沒有登入)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setCurrentUserId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setCurrentUserId(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 從 Supabase 抓取旅程資料
  const fetchTrips = async () => {
    // 如果沒登入，就不抓資料 (或者只抓 LocalStorage，視你的需求)
    // 這裡假設必須登入才能看自己的旅程
    // if (!session) return; 

    setLoading(true);
    try {
      // 這裡抓取 trips 以及關聯的 members 和 expenses
      // 注意：這需要 Supabase 的 Foreign Key 設定正確
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_members (*),
          expenses (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // 這裡做一個簡單的 map，確保資料結構符合前端 Types
        // 實際專案中這裡通常會用 Zod 做驗證
        const formattedTrips: Trip[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          date: t.created_at,
          members: t.trip_members.map((m: any) => ({
             id: m.id,
             name: m.name,
             avatar: m.avatar,
             color: m.color,
             isHost: m.is_host
          })),
          expenses: t.expenses || [] // 暫時先空著，之後要再 join expense_items
        }));
        setTrips(formattedTrips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. 建立旅程 (核心功能)
  const createTrip = async (name: string, ghostMembers: Partial<Member>[]) => {
    if (!session?.user) {
      alert("請先登入才能建立旅程！");
      return;
    }

    setLoading(true);
    try {
      // Step A: 建立 Trip 本體
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert([{ 
          name: name, 
          created_by: session.user.id 
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // Step B: 準備成員資料 (Host + Ghosts)
      const membersPayload = [
        // 1. Host (你自己)
        {
          trip_id: tripData.id,
          name: 'Me', // 或者用 session.user.email
          user_id: session.user.id,
          is_host: true,
          avatar: '😎',
          color: 'bg-primary'
        },
        // 2. Ghost Members (來自 CreateTrip 頁面的輸入)
        ...ghostMembers.map(m => ({
          trip_id: tripData.id,
          name: m.name,
          user_id: null, // 訪客沒有 user_id
          is_host: false,
          avatar: m.avatar,
          color: m.color
        }))
      ];

      // Step C: 寫入成員
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert(membersPayload);

      if (memberError) throw memberError;

      // Step D: 成功！重新抓取資料並跳轉
      await fetchTrips();
      setActiveTripId(tripData.id);
      setAppView(AppView.TRIP_DETAIL); // 跳轉到詳情頁

    } catch (error: any) {
      console.error('Error creating trip:', error);
      alert('建立失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchTrips();
  }, [session]); // 當 session 改變時 (登入後) 自動抓資料

  const value: TripContextType = {
    appView,
    setAppView,
    activeTripTab,
    setActiveTripTab,
    loading,
    trips,
    setTrips,
    activeTripId,
    setActiveTripId,
    session,
    currentUserId,
    setCurrentUserId,
    fetchTrips,
    createTrip,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within TripProvider');
  }
  return context;
};