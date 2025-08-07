/**
 * 股票相关API路由
 * 提供板块数据、股票数据和雪球链接等接口
 */

import express, { type Request, type Response } from 'express';
import { fetchRealTimeStockData, fetchAllSectorsData, getSectors } from '../services/stockDataService';

const router = express.Router();

/**
 * 获取所有板块列表
 * GET /api/stocks/sectors
 */
router.get('/sectors', (req: Request, res: Response): void => {
  try {
    const sectors = getSectors();
    res.status(200).json({
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

/**
 * 获取指定板块的股票数据
 * GET /api/stocks/sector/:sectorId
 */
router.get('/sector/:sectorId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectorId } = req.params;
    
    // 获取所有板块数据
    const allSectorsData = await fetchAllSectorsData();
    
    if (!allSectorsData[sectorId]) {
      res.status(404).json({
        success: false,
        error: '板块不存在'
      });
      return;
    }
    
    const { stocks } = allSectorsData[sectorId];

    res.status(200).json({
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

/**
 * 获取所有板块的股票数据
 * GET /api/stocks/all-sectors
 */
router.get('/all-sectors', async (req: Request, res: Response): Promise<void> => {
  try {
    const allSectorsData = await fetchAllSectorsData();
    
    res.status(200).json({
      success: true,
      data: allSectorsData
    });
  } catch (error) {
    console.error('获取所有板块数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取所有板块数据失败'
    });
  }
});

/**
 * 获取雪球股票链接
 * GET /api/stocks/xueqiu-link/:stockCode
 */
router.get('/xueqiu-link/:stockCode', (req: Request, res: Response): void => {
  try {
    const { stockCode } = req.params;
    
    // 根据股票代码生成雪球链接
    // 沪市股票以6开头，深市股票以0或3开头
    let market = 'SH';
    if (stockCode.startsWith('0') || stockCode.startsWith('3')) {
      market = 'SZ';
    }
    
    const url = `https://xueqiu.com/S/${market}${stockCode}`;
    
    res.status(200).json({
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

export default router;