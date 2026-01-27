import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.8,          // 限制最大檔案大小為 0.8MB
    maxWidthOrHeight: 1920,  // 限制最大寬度或高度為 1920px
    useWebWorker: true,      // 開啟多執行緒加速
    initialQuality: 0.7,     // 初始壓縮品質 (0~1)
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Debug 用：印出壓縮前後的大小差異
    console.log(`Original size: ${file.size / 1024 / 1024} MB`);
    console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error("Compression failed:", error);
    return file; // 如果壓縮失敗，就回傳原檔，避免程式當掉
  }
};