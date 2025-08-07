import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  responsive?: boolean;
}

/**
 * 追风量化Logo组件
 * 融合了风的动感元素和量化数据图表的现代设计
 */
const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true, 
  responsive = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* SVG Logo图标 */}
      <svg
        className={`${sizeClasses[size]} flex-shrink-0`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景圆形 */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="url(#logoGradient)"
          stroke="#ffffff"
          strokeWidth="2"
        />
        
        {/* 风的流线元素 */}
        <path
          d="M12 20 Q20 16 28 20 Q36 24 44 20 Q52 16 60 20"
          stroke="#ffffff"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M8 28 Q16 24 24 28 Q32 32 40 28 Q48 24 56 28"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M10 36 Q18 32 26 36 Q34 40 42 36 Q50 32 58 36"
          stroke="#ffffff"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
        
        {/* 量化数据柱状图元素 */}
        <rect x="16" y="44" width="3" height="8" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="21" y="40" width="3" height="12" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="26" y="42" width="3" height="10" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="31" y="38" width="3" height="14" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="36" y="41" width="3" height="11" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="41" y="43" width="3" height="9" fill="#ffffff" opacity="0.9" rx="1.5" />
        <rect x="46" y="39" width="3" height="13" fill="#ffffff" opacity="0.9" rx="1.5" />
        
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* 文字Logo */}
      {showText && (
        <div className={`flex flex-col ${
          responsive ? 'hidden sm:flex' : ''
        }`}>
          <span className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
            追风量化
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            WindRider Quant
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;