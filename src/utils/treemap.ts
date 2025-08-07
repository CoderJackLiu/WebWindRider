/**
 * D3.js 矩形树图布局工具函数
 * 实现股票热力图的矩形布局算法
 */

import * as d3 from 'd3';
import type { Stock, SectorTreemap, StockTreemap, TreemapConfig } from '../../shared/types';

/**
 * 创建矩形树图布局
 * @param config 布局配置
 * @returns D3 treemap 布局函数
 */
export function createTreemapLayout(config: TreemapConfig) {
  return d3.treemap<StockTreemap>()
    .size([config.width, config.height])
    .paddingOuter(config.paddingOuter)
    .paddingInner(config.paddingInner)
    .round(true);
}

/**
 * 将股票数据转换为矩形树图数据结构
 * @param stocks 股票数组
 * @param sectorName 板块名称
 * @returns 矩形树图数据
 */
export function transformStocksToTreemap(stocks: Stock[], sectorName: string): SectorTreemap {
  const children: StockTreemap[] = stocks.map(stock => ({
    code: stock.code,
    name: stock.name,
    value: stock.marketCap,
    changePercent: stock.changePercent,
    price: stock.price
  }));

  const totalValue = children.reduce((sum, child) => sum + child.value, 0);

  return {
    id: sectorName,
    name: sectorName,
    value: totalValue,
    children
  };
}

/**
 * 计算矩形树图布局
 * @param data 矩形树图数据
 * @param config 布局配置
 * @returns 计算后的层次结构数据
 */
export function calculateTreemapLayout(
  data: SectorTreemap,
  config: TreemapConfig
): d3.HierarchyRectangularNode<SectorTreemap | StockTreemap> {
  const treemap = d3.treemap<SectorTreemap | StockTreemap>()
    .size([config.width, config.height])
    .paddingOuter(config.paddingOuter)
    .paddingInner(config.paddingInner)
    .round(true);
  
  // 创建层次结构
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // 计算布局
  return treemap(root);
}

/**
 * 根据涨跌幅获取颜色
 * @param changePercent 涨跌幅百分比
 * @returns 颜色值
 */
export function getColorByChangePercent(changePercent: number): string {
  // 涨幅为红色，跌幅为绿色，不涨不跌为灰色
  // 按1%幅度分阶，涨跌幅大于4%时颜色饱和度更高
  
  if (Math.abs(changePercent) < 0.01) {
    return '#6B7280'; // 灰色
  }
  
  if (changePercent > 0) {
    // 红色系 - 涨幅
    if (changePercent >= 4) {
      return '#DC2626'; // 深红色，高饱和度
    } else if (changePercent >= 3) {
      return '#EF4444'; // 红色
    } else if (changePercent >= 2) {
      return '#F87171'; // 浅红色
    } else if (changePercent >= 1) {
      return '#FCA5A5'; // 很浅红色
    } else {
      return '#FEE2E2'; // 极浅红色
    }
  } else {
    // 绿色系 - 跌幅
    const absChange = Math.abs(changePercent);
    if (absChange >= 4) {
      return '#059669'; // 深绿色，高饱和度
    } else if (absChange >= 3) {
      return '#10B981'; // 绿色
    } else if (absChange >= 2) {
      return '#34D399'; // 浅绿色
    } else if (absChange >= 1) {
      return '#6EE7B7'; // 很浅绿色
    } else {
      return '#D1FAE5'; // 极浅绿色
    }
  }
}

/**
 * 创建颜色比例尺
 * @returns D3 颜色比例尺
 */
export function createColorScale() {
  return d3.scaleSequential()
    .domain([-5, 5])
    .interpolator(d3.interpolateRdYlGn)
    .clamp(true);
}

/**
 * 格式化数值显示
 * @param value 数值
 * @param type 格式化类型
 * @returns 格式化后的字符串
 */
export function formatValue(value: number, type: 'currency' | 'percent' | 'marketCap'): string {
  switch (type) {
    case 'currency':
      return `¥${value.toFixed(2)}`;
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    case 'marketCap':
      if (value >= 100000000000) {
        return `${(value / 100000000000).toFixed(1)}万亿`;
      } else if (value >= 100000000) {
        return `${(value / 100000000).toFixed(1)}亿`;
      } else if (value >= 10000) {
        return `${(value / 10000).toFixed(1)}万`;
      } else {
        return value.toString();
      }
    default:
      return value.toString();
  }
}