// src/components/views/ShareModal.tsx
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useTranslation, Trans } from 'react-i18next'; // ★ 引入 Hook 與 Trans

// 簡單的 Icon
const Icons = {
  Copy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

export const ShareModal = ({ trip, onClose }: { trip: any; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation(); // ★ 初始化翻譯
  
  // 產生連結 (假設網域是目前的 window.location)
  // 實戰中通常是 https://yourapp.com/join/{tripId}
  const shareUrl = `${window.location.origin}/join/${trip.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{t('share.title')}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><Icons.Close /></button>
        </div>

        <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-gray-500 text-sm">
                {t('share.desc_p1')}<br/>
                {/* ★ 使用 Trans 處理粗體變數 */}
                <Trans i18nKey="share.desc_p2" values={{ name: trip.name }}>
                    They can join <b>{trip.name}</b> without downloading the app!
                </Trans>
            </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-6 border border-gray-100">
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('share.link_label')}</p>
                <p className="text-sm font-bold text-gray-800 truncate select-all">{shareUrl}</p>
            </div>
        </div>

        <Button 
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`} 
            onClick={handleCopy}
        >
            {copied ? <><Icons.Check /> {t('share.copied')}</> : <><Icons.Copy /> {t('share.copy_button')}</>}
        </Button>
      </div>
    </div>
  );
};