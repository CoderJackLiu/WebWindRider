/**
 * API服务工具函数
 * 封装前端调用后端接口的方法
 */

import axios from 'axios';
import type { Sector, Stock, SectorsResponse, StocksResponse, XueqiuLinkResponse } from '../../shared/types';

// API基础URL配置
// 开发环境使用Vite代理，生产环境使用相对路径
const API_BASE_URL = import.meta.env.PROD ? '' : '';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API响应: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API响应错误:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * 获取所有板块列表
 * @returns 板块列表
 */
export async function fetchSectors(): Promise<Sector[]> {
  try {
    const response = await apiClient.get<SectorsResponse>('/api/stocks/sectors');
    if (response.data.success) {
      return response.data.sectors;
    } else {
      throw new Error('获取板块数据失败');
    }
  } catch (error) {
    console.error('获取板块列表失败:', error);
    throw error;
  }
}

/**
 * 获取指定板块的股票数据
 * @param sectorId 板块ID
 * @returns 股票列表
 */
export async function fetchStocksBySector(sectorId: string): Promise<Stock[]> {
  try {
    const response = await apiClient.get<StocksResponse>(`/api/stocks/sector/${sectorId}`);
    if (response.data.success) {
      return response.data.stocks;
    } else {
      throw new Error('获取股票数据失败');
    }
  } catch (error) {
    console.error(`获取板块${sectorId}股票数据失败:`, error);
    throw error;
  }
}

/**
 * 获取雪球股票链接
 * @param stockCode 股票代码
 * @returns 雪球链接URL
 */
export async function fetchXueqiuLink(stockCode: string): Promise<string> {
  try {
    const response = await apiClient.get<XueqiuLinkResponse>(`/api/stocks/xueqiu-link/${stockCode}`);
    if (response.data.success) {
      return response.data.url;
    } else {
      throw new Error('获取雪球链接失败');
    }
  } catch (error) {
    console.error(`获取股票${stockCode}雪球链接失败:`, error);
    throw error;
  }
}

/**
 * 获取所有板块的股票数据
 * @returns 所有板块数据
 */
export async function fetchAllSectorsData(): Promise<Record<string, { sector: Sector; stocks: Stock[] }>> {
  try {
    const response = await apiClient.get('/api/stocks/all-sectors');
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('获取所有板块数据失败');
    }
  } catch (error) {
    console.error('获取所有板块数据失败:', error);
    throw error;
  }
}

/**
 * 批量获取多个板块的股票数据
 * @param sectorIds 板块ID数组
 * @returns 板块股票数据映射
 */
export async function fetchMultipleSectorsStocks(sectorIds: string[]): Promise<Record<string, Stock[]>> {
  try {
    const promises = sectorIds.map(async (sectorId) => {
      const stocks = await fetchStocksBySector(sectorId);
      return { sectorId, stocks };
    });
    
    const results = await Promise.all(promises);
    
    const stocksMap: Record<string, Stock[]> = {};
    results.forEach(({ sectorId, stocks }) => {
      stocksMap[sectorId] = stocks;
    });
    
    return stocksMap;
  } catch (error) {
    console.error('批量获取板块股票数据失败:', error);
    throw error;
  }
}

/**
 * 健康检查
 * @returns 服务器状态
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await apiClient.get('/api/health');
    return response.data.success === true;
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
}