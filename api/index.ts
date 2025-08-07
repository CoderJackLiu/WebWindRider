/**
 * Vercel serverless function entry point
 * 简化版本，避免复杂的模块导入问题
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

// 创建简化的Express应用
const app = express();

// CORS配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        vercelRegion: process.env.VERCEL_REGION || 'unknown'
      }
    };
    
    res.json(healthInfo);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 板块数据配置
const SECTOR_STOCKS: Record<string, { name: string; codes: string[] }> = {
  banking: {
    name: '银行',
    codes: ['sh600036', 'sz000001', 'sh601398', 'sh601939', 'sh601288']
  },
  technology: {
    name: '科技',
    codes: ['sz000858', 'sz002415', 'sz000002', 'sz002594', 'sz000725']
  },
  healthcare: {
    name: '医疗',
    codes: ['sz300760', 'sz300015', 'sh600276', 'sz002821', 'sz300142']
  },
  energy: {
    name: '能源',
    codes: ['sh601857', 'sh600028', 'sh601808', 'sh600256', 'sh601088']
  },
  finance: {
    name: '金融',
    codes: ['sh601318', 'sh600030', 'sh600837', 'sh000166', 'sh601688']
  },
  realestate: {
    name: '房地产',
    codes: ['sz000002', 'sh600048', 'sz000069', 'sh600340', 'sz000656']
  },
  consumer: {
    name: '消费',
    codes: ['sh600519', 'sz000858', 'sz000876', 'sh600887', 'sz002304']
  },
  materials: {
    name: '材料',
    codes: ['sh600585', 'sz000877', 'sh601012', 'sz002460', 'sh600309']
  }
};

// 生成模拟数据的函数
function generateFallbackData(codes: string[]) {
  const seed = Math.floor(Date.now() / (1000 * 60 * 5)); // 每5分钟更新一次
  
  return codes.map((code, index) => {
    const codeHash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (seed + codeHash + index) % 10000 / 10000;
    
    const basePrice = 10 + pseudoRandom * 50;
    const changePercent = (pseudoRandom - 0.5) * 10; // -5% 到 +5%
    const changeAmount = basePrice * (changePercent / 100);
    const currentPrice = basePrice + changeAmount;
    
    const stockNames: Record<string, string> = {
      'sh600036': '招商银行', 'sz000001': '平安银行', 'sh601398': '工商银行',
      'sz000858': '五粮液', 'sz002415': '海康威视', 'sz000002': '万科A',
      'sz300760': '迈瑞医疗', 'sz300015': '爱尔眼科', 'sh600276': '恒瑞医药',
      'sh601857': '中国石油', 'sh600028': '中国石化', 'sh601808': '中海油服',
      'sh601318': '中国平安', 'sh600030': '中信证券', 'sh600837': '海通证券',
      'sh600048': '保利发展', 'sz000069': '华侨城A', 'sh600340': '华夏幸福',
      'sh600519': '贵州茅台', 'sz000876': '新希望', 'sh600887': '伊利股份',
      'sh600585': '海螺水泥', 'sz000877': '天山股份', 'sh601012': '隆基绿能'
    };
    
    return {
      code: code.replace(/^(sh|sz)/, ''),
      name: stockNames[code] || `股票${code}`,
      price: Number(currentPrice.toFixed(2)),
      change: Number(changeAmount.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      marketCap: Math.floor((50 + pseudoRandom * 500) * 100000000),
      volume: Math.floor(50000 + pseudoRandom * 500000)
    };
  });
}

// 获取板块列表
app.get('/api/stocks/sectors', (req, res) => {
  try {
    const sectors = Object.entries(SECTOR_STOCKS).map(([id, info]) => ({
      id,
      name: info.name,
      stockCount: info.codes.length
    }));
    
    res.json({
      success: true,
      sectors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取板块数据失败'
    });
  }
});

// 获取所有板块的股票数据
app.get('/api/stocks/all-sectors', async (req, res) => {
  try {
    const result: Record<string, any> = {};
    
    for (const [sectorId, sectorInfo] of Object.entries(SECTOR_STOCKS)) {
      const stocks = generateFallbackData(sectorInfo.codes);
      result[sectorId] = {
        sector: {
          id: sectorId,
          name: sectorInfo.name,
          stockCount: stocks.length
        },
        stocks
      };
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取所有板块数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取所有板块数据失败'
    });
  }
});

// 获取指定板块的股票数据
app.get('/api/stocks/sector/:sectorId', async (req, res) => {
  try {
    const { sectorId } = req.params;
    
    if (!SECTOR_STOCKS[sectorId]) {
      return res.status(404).json({
        success: false,
        error: '板块不存在'
      });
    }
    
    const sectorInfo = SECTOR_STOCKS[sectorId];
    const stocks = generateFallbackData(sectorInfo.codes);
    
    res.json({
      success: true,
      stocks
    });
  } catch (error) {
    console.error('获取股票数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取股票数据失败'
    });
  }
});

// 获取雪球股票链接
app.get('/api/stocks/xueqiu-link/:stockCode', (req, res) => {
  try {
    const { stockCode } = req.params;
    
    let market = 'SH';
    if (stockCode.startsWith('0') || stockCode.startsWith('3')) {
      market = 'SZ';
    }
    
    const url = `https://xueqiu.com/S/${market}${stockCode}`;
    
    res.json({
      success: true,
      url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '生成雪球链接失败'
    });
  }
});

// 测试端点
app.get('/api/stocks/test', async (req, res) => {
  try {
    const testData = {
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      data: generateFallbackData(['sh600036']).slice(0, 1)
    };
    
    res.json(testData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

// 错误处理
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Vercel函数处理器
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}