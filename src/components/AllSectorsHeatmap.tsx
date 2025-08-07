/**
 * 所有板块热力图组件
 * 在同一页面显示所有板块的股票数据，每个板块为一个矩形区域
 */

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Stock, Sector } from '../../shared/types';
import { fetchXueqiuLink } from '../utils/api';

interface AllSectorsHeatmapProps {
  sectorsData: Record<string, { sector: Sector; stocks: Stock[] }>;
  width?: number;
  height?: number;
}

interface TreemapNode {
  id: string;
  name: string;
  value: number;
  changePercent: number;
  children?: TreemapNode[];
  sector?: string;
  stock?: Stock;
}

// 扩展D3 HierarchyNode类型以包含treemap布局属性
interface TreemapHierarchyNode extends d3.HierarchyNode<TreemapNode> {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

const AllSectorsHeatmap: React.FC<AllSectorsHeatmapProps> = ({
  sectorsData,
  width = 1200,
  height = 800
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /**
   * 获取颜色映射函数
   * @param changePercent 涨跌幅百分比
   * @returns 颜色值
   */
  const getColor = (changePercent: number): string => {
    if (Math.abs(changePercent) < 0.01) {
      return '#6b7280'; // 灰色 - 平盘
    }
    
    const absPercent = Math.abs(changePercent);
    const intensity = Math.min(absPercent / 4, 1); // 4%以上为最高强度
    
    if (changePercent > 0) {
      // 上涨 - 红色系
      const red = Math.floor(220 + intensity * 35); // 220-255
      const green = Math.floor(38 - intensity * 20); // 38-18
      const blue = Math.floor(38 - intensity * 20); // 38-18
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // 下跌 - 绿色系
      const red = Math.floor(34 - intensity * 15); // 34-19
      const green = Math.floor(197 + intensity * 58); // 197-255
      const blue = Math.floor(94 - intensity * 30); // 94-64
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

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
    }
  };

  /**
   * 显示提示框
   * @param event 鼠标事件
   * @param data 数据
   */
  const showTooltip = (event: MouseEvent, data: TreemapNode) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    let content = '';
    if (data.stock) {
      const stock = data.stock;
      content = `
        <div class="font-bold text-sm mb-1">${stock.name} (${stock.code})</div>
        <div class="text-xs space-y-1">
          <div>价格: ¥${stock.price.toFixed(2)}</div>
          <div>涨跌: ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)</div>
          <div>市值: ${(stock.marketCap / 100000000).toFixed(1)}亿</div>
          <div>成交量: ${(stock.volume / 10000).toFixed(1)}万</div>
          <div class="text-gray-500 mt-2">双击查看K线图</div>
        </div>
      `;
    } else {
      content = `
        <div class="font-bold text-sm mb-1">${data.name}</div>
        <div class="text-xs">
          <div>股票数量: ${data.children?.length || 0}</div>
        </div>
      `;
    }

    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY - 10}px`;
  };

  /**
   * 隐藏提示框
   */
  const hideTooltip = () => {
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  useEffect(() => {
    if (!svgRef.current || Object.keys(sectorsData).length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 准备数据
    const rootData: TreemapNode = {
      id: 'root',
      name: 'A股大盘',
      value: 0,
      changePercent: 0,
      children: Object.entries(sectorsData).map(([sectorId, { sector, stocks }]) => ({
        id: sectorId,
        name: sector.name,
        value: stocks.reduce((sum, stock) => sum + stock.marketCap, 0),
        changePercent: stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length,
        sector: sectorId,
        children: stocks.map(stock => ({
          id: `${sectorId}-${stock.code}`,
          name: stock.name,
          value: stock.marketCap,
          changePercent: stock.changePercent,
          sector: sectorId,
          stock
        }))
      }))
    };

    // 创建层次结构
    const root = d3.hierarchy(rootData)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0)) as TreemapHierarchyNode;

    // 创建treemap布局
    const treemap = d3.treemap<TreemapNode>()
      .size([width, height])
      .padding(2)
      .paddingInner(4)
      .paddingOuter(6)
      .round(true);

    treemap(root);

    // 创建主容器
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .style('background', '#f8fafc')
      .style('border-radius', '8px');

    // 绘制板块容器
    const sectorGroups = container
      .selectAll('.sector-group')
      .data((root.children || []) as TreemapHierarchyNode[])
      .enter()
      .append('g')
      .attr('class', 'sector-group');

    // 板块背景
    sectorGroups
      .append('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('fill', '#ffffff')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    // 板块标题
    sectorGroups
      .append('text')
      .attr('x', d => ((d.x0 || 0) + (d.x1 || 0)) / 2)
      .attr('y', d => (d.y0 || 0) + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text(d => d.data.name);

    // 绘制股票矩形
    sectorGroups.each(function(sectorNode: TreemapHierarchyNode) {
      const sectorGroup = d3.select(this);
      const stockNodes = (sectorNode.children || []) as TreemapHierarchyNode[];
      
      // 为每个板块创建子treemap
      const sectorWidth = (sectorNode.x1 || 0) - (sectorNode.x0 || 0);
      const sectorHeight = (sectorNode.y1 || 0) - (sectorNode.y0 || 0) - 30; // 减去标题高度
      
      if (sectorWidth <= 0 || sectorHeight <= 0) return;
      
      const sectorTreemap = d3.treemap<TreemapNode>()
        .size([sectorWidth - 8, sectorHeight]) // 减去padding
        .padding(1)
        .round(true);
      
      const sectorRoot = d3.hierarchy({ 
        id: sectorNode.data.id, 
        name: sectorNode.data.name, 
        value: 0, 
        changePercent: 0,
        children: stockNodes.map(n => n.data) 
      })
        .sum(d => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0)) as TreemapHierarchyNode;
      
      sectorTreemap(sectorRoot);
      
      // 绘制股票矩形
      sectorGroup
        .selectAll('.stock-rect')
        .data((sectorRoot.children || []) as TreemapHierarchyNode[])
        .enter()
        .append('rect')
        .attr('class', 'stock-rect')
        .attr('x', d => (sectorNode.x0 || 0) + 4 + (d.x0 || 0))
        .attr('y', d => (sectorNode.y0 || 0) + 30 + (d.y0 || 0))
        .attr('width', d => Math.max(0, (d.x1 || 0) - (d.x0 || 0)))
        .attr('height', d => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
        .attr('fill', d => getColor(d.data.changePercent))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.5)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke-width', 2).attr('stroke', '#1f2937');
          showTooltip(event, d.data);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#ffffff');
          hideTooltip();
        })
        .on('dblclick', (event, d) => {
          if (d.data.stock) {
            handleStockDoubleClick(d.data.stock);
          }
        });
      
      // 添加股票名称（仅在矩形足够大时显示）
      sectorGroup
        .selectAll('.stock-text')
        .data((sectorRoot.children || []) as TreemapHierarchyNode[])
        .enter()
        .append('text')
        .attr('class', 'stock-text')
        .attr('x', d => (sectorNode.x0 || 0) + 4 + ((d.x0 || 0) + (d.x1 || 0)) / 2)
        .attr('y', d => (sectorNode.y0 || 0) + 30 + ((d.y0 || 0) + (d.y1 || 0)) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', d => {
          const width = (d.x1 || 0) - (d.x0 || 0);
          const height = (d.y1 || 0) - (d.y0 || 0);
          return Math.min(width / 8, height / 3, 12) + 'px';
        })
        .attr('fill', '#ffffff')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => {
          const width = (d.x1 || 0) - (d.x0 || 0);
          const height = (d.y1 || 0) - (d.y0 || 0);
          if (width < 40 || height < 20) return '';
          const name = d.data.name;
          return name.length > 6 ? name.substring(0, 4) + '...' : name;
        })
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)');
    });

  }, [sectorsData, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
        style={{ display: 'none' }}
      ></div>
    </div>
  );
};

export default AllSectorsHeatmap;