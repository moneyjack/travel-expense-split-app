import { supabase } from '../supabase'; // 確保引入你的 supabase client
import { GeminiParsedItem } from "../src/types";

// 移除 apiKey 和 baseURL，這裡不需要了

interface ParseResult {
  shopName: string;
  date: string;
  items: GeminiParsedItem[];
  icon: string;
}

export const processReceiptImage = async (base64Image: string, language: string = 'zh'): Promise<ParseResult> => {
  
  // 呼叫 Edge Function
  // 'scan-receipt' 是我們剛剛 deploy 的 function 名稱
  const { data, error } = await supabase.functions.invoke('scan-receipt', {
    body: {
      base64Image,
      language
    }
  });

  if (error) {
    console.error("Edge Function Error:", error);
    // 這裡會抓到我們在 Function 裡丟出的 "今日額度已滿" 錯誤
    throw new Error(error.message || "掃描失敗，請稍後再試。");
  }

  // 因為 Function 已經幫我們解析好 JSON 了，直接回傳 data 即可
  // 但要做個簡單的日期防呆
  if (data.date === 'TODAY' || !data.date) {
      data.date = new Date().toISOString().split('T')[0];
  }
  if (!data.icon) data.icon = '💸';

  return data as ParseResult;
};