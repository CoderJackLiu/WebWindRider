/**
 * 股票热力图组件
 * 使用D3.js实现矩形树图布局，展示股票数据
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Stock, StockTreemap } from '../../shared/types';
import { 
  calculateTreemapLayout, 
  transformStocksToTreemap, 
  getColorByChangePercent, 
  formatValue 
} from '../utils/treemap';
import { fetchXueqiuLink } from '../utils/api';

interface StockHeatmapProps {
  stocks: Stock[];
  sectorName: string;
  width?: number;
  height?: number;
  onStockClick?: (stock: Stock) => void;
}

interface TooltipData {
  stock: Stock;
  x: number;
  y: number;
  visible: boolean;
}

const StockHeatmap: React.FC<StockHeatmapProps> = ({
  stocks,
  sectorName,
  width = 800,
  height = 600,
  onStockClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    stock: {} as Stock,
    x: 0,
    y: 0,
    visible: false
  });

  /**
   * 处理股票块双击事件
   * @param stock 股票数据
   */
  const handleStockDoubleClick = async (stock: Stock) => {
    try {
      const url = await fetchXueqiuLink(stock.code);
      window.open(url, '_blank');
    } catch (error) {
      console.error('打开雪球链接失败:', error);
      // 备用方案：直接构造雪球链接
      const market = stock.code.startsWith('6') ? 'SH' : 'SZ';
      const fallbackUrl = `https://xueqiu.com/S/${market}${stock.code}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  /**
   * 处理鼠标悬停事件
   * @param event 鼠标事件
   * @param stock 股票数据
   */
  const handleMouseEnter = (event: React.MouseEvent, stock: Stock) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        stock,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        visible: true
      });
    }
  };

  /**
   * 处理鼠标离开事件
   */
  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  /**
   * 渲染矩形树图
   */
  useEffect(() => {
    if (!stocks.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // 清除之前的内容

    // 配置参数
    const config = {
      width,
      height,
      paddingOuter: 2,
      paddingInner: 1
    };

    // 转换数据并计算布局
    const treemapData = transformStocksToTreemap(stocks, sectorName);
    const root = calculateTreemapLayout(treemapData, config);

    // 创建股票矩形
    const stockGroups = svg
      .selectAll('g.stock')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'stock')
      .style('cursor', 'pointer');

    // 添加矩形
    stockGroups
      .append('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('width', d => Math.max(0, (d.x1 || 0) - (d.x0 || 0)))
      .attr('height', d => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr('fill', d => {
        const stockData = d.data as StockTreemap;
        return getColorByChangePercent(stockData.changePercent);
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#333333');
        
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const stockData = d.data as StockTreemap;
          setTooltip({
            stock: {
              code: stockData.code,
              name: stockData.name,
              price: stockData.price,
              change: stockData.price * stockData.changePercent / 100,
              changePercent: stockData.changePercent,
              marketCap: stockData.value,
              volume: 0
            },
            x: event.pageX - rect.left,
            y: event.pageY - rect.top,
            visible: true
          });
        }
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke-width', 0.5)
          .attr('stroke', '#ffffff');
        
        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('dblclick', (event, d) => {
        const stockData = d.data as StockTreemap;
        const stock: Stock = {
          code: stockData.code,
          name: stockData.name,
          price: stockData.price,
          change: stockData.price * stockData.changePercent / 100,
          changePercent: stockData.changePercent,
          marketCap: stockData.value,
          volume: 0
        };
        handleStockDoubleClick(stock);
      });

    // 添加股票名称文本
    stockGroups
      .append('text')
      .attr('x', d => ((d.x0 || 0) + (d.x1 || 0)) / 2)
      .attr('y', d => ((d.y0 || 0) + (d.y1 || 0)) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', d => {
        const width = (d.x1 || 0) - (d.x0 || 0);
        const height = (d.y1 || 0) - (d.y0 || 0);
        const area = width * height;
        if (area < 1000) return '8px';
        if (area < 5000) return '10px';
        if (area < 10000) return '12px';
        return '14px';
      })
      .style('fill', '#333333')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => {
        const width = (d.x1 || 0) - (d.x0 || 0);
        const height = (d.y1 || 0) - (d.y0 || 0);
        if (width < 60 || height < 30) return '';
        const stockData = d.data as StockTreemap;
        return stockData.name.length > 6 ? stockData.name.substring(0, 6) + '...' : stockData.name;
      });

    // 添加涨跌幅文本
    stockGroups
      .append('text')
      .attr('x', d => ((d.x0 || 0) + (d.x1 || 0)) / 2)
      .attr('y', d => ((d.y0 || 0) + (d.y1 || 0)) / 2 + 16)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '10px')
      .style('fill', d => {
        const stockData = d.data as StockTreemap;
        return stockData.changePercent >= 0 ? '#dc2626' : '#16a34a';
      })
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => {
        const width = (d.x1 || 0) - (d.x0 || 0);
        const height = (d.y1 || 0) - (d.y0 || 0);
        if (width < 60 || height < 50) return '';
        const stockData = d.data as StockTreemap;
        const sign = stockData.changePercent >= 0 ? '+' : '';
        return `${sign}${stockData.changePercent.toFixed(2)}%`;
      });

  }, [stocks, sectorName, width, height]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg shadow-sm"
      />
      
      {/* 悬停提示框 */}
      {tooltip.visible && (
        <div
          className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-sm font-bold text-gray-800">{tooltip.stock.name}</div>
          <div className="text-xs text-gray-600">代码: {tooltip.stock.code}</div>
          <div className="text-xs text-gray-600">
            价格: {formatValue(tooltip.stock.price, 'currency')}
          </div>
          <div className="text-xs text-gray-600">
            涨跌幅: 
            <span className={tooltip.stock.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}>
              {formatValue(tooltip.stock.changePercent, 'percent')}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            市值: {formatValue(tooltip.stock.marketCap, 'marketCap')}
          </div>
          <div className="text-xs text-gray-500 mt-1">双击查看K线图</div>
        </div>
      )}
    </div>
  );
};

export default StockHeatmap;