import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 設定 CORS (允許瀏覽器呼叫)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. 處理 Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. 驗證用戶身分 (Auth Check)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: 請先登入')
    }

    // 3. 檢查每日額度 (Rate Limiting)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    
    // 查詢今日用量
    const { data: usageData } = await supabaseAdmin
      .from('user_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single()

    const currentCount = usageData?.count || 0
    const DAILY_LIMIT = 5

    if (currentCount >= DAILY_LIMIT) {
      throw new Error(`今日額度已滿 (${currentCount}/${DAILY_LIMIT})，請明天再來！`)
    }

    // 4. 解析請求內容
    const { base64Image, language } = await req.json()
    if (!base64Image) throw new Error('No image provided')

    // 5. 準備完整的 Prompt (從你的 openrouterService.ts 移植過來)
    const isChinese = language && language.startsWith('zh')
    const targetLanguage = isChinese ? "Traditional Chinese (Hong Kong usage)" : "English"

    const languageInstruction = isChinese 
    ? `
      ### CORE INSTRUCTION (MUST FOLLOW)
      Your output MUST be in **Traditional Chinese (Hong Kong usage / 繁體中文)**.
      Even if the receipt is in Japanese or English, you **MUST translate** the item names into Chinese.
      `
    : `
      ### CORE INSTRUCTION (MUST FOLLOW)
      Your output MUST be in **English**.
      - If the receipt is in Japanese, Chinese, or other languages, you **MUST translate** the item names into English.
      - If the receipt is already in English, **KEEP IT AS IS** (do not change or translate it).
      `;

    // ★★★ 這是完整的 Prompt ★★★
    const prompt = `
    You are an AI assistant helping a user digitize their receipts.
    
    ${languageInstruction}
    
    ---

    ### 1. EXTRACTION & TRANSLATION RULES
    Analyze the image and extract line items. For each item:
    
    1.  **Extract**: Read the text.
    2.  **Translate**: Convert it to **${targetLanguage}**.
    3.  **Assign**: Put the *processed* text into the "name" field.
    
    ### 2. PRICE PARSING LOGIC (CRITICAL FOR JAPANESE RECEIPTS)
    Japanese receipts often list multiple prices for one item. You must follow these priorities:
    
    * **RULE 1 (Target)**: Always extract the **Original / Standard Price** (usually the top line or the higher number).
    * **RULE 2 (Ignore)**: **COMPLETELY IGNORE** any lines or numbers labeled with:
        * "免税後販売額" (Tax-free sales amount)
        * "税抜" (Tax excluded)
        * "内税" (Tax included amount shown separately)
        * "割引" (Discount amount shown separately)
    
    * **Example Case (Pokemon Center)**:
        * Line 1: "Item A ... ¥3,300"  <-- **EXTRACT THIS (3300)**
        * Line 2: "免税後販売額 ... ¥2,999" <-- **IGNORE THIS**
    
    * **Logic**: We want the **Gross Price**. The user will calculate the discount manually later.

    ### 3. LAYOUT PARSING
    - **Quantity**: Look for numbers before "点", "x", or counts (e.g., @1,650 x 2). If found, calculate Total = Unit Price * Qty.
    - **Merge**: If an item name spans multiple lines, combine them.

    ### 4. METADATA & CATEGORIZATION
    - **Shop Name**: Extract the most prominent text.
    - **Date**: Extract YYYY-MM-DD.
    - **Icon**: Analyze the receipt content and pick ONE single emoji that best represents the expense category.
       - Food/Drink: 🍔, 🍜, ☕, 🍺, 🍱, 🍞
       - Transport: 🚕, 🚇, ✈️, ⛽, 🚂
       - Shopping: 🛍️, 👕, 👟, 💍, 🕶️
       - Entertainment: 🎬, 🎟️, 🎤, 🎡
       - Accommodation: 🏨, 🏠
       - Supermarket/Groceries: 🛒, 🍎, 🧻
       - Others: 💸 (Use this if unsure)

    ### 5. OUTPUT FORMAT
    Return ONLY raw JSON. No markdown.
    
    Example Output:
    {
      "shopName": "Restaurant Name",
      "date": "2026-01-21",
      "icon": "🍜",
      "items": [
        { "name": "Item A", "quantity": 1, "price": 1880 },
        { "name": "Item B", "quantity": 1, "price": 1630 }
      ]
    }
  `;

    // 6. 呼叫 OpenRouter
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) throw new Error('Server Config Error: Missing API Key')
      
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sws-app.com", 
        "X-Title": "SWS App",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // 或其他你想用的模型
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" }, 
      })
    })

    const aiData = await response.json()
    
    if (aiData.error) {
       console.error("AI Error:", aiData.error)
       throw new Error(`AI Service Error: ${aiData.error.message || 'Unknown'}`)
    }

    const content = aiData.choices[0].message.content
    // 清理 Markdown
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedResult = JSON.parse(cleanJson)

    // 7. 成功後，更新使用次數
    await supabaseAdmin
      .from('user_usage')
      .upsert({ 
        user_id: user.id, 
        usage_date: today, 
        count: currentCount + 1 
      }, { onConflict: 'user_id, usage_date' })

    // 8. 回傳結果
    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})