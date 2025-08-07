/**
 * 主页面组件
 * 整合股票热力图、板块导航和数据更新功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import AllSectorsHeatmap from '../components/AllSectorsHeatmap';
import Logo from '../components/Logo';
import { fetchAllSectorsData, healthCheck } from '../utils/api';
import type { Sector, Stock } from '../../shared/types';

const HomePage: React.FC = () => {
  const [sectorsData, setSectorsData] = useState<Record<string, { sector: Sector; stocks: Stock[] }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  /**
   * 检查服务器连接状态
   */
  const checkServerStatus = useCallback(async () => {
    try {
      const status = await healthCheck();
      setIsOnline(status);
      return status;
    } catch (error) {
      setIsOnline(false);
      return false;
    }
  }, []);

  /**
   * 加载所有板块数据
   */
  const loadAllSectorsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allData = await fetchAllSectorsData();
      setSectorsData(allData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('加载所有板块数据失败:', error);
      setError('加载股票数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 手动刷新数据
   */
  const handleRefresh = useCallback(async () => {
    await checkServerStatus();
    await loadAllSectorsData();
  }, [loadAllSectorsData, checkServerStatus]);

  /**
   * 切换自动刷新
   */
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // 窗口大小变化监听
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化加载
  useEffect(() => {
    const initializeApp = async () => {
      await checkServerStatus();
      await loadAllSectorsData();
    };
    
    initializeApp();
  }, [checkServerStatus, loadAllSectorsData]);

  // 自动刷新定时器
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('自动刷新股票数据...');
      loadAllSectorsData();
    }, 60000); // 60秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, loadAllSectorsData]);

  // 计算统计信息
  const totalSectors = Object.keys(sectorsData).length;
  const totalStocks = Object.values(sectorsData).reduce((sum, { stocks }) => sum + stocks.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Logo size="md" className="mr-2 sm:mr-4" responsive={true} />
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  A股大盘板块走势
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  实时股票热力图分析平台
                </p>
              </div>
              <div className="ml-4 sm:ml-6 flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm ${
                  isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isOnline ? '已连接' : '连接断开'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 最后更新时间 */}
              {lastUpdate && (
                <div className="text-xs sm:text-sm text-gray-600 hidden md:block">
                  最后更新: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              
              {/* 自动刷新开关 */}
              <button
                onClick={toggleAutoRefresh}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="hidden sm:inline">
                  {autoRefresh ? '自动刷新开' : '自动刷新关'}
                </span>
                <span className="sm:hidden">
                  {autoRefresh ? '自动' : '手动'}
                </span>
              </button>
              
              {/* 手动刷新按钮 */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-1 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${
                  loading ? 'animate-spin' : ''
                }`} />
                <span className="hidden sm:inline">刷新</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="w-full max-w-full px-2 sm:px-4 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* 统计信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalSectors}</div>
              <div className="text-sm text-gray-600">板块数量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalStocks}</div>
              <div className="text-sm text-gray-600">股票总数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(sectorsData).filter(({ stocks }) => 
                  stocks.some(stock => stock.changePercent > 0)
                ).length}
              </div>
              <div className="text-sm text-gray-600">上涨板块</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(sectorsData).filter(({ stocks }) => 
                  stocks.some(stock => stock.changePercent < 0)
                ).length}
              </div>
              <div className="text-sm text-gray-600">下跌板块</div>
            </div>
          </div>
        </div>

        {/* 颜色说明 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">颜色说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>红色表示上涨，颜色越深涨幅越大</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>绿色表示下跌，颜色越深跌幅越大</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>灰色表示平盘</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            💡 矩形大小代表流通市值，双击股票块查看雪球K线图
          </div>
        </div>

        {/* 所有板块热力图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              A股大盘板块热力图
            </h2>
            <div className="text-xs sm:text-sm text-gray-600">
              共 {totalSectors} 个板块，{totalStocks} 只股票
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">加载股票数据中...</span>
            </div>
          ) : Object.keys(sectorsData).length > 0 ? (
            <div className="w-full rounded-lg" style={{ overflow: 'hidden' }}>
              <AllSectorsHeatmap
                sectorsData={sectorsData}
                width={windowSize.width <= 768 ? Math.max(320, windowSize.width - 48) : Math.max(800, windowSize.width - 160)}
                height={windowSize.width <= 768 ? Math.max(400, Math.min(windowSize.height - 300, 500)) : Math.max(600, windowSize.height - 420)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              暂无股票数据
            </div>
          )}
        </div>

        {/* 页脚信息 */}
        <footer className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          <p className="hidden sm:block">数据每60秒自动更新 | 双击股票块查看雪球K线图</p>
          <p className="sm:hidden">数据每60秒自动更新</p>
          <p className="mt-1">矩形大小代表流通市值，颜色深浅代表涨跌幅度</p>
          <p className="mt-1 sm:hidden text-xs">长按股票块查看详情 | 双击查看K线图</p>
        </footer>
      </main>
    </div>
  );
};

export default HomePage;