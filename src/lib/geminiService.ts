import { GoogleGenAI } from "@google/genai";
import { GeminiParsedItem } from "../types";

export const processReceiptImage = async (base64Image: string): Promise<GeminiParsedItem[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Using gemini-2.5-flash-image for image understanding
  // Note: responseSchema/responseMimeType is not supported for nano banana series models like gemini-2.5-flash-image
  // So we rely on a strong text prompt to get JSON.
  const prompt = `
    Analyze this receipt image. Extract all individual line items.
    For each item, identify the name, quantity (default to 1 if not specified), and total price for that line.
    Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json.
    
    Format:
    [
      { "name": "Item Name", "quantity": 1, "price": 10.50 },
      ...
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for camera captures usually
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let text = response.text || "";
    // Clean up if the model accidentally adds markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const items: GeminiParsedItem[] = JSON.parse(text);
    return items;

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse receipt. Please try again manually.");
  }
};
