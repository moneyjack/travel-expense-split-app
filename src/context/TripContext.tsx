import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Trip, AppView, TripTab, Member } from '../types';
import { supabase } from '../lib/supabase'; // 確保路徑正確
import { Session, User } from '@supabase/supabase-js';

interface TripContextType {
    // --- UI ---
    appView: AppView;
    setAppView: (view: AppView) => void;
    activeTripTab: TripTab;
    setActiveTripTab: (tab: TripTab) => void;
    loading: boolean;

    // --- Data ---
    trips: Trip[];
    setTrips: (trips: Trip[]) => void;
    activeTripId: string | null;
    setActiveTripId: (id: string | null) => void;

    isHost: boolean;
    updateTripName: (tripId: string, name: string) => Promise<void>;
    updateMember: (memberId: string, updates: { name?: string; avatar?: string; color?: string }) => Promise<void>;
    deleteTrip: (tripId: string) => Promise<void>;
    addMember: (tripId: string, name: string) => Promise<void>;
    removeMember: (tripId: string, memberId: string) => Promise<void>;
    // --- Auth ---
    session: Session | null;
    currentUserId: string;
    setCurrentUserId: (id: string) => void;

    // --- Actions ---
    fetchTrips: () => Promise<void>;
    createTrip: (name: string, ghostMembers: Partial<Member>[], currency?: string) => Promise<void>;
    createExpense: (title: string, payerId: string, items: any[], receiptUrl?: string, date?: string) => Promise<void>;
    updateExpense: (expenseId: string, updates: Partial<any>, items?: any[]) => Promise<void>;
    deleteExpense: (expenseId: string) => Promise<void>;

