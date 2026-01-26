import OpenAI from "openai";
import { GeminiParsedItem } from "../types";

// ★ 這裡請填入你的 OpenRouter API Key
// 建議在 .env 檔案中設定 VITE_OPENROUTER_API_KEY
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

// ★ OpenRouter 的標準 API 地址
const baseURL = "https://openrouter.ai/api/v1";

// 定義回傳結構
interface ParseResult {
  shopName: string;
  date: string; // YYYY-MM-DD
  items: GeminiParsedItem[];
}

export const processReceiptImage = async (base64Image: string): Promise<ParseResult> => {
  if (!apiKey) throw new Error("API Key not found. Please check your .env file.");

  // 初始化 OpenAI Client (但連線到 OpenRouter)
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    dangerouslyAllowBrowser: true, // 前端直接呼叫需開啟此選項
    defaultHeaders: {
      "HTTP-Referer": window.location.origin, // OpenRouter 建議填寫
      "X-Title": "Split Bill App", // OpenRouter 建議填寫
    },
  });

  // ★ 這里指定使用 Google 的 Gemini 模型
  // 你可以換成 "google/gemini-pro-1.5" 或 "google/gemini-flash-1.5"
  const modelId = "google/gemini-2.5-flash-lite"; 

 const prompt = `
    Analyze this receipt image (which could be in English, Japanese, or other languages).
    
    ### 1. LAYOUT ANALYSIS (CRITICAL)
    This receipt uses a specific format for each item block:
    - **Line 1:** Item Name (e.g., "Fried Rice", "チャーハン")
    - **Line 2 (Optional):** Modifiers (e.g., "Extra Meat", "大盛")
    - **Last Line of Block:** Contains specific columns: "Unit Price" | "Quantity" | "Total Price"

    ### 2. EXTRACTION RULES
    - **Name:** Combine Line 1 and Line 2 (Modifiers) into one name.
    - **Quantity:** Look for the number before characters like "点", "x", or just a number indicating count. If not found, use 1.
    - **Price:** You MUST use the **RIGHTMOST** number (The Line Total). 
      -> **IGNORE** the leftmost number (Unit Price).
    
    ### 3. ANTI-DUPLICATION FILTER
    - **Do NOT** output the "Unit Price" as a separate item.
    - Only output ONE entry per visual block on the receipt.

    ### 4. METADATA
    - **Shop Name**: Most prominent text at top.
    - **Date**: YYYY-MM-DD format. Default to TODAY.

    ### 5. TRANSLATION RULES (IMPORTANT)
    - **Translate the 'name' of every item into Traditional Chinese (Hong Kong usage / 繁體中文).**
    - If the item is already in Chinese, keep it.
    - Examples:
      - "Fried Rice" -> "炒飯"
      - "Ramen" -> "拉麵"
      - "Beer" -> "啤酒"
      - "Pizza" -> "薄餅"
      - "Service Charge" -> "服務費"

    Return ONLY raw JSON:
    {
      "shopName": "String",
      "date": "YYYY-MM-DD",
      "items": [
        { "name": "炒飯", "quantity": 2, "price": 3200 } 
      ]
    }
  `;
  try {
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                // OpenAI 格式需要完整的 Data URL
                url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      // OpenRouter 支援 response_format 為 json_object (視模型而定，Gemini 2.0 通常支援)
      response_format: { type: "json_object" }, 
    });

    const content = response.choices[0].message.content || "{}";
    
    // 清理可能存在的 Markdown 標記 (有些模型還是會頑皮地加上 ```json)
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(cleanJson);

    // 日期防呆
    if (result.date === 'TODAY' || !result.date) {
        result.date = new Date().toISOString().split('T')[0];
    }

    return result as ParseResult;

  } catch (error: any) {
    console.error("OpenRouter API Error:", error);
    throw new Error("AI 解析失敗，請確認 OpenRouter Key 是否正確。");
  }
};