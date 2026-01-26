import { GoogleGenAI } from "@google/genai";
import { GeminiParsedItem } from "../src/types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// 定義新的回傳結構
interface ParseResult {
  shopName: string;
  date: string; // YYYY-MM-DD
  items: GeminiParsedItem[];
}

export const processReceiptImage = async (base64Image: string): Promise<ParseResult> => {
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash-image"; 

  const prompt = `
    Analyze this Japanese receipt image.
    
    ### 1. LAYOUT ANALYSIS (CRITICAL)
    This receipt uses a specific format for each item block:
    - **Line 1:** Item Name (e.g., "Fried Rice (炒飯)")
    - **Line 2 (Optional):** Modifiers (e.g., "Extra Meat", "Large")
    - **Last Line of Block:** Contains specific columns: "Unit Price" | "Quantity (点)" | "Total Price"
      -> Example: "¥1,600   2点   ¥3,200"

    ### 2. EXTRACTION RULES
    - **Name:** Combine Line 1 and Line 2 (Modifiers) into one name. e.g. "Clam Ramen (Extra Meat)".
    - **Quantity:** Look for the number before the character "点". If not found, use 1.
    - **Price:** You MUST use the **RIGHTMOST** number (The Line Total). 
      -> **IGNORE** the leftmost number (Unit Price).
    
    ### 3. ANTI-DUPLICATION FILTER
    - **Do NOT** output the "Unit Price" as a separate item.
    - **Do NOT** output the same item twice (once for unit price, once for total).
    - Only output ONE entry per visual block on the receipt.

    ### 4. METADATA
    - **Shop Name**: Most prominent text at top.
    - **Date**: YYYY-MM-DD format. Default to TODAY.

    Return ONLY raw JSON:
    {
      "shopName": "String",
      "date": "YYYY-MM-DD",
      "items": [
        { "name": "Fried Rice", "quantity": 2, "price": 3200 } 
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt },
          ],
        },
      ],
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 嘗試抓取 JSON 區塊
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const result = JSON.parse(text);

    // 處理日期：如果 AI 回傳 TODAY 或解不出來，就給當日
    if (result.date === 'TODAY' || !result.date) {
        result.date = new Date().toISOString().split('T')[0];
    }

    return result as ParseResult;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 解析失敗，請手動輸入。");
  }
};