    toggleExpenseSettled: (expenseId: string, currentStatus: boolean) => Promise<void>;
    settleAllExpenses: (tripId: string) => Promise<void>;

}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appView, setAppView] = useState<AppView>(AppView.TRIP_LIST);
    const [activeTripTab, setActiveTripTab] = useState<TripTab>(TripTab.DASHBOARD);
    const [loading, setLoading] = useState<boolean>(false);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [user, setUser] = useState<User | null>(null);
    
    const isHost = useMemo(() => {
        if (!user || !activeTripId || trips.length === 0) return false;
        const currentTrip = trips.find(t => t.id === activeTripId);
        if (!currentTrip) return false;

        // 方法 A: 檢查 created_by (如果你有這個欄位)
        if (currentTrip.created_by === user.id) return true;

        // 方法 B: 檢查 trip_members 表裡的 is_host (如果你是用這個)
        // 假設你的 members 陣列裡有 user_id 欄位
        const myMemberProfile = currentTrip.members.find((m: any) => m.user_id === user.id);
        return myMemberProfile?.is_host === true;
    }, [user, activeTripId, trips]);
    
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

    // ★ 1. Fetch Trips (關鍵修正：資料對應 Mapping)
    const fetchTrips = async () => {
        // if (!session) return; 
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('trips')
                .select(`
          *,
          trip_members (*),
          expenses (
            *,
            expense_items (*) 
          )
        `)
                .order('created_at', { ascending: false });
            if (error) throw error;

            if (data) {
                // ★ 這裡把 Supabase (snake_case) 轉成 Frontend (camelCase)
                const formattedTrips: Trip[] = data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    date: t.created_at,
                    currency: t.currency || 'HKD', // ★ 新增這行
                    members: t.trip_members.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        avatar: m.avatar,
                        color: m.color,
                        isHost: m.is_host
                    })),
                    // ★ 修正 Expenses 的 Mapping
                    expenses: (t.expenses || []).map((e: any) => ({
                        id: e.id,
                        description: e.title,
                        totalAmount: Number(e.amount),
                        date: e.date || e.created_at,
                        payerId: e.payer_id,
                        receiptUrl: e.receipt_image_url, // 確保這裡有對應到 DB 的欄位
                        is_settled: e.is_settled || false, // ★ 新增這行
                        // ★ 關鍵修復：處理細項
                        items: (e.expense_items || []).map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            price: Number(i.price),
                            quantity: Number(i.quantity),
                            assignedTo: i.assigned_to_ids || []
                        }))
                    }))
                }));
                setTrips(formattedTrips);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };
    const createTrip = async (name: string, members: any[], currency: string) => {
        if (!session?.user) return alert("Please login first");
        setLoading(true);
        try {
        // 1. 建立 Trip
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .insert([{ 
                name, 
                currency, 
                created_by: user?.id // 記錄建立者 ID
            }])
            .select()
            .single();

        if (tripError) throw tripError;

        // 2. 準備成員資料
        // 注意：這裡的 members 已經包含 Host (CreateTrip 頁面傳過來的)
        // 我們只需要幫忙補上 trip_id 和 user_id
        const membersPayload = members.map(m => ({
            trip_id: trip.id,
            name: m.name,
            avatar: m.avatar,
            color: m.color,
            is_host: m.is_host || false, // 確保有 host 標記
            // ★ 關鍵：如果是 Host，就把當前登入的 user.id 寫進去，方便權限控管
            user_id: m.is_host ? user?.id : null 
        }));

        const { error: memberError } = await supabase
            .from('trip_members')
            .insert(membersPayload);

        if (memberError) throw memberError;

        await fetchTrips();
        } catch (e: any) {
        console.error(e);
        alert('Create trip failed: ' + e.message);
        } finally {
        setLoading(false);
        }
    };
    

    // ★ 2. Create Expense (關鍵修正：寫入 receiptUrl 和 date)
    const createExpense = async (title: string, payerId: string, items: any[], receiptUrl?: string, date?: string) => {
        if (!activeTripId) return;
        setLoading(true);

        try {
            const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.price), 0);
            // 寫入 Expenses 表
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .insert([{
                    trip_id: activeTripId,
                    title: title,
                    amount: totalAmount,
                    payer_id: payerId,
                    receipt_image_url: receiptUrl || null, // ★ 確保寫入圖片網址
                    date: date || new Date().toISOString(), // ★ 確保寫入日期
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (expenseError) throw expenseError;

            // 寫入 Expense Items
            const itemsPayload = items.map((item: any) => ({
                expense_id: expenseData.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                assigned_to_ids: item.assignedTo?.length > 0
                    ? item.assignedTo
                    : [] // 如果沒選人，先留空，或預設給所有人
            }));

            const { error: itemsError } = await supabase
                .from('expense_items')
                .insert(itemsPayload);

            if (itemsError) throw itemsError;

            await fetchTrips();
            setAppView(AppView.TRIP_DETAIL);
            setActiveTripTab(TripTab.DASHBOARD);

        } catch (error: any) {
            console.error('Error creating expense:', error);
            alert('Save failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [session]);

    // ★ 新增：更新收據功能 (支援改標題、金額、細項分配)
    const updateExpense = async (expenseId: string, updates: Partial<any>, items?: any[]) => {
        setLoading(true);
        try {
            // 1. 更新收據主體 (Expense Header)
            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('expenses')
                    .update(updates) // 例如 { title: 'New Name', amount: 100 }
                    .eq('id', expenseId);
                if (error) throw error;
            }

            // 2. 更新細項 (Items) - 這是比較複雜的部分
            // 簡單策略：如果有傳入 items，我們先刪除舊的，再插入新的 (Upsert 也可以，但 Delete+Insert 邏輯最簡單)
            if (items) {
                // A. 刪除舊項目
                const { error: delError } = await supabase
                    .from('expense_items')
                    .delete()
                    .eq('expense_id', expenseId);
                if (delError) throw delError;

                // B. 插入新項目
                const itemsPayload = items.map(item => ({
                    expense_id: expenseId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    assigned_to_ids: item.assignedTo
                }));

                const { error: insError } = await supabase
                    .from('expense_items')
                    .insert(itemsPayload);
                if (insError) throw insError;
            }

            // 3. 刷新資料
            await fetchTrips();

        } catch (error: any) {
            console.error('Error updating expense:', error);
            alert('Update failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const deleteExpense = async (expenseId: string) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            await fetchTrips(); // 重新整理資料
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            alert('Delete failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const updateTripName = async (tripId: string, name: string) => {
        try {
            const { error } = await supabase.from('trips').update({ name }).eq('id', tripId);
            if (error) throw error;
            await fetchTrips(); // 重新抓取資料更新畫面
        } catch (e: any) {
            alert('Update failed: ' + e.message);
        }
    };

    // 2. 修改成員 (名字、頭像、顏色)
    const updateMember = async (memberId: string, updates: { name?: string; avatar?: string; color?: string }) => {
        setLoading(true);
        try {
        // ★ 正確：更新 trip_members 表
        const { error } = await supabase
            .from('trip_members')
            .update(updates)
            .eq('id', memberId);

        if (error) throw error;
        await fetchTrips();
        } catch (e: any) {
        alert('Update member failed: ' + e.message);
        } finally {
        setLoading(false);
        }
    };
     // 1. 新增成員 (修正版：寫入 trip_members 表)
    const addMember = async (tripId: string, name: string) => {
        setLoading(true);
        try {
        // 準備要寫入的新成員資料
        const newMemberPayload = {
            trip_id: tripId,
            name: name,
            avatar: '🙂', // 給個預設 Emoji
            color: 'bg-gray-400', // 給個預設顏色
            is_host: false,
            user_id: null // 訪客沒有 user_id
        };

        // ★ 修正：直接 Insert 到 trip_members 表
        const { error } = await supabase
            .from('trip_members')
            .insert([newMemberPayload]);

        if (error) throw error;
        
        // 成功後重新抓取資料
        await fetchTrips();
        } catch (e: any) {
        alert('Add member failed: ' + e.message);
        } finally {
        setLoading(false);
        }
    };

  // 2. 移除成員 (修正版：從 trip_members 表刪除)
    const removeMember = async (tripId: string, memberId: string) => {
        const currentTrip = trips.find(t => t.id === tripId);
        if (!currentTrip) return;

        // --- 安全檢查邏輯 (保持不變) ---
        const isInvolved = currentTrip.expenses.some(exp => {
            if (exp.payerId === memberId) return true;
            // 檢查 assignedTo (這裡已經是 ID array)
            const activeSplitters = exp.items.flatMap(item => item.assignedTo || []);
            if (activeSplitters.includes(memberId)) return true;
            return false;
        });

        if (isInvolved) {
            alert("Cannot remove this member because they are part of existing transactions.\n\nPlease edit or delete those transactions first.");
            return;
        }

        if (!confirm("Are you sure you want to remove this member?")) return;
        // ----------------------------

        setLoading(true);
        try {
            // ★ 修正：直接從 trip_members 表刪除
            const { error } = await supabase
                .from('trip_members')
                .delete()
                .eq('id', memberId)
                .eq('trip_id', tripId); // 雙重確認比較安全

            if (error) throw error;
            
            await fetchTrips();
        } catch (e: any) {
            alert('Remove member failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };
    // 3. 刪除旅程 (危險操作)
    const deleteTrip = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) return;
        try {
            setLoading(true);
            const { error } = await supabase.from('trips').delete().eq('id', tripId);
            if (error) throw error;

            // 刪除後回到列表
            setTrips(prev => prev.filter(t => t.id !== tripId));
            setActiveTripId(null);
            setAppView(AppView.TRIP_LIST);
        } catch (e: any) {
            alert('Delete failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpenseSettled = async (expenseId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .update({ is_settled: !currentStatus })
                .eq('id', expenseId);
            if (error) throw error;
            await fetchTrips();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const settleAllExpenses = async (tripId: string) => {
        if (!confirm("Are you sure you want to settle ALL outstanding expenses? This implies everyone has paid back their debts up to this point.")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('expenses')
                .update({ is_settled: true })
                .eq('trip_id', tripId)
                .eq('is_settled', false); // 只更新還沒結算的

            if (error) throw error;
            await fetchTrips();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        appView, setAppView, activeTripTab, setActiveTripTab, loading,
        trips, setTrips, activeTripId, setActiveTripId, session, currentUserId, setCurrentUserId,
        fetchTrips, createTrip, createExpense, updateExpense, updateTripName, updateMember, deleteTrip, deleteExpense
        , toggleExpenseSettled, settleAllExpenses, addMember, removeMember
    };

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTripContext = () => {
    const context = useContext(TripContext);
    if (!context) throw new Error('useTripContext must be used within TripProvider');
    return context;
};