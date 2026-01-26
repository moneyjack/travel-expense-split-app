import OpenAI from "openai";
import { GeminiParsedItem } from "../src/types";

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
    You are an AI assistant helping a user in **Hong Kong** digitize their receipts.
    
    ### CORE INSTRUCTION (MUST FOLLOW)
    Your output MUST be in **Traditional Chinese (Hong Kong usage / 繁體中文)**.
    Even if the receipt is in Japanese or English, you **MUST translate** the item names into Chinese.
    
    ---

    ### 1. EXTRACTION & TRANSLATION RULES
    Analyze the image and extract line items. For each item:
    
    1.  **Extract**: Read the text (e.g., "すき焼きうどん").
    2.  **Translate**: Convert it to Hong Kong Chinese (e.g., "壽喜燒烏冬").
        * "鶏クリームうどん" -> "雞肉忌廉烏冬"
        * "Fried Rice" -> "炒飯"
        * "Beer" -> "啤酒"
    3.  **Assign**: Put the *translated* text into the "name" field.
    
    **DO NOT return Japanese or English text in the "name" field unless it is a specific brand name without a translation.**

    ### 2. LAYOUT PARSING
    - **Quantity**: Look for numbers before "点", "x", or counts. Default to 1.
    - **Price**: Use the **Total Price** for that line (usually the rightmost number). Ignore unit prices.
    - **Merge**: If an item takes two lines (Name + Modifier), combine them into one string.

    ### 3. METADATA
    - **Shop Name**: Extract the most prominent text at the top.
    - **Date**: Extract YYYY-MM-DD. If missing, use TODAY.

    ### 4. OUTPUT FORMAT
    Return ONLY raw JSON. No markdown.
    
    Example Output:
    {
      "shopName": "Tsuru Ton Tan",
      "date": "2026-01-21",
      "items": [
        { "name": "壽喜燒烏冬", "quantity": 1, "price": 1880 },
        { "name": "雞肉忌廉烏冬", "quantity": 1, "price": 1630 }
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