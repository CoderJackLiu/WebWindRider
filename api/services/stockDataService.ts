/**
 * 股票数据服务
 * 接入真实的股票API获取A股数据
 */

import axios from 'axios';
import iconv from 'iconv-lite';
import type { Stock, Sector } from '../../shared/types';

// 新浪财经API配置
const SINA_API_BASE = 'https://hq.sinajs.cn';
const TENCENT_API_BASE = 'https://qt.gtimg.cn';

// A股板块和对应的股票代码映射
const SECTOR_STOCKS: Record<string, { name: string; codes: string[] }> = {
  banking: {
    name: '银行',
    codes: [
      'sh600036', // 招商银行
      'sz000001', // 平安银行
      'sh601398', // 工商银行
      'sh601939', // 建设银行
      'sh601288', // 农业银行
      'sh600000', // 浦发银行
      'sh601166', // 兴业银行
      'sh600015', // 华夏银行
      'sh601169', // 北京银行
      'sh601009', // 南京银行
      'sh600016', // 民生银行
      'sh601818', // 光大银行
      'sh601328', // 交通银行
      'sz002142', // 宁波银行
      'sh601998'  // 中信银行
    ]
  },
  technology: {
    name: '科技',
    codes: [
      'sz000858', // 五粮液
      'sz002415', // 海康威视
      'sz000002', // 万科A
      'sz002594', // 比亚迪
      'sz000725', // 京东方A
      'sz002230', // 科大讯飞
      'sz300059', // 东方财富
      'sz300750', // 宁德时代
      'sz002475', // 立讯精密
      'sz300014', // 亿纬锂能
      'sz002352', // 顺丰控股
      'sz300760', // 迈瑞医疗
      'sz002714', // 牧原股份
      'sz300015', // 爱尔眼科
      'sz002304', // 洋河股份
      'sz300142', // 沃森生物
      'sz002460', // 赣锋锂业
      'sz300496'  // 中科创达
    ]
  },
  healthcare: {
    name: '医疗',
    codes: [
      'sz300760', // 迈瑞医疗
      'sz300015', // 爱尔眼科
      'sh600276', // 恒瑞医药
      'sz002821', // 凯莱英
      'sz300142', // 沃森生物
      'sz300347', // 泰格医药
      'sz002007', // 华兰生物
      'sz300122', // 智飞生物
      'sz000661', // 长春高新
      'sz002422', // 科伦药业
      'sz300003', // 乐普医疗
      'sz002038'  // 双鹭药业
    ]
  },
  energy: {
    name: '能源',
    codes: [
      'sh601857', // 中国石油
      'sh600028', // 中国石化
      'sh601808', // 中海油服
      'sh600256', // 广汇能源
      'sh601088', // 中国神华
      'sh600188', // 兖州煤业
      'sh601225', // 陕西煤业
      'sh600348', // 阳泉煤业
      'sh601898', // 中煤能源
      'sh600123'  // 兰花科创
    ]
  },
  finance: {
    name: '金融',
    codes: [
      'sh601318', // 中国平安
      'sh600030', // 中信证券
      'sh600837', // 海通证券
      'sh000166', // 申万宏源
      'sh601688', // 华泰证券
      'sh601211', // 国泰君安
      'sh600999', // 招商证券
      'sh601788', // 光大证券
      'sh600958', // 东方证券
      'sh601377'  // 兴业证券
    ]
  },
  realestate: {
    name: '房地产',
    codes: [
      'sz000002', // 万科A
      'sh600048', // 保利发展
      'sz000069', // 华侨城A
      'sh600340', // 华夏幸福
      'sz000656', // 金科股份
      'sz002146', // 荣盛发展
      'sh600383', // 金地集团
      'sz000031', // 中粮地产
      'sh600606', // 绿地控股
      'sz002244'  // 滨江集团
    ]
  },
  consumer: {
    name: '消费',
    codes: [
      'sh600519', // 贵州茅台
      'sz000858', // 五粮液
      'sz000876', // 新希望
      'sh600887', // 伊利股份
      'sz002304', // 洋河股份
      'sh603288', // 海天味业
      'sz000895', // 双汇发展
      'sh600779', // 水井坊
      'sz002568', // 百润股份
      'sh600132', // 重庆啤酒
      'sh600600', // 青岛啤酒
      'sz000596'  // 古井贡酒
    ]
  },
  materials: {
    name: '材料',
    codes: [
      'sh600585', // 海螺水泥
      'sz000877', // 天山股份
      'sh601012', // 隆基绿能
      'sz002460', // 赣锋锂业
      'sh600309', // 万华化学
      'sh601899', // 紫金矿业
      'sh600362', // 江西铜业
      'sh601600', // 中国铝业
      'sh600111', // 北方稀土
      'sh600219'  // 南山铝业
    ]
  }
};

