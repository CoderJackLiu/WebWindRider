/**
 * 板块导航组件
 * 提供板块切换功能和板块信息展示
 */

import React from 'react';
import type { Sector } from '../../shared/types';

interface SectorNavigationProps {
  sectors: Sector[];
  activeSector: string | null;
  onSectorChange: (sectorId: string) => void;
  loading?: boolean;
}

const SectorNavigation: React.FC<SectorNavigationProps> = ({
  sectors,
  activeSector,
  onSectorChange,
  loading = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">板块导航</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {sectors.map((sector) => (
            <button
              key={sector.id}
              onClick={() => onSectorChange(sector.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                ${
                  activeSector === sector.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-center">
                <div className="font-semibold text-sm mb-1">{sector.name}</div>
                <div className="text-xs text-gray-500">
                  {sector.stockCount} 只股票
                </div>
              </div>
              
              {/* 活跃状态指示器 */}
              {activeSector === sector.id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* 板块统计信息 */}
      {!loading && sectors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>共 {sectors.length} 个板块</span>
            <span>
              总计 {sectors.reduce((sum, sector) => sum + sector.stockCount, 0)} 只股票
            </span>
          </div>
        </div>
      )}
      
      {/* 操作提示 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 bg-red-500 rounded mr-2"></div>
            <span>红色表示上涨</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 bg-green-500 rounded mr-2"></div>
            <span>绿色表示下跌</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 bg-gray-500 rounded mr-2"></div>
            <span>灰色表示平盘</span>
          </div>
          <div className="text-gray-500 mt-2">
            💡 矩形大小代表流通市值，双击股票块查看K线图
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorNavigation;