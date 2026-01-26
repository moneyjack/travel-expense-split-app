import React, { useEffect, useState, useRef} from 'react';
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
import { ConfirmReceiptView } from './src/components/views/ConfirmReceiptView'; // 引入新頁面
import { TransactionDetailModal } from './src/components/views/TransactionDetailModal';
import { ManualEntryView } from './src/components/views/ManualEntryView'; // ★ 新增這行
import Login from './src/components/Login.tsx'; // 假設你有建立 Login 組件


// --- 引入 UI 組件 ---
import { Loading } from './src/components/ui/Loading';
import { Button } from './src/components/ui/Button';
import { processReceiptImage } from './services/openrouterService.ts'; // 引入你的服務
import { uploadReceiptImage } from './src/lib/storage'; // 引入之前的上傳服務

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
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 加入分析中的狀態
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<{shopName: string, date: string, items: any[]} | null>(null);
  const [scannedImage, setScannedImage] = useState<string>('');
  
  const [viewingExpense, setViewingExpense] = useState<any | null>(null);

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
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setShowAddMenu(false); // 關閉選單
      // A. 先上傳到 Supabase Storage (備份原圖)
      console.log("Uploading to Supabase...");
      
      const publicUrl = await uploadReceiptImage(file);
      if (publicUrl) {
        setScannedImage(publicUrl);
        console.log("Image uploaded:", publicUrl);
      }
      // B. 呼叫 Gemini 分析 (這裡需要將 File 轉 Base64)
      console.log("Analyzing with Gemini...");
      const base64 = await fileToBase64(file);
      const result = await processReceiptImage(base64);

      console.log("Analysis Result:", result);
      setScanResult(result);
      setAppView(AppView.SCAN_RECEIPT); // 切換到確認頁 (記得在 types.ts 補上這個 enum)

    } catch (error: any) {
      console.error(error);
      alert("處理失敗: " + error.message);
    } finally {
      setIsAnalyzing(false);
      // 清空 input 讓使用者可以重複選同一張圖
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
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
               alert(`${window.location.origin}/join/${id}`);
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
            <div className="px-6 py-6">
              {activeTripTab === TripTab.DASHBOARD ? (
                <TripDashboard 
                  trip={activeTrip}
                  onViewExpense={(expense) => {
                    console.log("View Expense", expense);
                   setViewingExpense(expense); // <--- 加這行
                  }}
                  onNavigateTripList={() => setAppView(AppView.TRIP_LIST)}
                  onShowShareModal={() => {}}
                  onNavigateManageMembers={() => setAppView(AppView.MANAGE_MEMBERS)}
                />
              ) : (
                <StatsView 
                  trip={activeTrip} 
                  currentUserId={session?.user.id || ''}
                
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

        {appView === AppView.SCAN_RECEIPT && (
          <ConfirmReceiptView 
            scanResult={scanResult}
            receiptUrl={scannedImage}
            onCancel={() => setAppView(AppView.TRIP_DETAIL)}
          />
        )}
        {appView === AppView.MANUAL_ENTRY && (
          <ManualEntryView 
            onCancel={() => setAppView(AppView.TRIP_DETAIL)}
          />
        )}
        <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/jpeg, image/png" // 限制只能選圖片
         capture="environment" // 手機上優先開啟後置相機
         onChange={handleFileChange}
       />

        {/* ★ 3. 放入選單組件 */}
       <AddActionSheet 
          isOpen={showAddMenu}
          onClose={() => setShowAddMenu(false)}
          onScan={() => {
            fileInputRef.current?.click();
          }}
          onManual={() => {
            setShowAddMenu(false);
            setAppView(AppView.MANUAL_ENTRY); // 確保你有定義這個 Enum
          }}
       />

       {/* 簡單的 Loading 遮罩 */}
       {isAnalyzing && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center text-white flex-col gap-4">
           <Loading />
           <p className="font-bold">AI 正在努力看收據...</p>
         </div>
       )}

       {viewingExpense && (
        <TransactionDetailModal 
          expense={viewingExpense}
          onClose={() => setViewingExpense(null)} 
        />
      )}
      </main>
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 "data:image/jpeg;base64," 前綴，因為 Google SDK 有時只需要後半段
      const base64Clean = result.split(',')[1]; 
      resolve(base64Clean);
    };
    reader.onerror = error => reject(error);
  });
};
// App 的外殼只負責提供 Context
export default function App() {
  return (
    <TripProvider>
      <MainContent />
    </TripProvider>
  );
}