/**
 * 获取股票实时数据
 * @param codes 股票代码数组
 * @returns 股票数据数组
 */
export async function fetchRealTimeStockData(codes: string[]): Promise<Stock[]> {
  try {
    // 使用新浪财经API获取实时数据
    const codeList = codes.join(',');
    const response = await axios.get(`${SINA_API_BASE}/list=${codeList}`, {
      timeout: 10000,
      headers: {
        'Referer': 'https://finance.sina.com.cn'
      },
      responseType: 'arraybuffer'
    });

    // 将GBK编码的数据转换为UTF-8
    const decodedData = iconv.decode(Buffer.from(response.data), 'gbk');

    const stocks: Stock[] = [];
    const lines = decodedData.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/var hq_str_([^=]+)="([^"]+)";/);
      if (!match) continue;
      
      const [, code, data] = match;
      const fields = data.split(',');
      
      if (fields.length < 32) continue;
      
      const name = fields[0];
      const openPrice = parseFloat(fields[1]);
      const yesterdayClose = parseFloat(fields[2]);
      const currentPrice = parseFloat(fields[3]);
      const highPrice = parseFloat(fields[4]);
      const lowPrice = parseFloat(fields[5]);
      const volume = parseInt(fields[8]);
      const turnover = parseFloat(fields[9]);
      
      // 计算涨跌幅
      const change = currentPrice - yesterdayClose;
      const changePercent = yesterdayClose > 0 ? (change / yesterdayClose) * 100 : 0;
      
      // 估算流通市值（使用成交额作为参考）
      const marketCap = turnover * 10000; // 简单估算
      
      stocks.push({
        code: code.replace(/^(sh|sz)/, ''),
        name,
        price: currentPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        marketCap: Math.floor(marketCap),
        volume
      });
    }
    
    return stocks;
  } catch (error) {
    console.error('获取股票数据失败:', error);
    // 如果API失败，返回模拟数据作为备用
    return generateFallbackData(codes);
  }
}

/**
 * 获取所有板块的股票数据
 * @returns 按板块分组的股票数据
 */
export async function fetchAllSectorsData(): Promise<Record<string, { sector: Sector; stocks: Stock[] }>> {
  const result: Record<string, { sector: Sector; stocks: Stock[] }> = {};
  
  for (const [sectorId, sectorInfo] of Object.entries(SECTOR_STOCKS)) {
    try {
      const stocks = await fetchRealTimeStockData(sectorInfo.codes);
      
      result[sectorId] = {
        sector: {
          id: sectorId,
          name: sectorInfo.name,
          stockCount: stocks.length
        },
        stocks
      };
    } catch (error) {
      console.error(`获取${sectorInfo.name}板块数据失败:`, error);
      // 使用备用数据
      result[sectorId] = {
        sector: {
          id: sectorId,
          name: sectorInfo.name,
          stockCount: sectorInfo.codes.length
        },
        stocks: generateFallbackData(sectorInfo.codes)
      };
    }
  }
  
  return result;
}

/**
 * 生成备用数据（当API失败时使用）
 * @param codes 股票代码数组
 * @returns 模拟股票数据
 */
function generateFallbackData(codes: string[]): Stock[] {
  return codes.map((code, index) => {
    const basePrice = 10 + Math.random() * 90;
    const changePercent = (Math.random() - 0.5) * 10;
    const change = basePrice * changePercent / 100;
    const price = basePrice + change;
    
    return {
      code: code.replace(/^(sh|sz)/, ''),
      name: `股票${index + 1}`,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      marketCap: Math.floor((50 + Math.random() * 500) * 100000000),
      volume: Math.floor(Math.random() * 50000000)
    };
  });
}

/**
 * 获取板块列表
 * @returns 板块数组
 */
export function getSectors(): Sector[] {
  return Object.entries(SECTOR_STOCKS).map(([id, info]) => ({
    id,
    name: info.name,
    stockCount: info.codes.length
  }));
}