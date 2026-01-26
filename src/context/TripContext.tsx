import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, AppView, TripTab, Member } from '../types';
import { supabase } from '../lib/supabase'; // 確保路徑正確
import { Session } from '@supabase/supabase-js';

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

    updateTripName: (tripId: string, name: string) => Promise<void>;
    updateMember: (memberId: string, updates: { name?: string; avatar?: string; color?: string }) => Promise<void>;
    deleteTrip: (tripId: string) => Promise<void>;

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

    const createTrip = async (name: string, ghostMembers: Partial<Member>[], currency: string = 'HKD') => {
        if (!session?.user) return alert("Please login first");
        setLoading(true);
        try {
            const { data: tripData, error: tripError } = await supabase
                .from('trips')
                .insert([{ name: name, created_by: session.user.id, currency: currency }])
                .select().single();
            if (tripError) throw tripError;

            const membersPayload = [
                { trip_id: tripData.id, name: 'Me', user_id: session.user.id, is_host: true, avatar: '😎', color: 'bg-primary' },
                ...ghostMembers.map(m => ({ trip_id: tripData.id, name: m.name, user_id: null, is_host: false, avatar: m.avatar, color: m.color }))
            ];

            const { error: memberError } = await supabase.from('trip_members').insert(membersPayload);
            if (memberError) throw memberError;

            await fetchTrips();
            setActiveTripId(tripData.id);
            setAppView(AppView.TRIP_DETAIL);
        } catch (error: any) {
            alert('Create trip failed: ' + error.message);
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
        try {
            const { error } = await supabase.from('trip_members').update(updates).eq('id', memberId);
            if (error) throw error;
            await fetchTrips();
        } catch (e: any) {
            alert('Update member failed: ' + e.message);
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
        , toggleExpenseSettled, settleAllExpenses
    };

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTripContext = () => {
    const context = useContext(TripContext);
    if (!context) throw new Error('useTripContext must be used within TripProvider');
    return context;
};