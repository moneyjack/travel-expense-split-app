import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
};

// 專門給 Trip List 用的骨架 (包含頭像、文字的佈局)
export const TripRowSkeleton = () => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 mb-3">
      {/* 圖示骨架 */}
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      
      {/* 文字骨架 */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" /> {/* 標題 */}
        <Skeleton className="h-3 w-1/2" /> {/* 副標題 */}
      </div>
      
      {/* 右箭頭骨架 */}
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
  );
};