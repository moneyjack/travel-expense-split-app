import React, { useEffect, useState } from 'react';
import { TripProvider, useTripContext } from './src/context/TripContext'; // 引用我們之前寫的 Context
import { AppView, TripTab } from './src/types';
import { supabase } from './src/lib/supabase'; // 確保你有這個檔案
import { Session } from '@supabase/supabase-js';

// --- 引入分拆出去的頁面組件 ---
import { TripList } from './src/components/views/TripList';
import { CreateTripView } from './src/components/views/CreateTrip';
import { TripDashboard } from './src/components/views/TripDashboard';
import { StatsView } from './src/components/views/StatsView';
import { AddActionSheet } from './src/components/views/AddActionSheet';
import Login from './src/components/Login.tsx'; // 假設你有建立 Login 組件

// --- 引入 UI 組件 ---
import { Loading } from './src/components/ui/Loading';
import { Button } from './src/components/ui/Button';

// 這是主要的內容顯示區，它需要被包在 TripProvider 裡面才能運作
const MainContent = () => {
  const { 
    appView, 
    setAppView, 
    trips, 
    activeTripId, 
    setActiveTripId,
    activeTripTab, 
    setActiveTripTab,
    loading 
  } = useTripContext();

  const [session, setSession] = useState<Session | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  // 監聽 Supabase 登入狀態
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 取得當前活動的 Trip 資料
  const activeTrip = trips.find(t => t.id === activeTripId);

  // --- 處理導航邏輯 ---
  
  // 1. 如果正在載入，顯示 Loading
  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loading /></div>;
  }

  // 2. 如果沒登入，且不是在「訪客模式」，顯示登入頁
  if (!session && appView !== AppView.GUEST_WELCOME) {
    return <Login />;
  }

  // 3. 路由判斷 (Router)
  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans">
      <main className="max-w-lg mx-auto min-h-screen relative">
        
        {/* 列表頁 */}
        {appView === AppView.TRIP_LIST && (
          <TripList 
            trips={trips}
            onSelectTrip={(id) => {
              setActiveTripId(id);
              setAppView(AppView.TRIP_DETAIL);
            }}
            onCreateTrip={() => setAppView(AppView.CREATE_TRIP)}
            onSimulateGuestLink={(id) => {
               // 這裡處理訪客連結邏輯
               alert(`Share this link: app.com/join/${id}`);
            }}
          />
        )}

        {/* 建立旅程頁 */}
        {appView === AppView.CREATE_TRIP && (
          <CreateTripView 
            onCancel={() => setAppView(AppView.TRIP_LIST)}
            onCreate={async (name, members) => {
                // 這裡之後會呼叫 Context 的 createTrip 函數
                console.log("Create trip:", name, members);
                setAppView(AppView.TRIP_LIST);
            }}
          />
        )}

        {/* 旅程詳情頁 (Dashboard / Stats) */}
        {appView === AppView.TRIP_DETAIL && activeTrip && (
          <>
            <div className="px-6 pt-6">
              {activeTripTab === TripTab.DASHBOARD ? (
                <TripDashboard 
                  trip={activeTrip}
                  onViewExpense={(expense) => {
                    console.log("View Expense", expense);
                    // 這裡觸發打開 Modal 的狀態 (建議 Modal 也放在 Context 或這裡管理)
                  }}
                  onNavigateTripList={() => setAppView(AppView.TRIP_LIST)}
                  onShowShareModal={() => {}}
                  onNavigateManageMembers={() => setAppView(AppView.MANAGE_MEMBERS)}
                />
              ) : (
                <StatsView 
                  trip={activeTrip} 
                  currentUserId={session?.user.id || ''}
                  // 這裡需要 Context 提供計算好的 stats，或者在 View 裡面算
                  stats={{ debts: [], spending: {} }} 
                />
              )}
            </div>

            {/* 底部導航列 (Bottom Nav) - 這是共用的 */}
            <div className="fixed bottom-6 left-6 right-6">
               <div className="bg-white rounded-3xl shadow-2xl p-2 flex justify-between items-center px-6 border border-gray-50">
                  <button onClick={() => setActiveTripTab(TripTab.DASHBOARD)} className={activeTripTab === TripTab.DASHBOARD ? 'text-primary' : 'text-gray-300'}>
                    Home
                  </button>
                  {/* 中間的大按鈕 */}
                  <div className="relative -top-8">
                    <button 
                      onClick={() => setShowAddMenu(true)} // 點擊打開選單
                      className="w-16 h-16 bg-primary rounded-full shadow-lg text-white border-4 border-background flex items-center justify-center active:scale-90 transition-transform"
                    >
                      {/* 加一個簡單的 + 號 Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                  <button onClick={() => setActiveTripTab(TripTab.STATS)} className={activeTripTab === TripTab.STATS ? 'text-primary' : 'text-gray-300'}>
                    Stats
                  </button>
               </div>
            </div>
          </>
        )}
        {/* ★ 3. 放入選單組件 */}
        <AddActionSheet 
          isOpen={showAddMenu}
          onClose={() => setShowAddMenu(false)}
          onScan={() => {
            setShowAddMenu(false);
            console.log("打開相機邏輯...");
            // 這裡之後接：呼叫手機相機 / 檔案選擇器
          }}
          onManual={() => {
            setShowAddMenu(false);
            // 切換到「手動輸入」頁面 (如果不確定有沒有 MANUAL_ENTRY，可以用 alert 測試)
            // setAppView(AppView.MANUAL_ENTRY); 
            console.log("切換到手動輸入...");
          }}
        />
      </main>
    </div>
  );
};

// App 的外殼只負責提供 Context
export default function App() {
  return (
    <TripProvider>
      <MainContent />
    </TripProvider>
  );
}