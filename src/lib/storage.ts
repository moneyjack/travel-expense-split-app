// src/lib/storage.ts
import { supabase } from './supabase';

/**
 * 上傳收據圖片到 Supabase Storage
 * @param file 圖片檔案 (File object)
 * @returns 圖片的公開 URL
 */
export const uploadReceiptImage = async (file: File): Promise<string | null> => {
  try {
    // 1. 產生唯一的檔名 (避免檔名重複)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. 上傳
    const { error: uploadError } = await supabase.storage
      .from('receipts') // 你的 bucket 名稱
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // 3. 獲取公開連結
    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    console.error('Error uploading image:', error);
    alert('圖片上傳失敗，請重試');
    return null;
  }
};