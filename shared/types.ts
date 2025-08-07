/**
 * 共享类型定义
 * 定义前后端共用的数据结构
 */

// 板块接口
export interface Sector {
  id: string;
  name: string;
  stockCount: number;
}

// 股票接口
export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
}

// 矩形树图节点接口
export interface TreemapNode {
  id: string;
  name: string;
  value: number; // 流通市值
  changePercent: number; // 涨跌幅
  children?: TreemapNode[]; // 板块包含的股票
}

// 板块矩形树图接口
export interface SectorTreemap {
  id: string;
  name: string;
  value: number; // 板块总市值
  children: StockTreemap[];
}

// 股票矩形树图接口
export interface StockTreemap {
  code: string;
  name: string;
  value: number; // 流通市值
  changePercent: number;
  price: number;
  x0?: number; // D3布局计算后的位置
  y0?: number;
  x1?: number;
  y1?: number;
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 板块列表响应
export interface SectorsResponse {
  success: boolean;
  sectors: Sector[];
}

// 股票列表响应
export interface StocksResponse {
  success: boolean;
  stocks: Stock[];
}

// 雪球链接响应
export interface XueqiuLinkResponse {
  success: boolean;
  url: string;
}

// 颜色映射类型
export type ColorScale = {
  domain: number[];
  range: string[];
};

// 矩形树图配置
export interface TreemapConfig {
  width: number;
  height: number;
  paddingOuter: number;
  paddingInner: number;
}