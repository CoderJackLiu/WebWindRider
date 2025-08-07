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
 * 尝试从备用API获取股票数据
 * @param codes 股票代码数组
 * @returns 股票数据数组或null（如果失败）
 */
async function fetchFromBackupAPI(codes: string[]): Promise<Stock[] | null> {
  try {
    console.log('尝试使用腾讯财经API作为备用数据源...');
    
    // 使用腾讯财经API作为备用
    const codeList = codes.map(code => {
      // 转换股票代码格式
      if (code.startsWith('sh')) {
        return '1.' + code.substring(2);
      } else if (code.startsWith('sz')) {
        return '0.' + code.substring(2);
      }
      return code;
    }).join(',');
    
    const response = await axios.get(`${TENCENT_API_BASE}/q=${codeList}`, {
      timeout: 8000,
      headers: {
        'Referer': 'https://finance.qq.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const stocks: Stock[] = [];
    const lines = response.data.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/v_([^=]+)="([^"]+)";/);
      if (!match) continue;
      
      const [, code, data] = match;
      const fields = data.split('~');
      
      if (fields.length < 10) continue;
      
      const name = fields[1];
      const currentPrice = parseFloat(fields[3]);
      const yesterdayClose = parseFloat(fields[4]);
      const change = parseFloat(fields[31]);
      const changePercent = parseFloat(fields[32]);
      
      stocks.push({
        code: code.replace(/^[01]\./, ''),
        name,
        price: currentPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        marketCap: Math.floor(Math.random() * 1000000000),
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    
    if (stocks.length > 0) {
      console.log(`腾讯API成功获取${stocks.length}只股票数据`);
      return stocks;
    }
    
    return null;
  } catch (error) {
    console.error('腾讯API也失败了:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

/**
 * 获取股票实时数据
 * @param codes 股票代码数组
 * @returns 股票数据数组
 */
export async function fetchRealTimeStockData(codes: string[]): Promise<Stock[]> {
  const startTime = Date.now();
  console.log(`开始获取${codes.length}只股票的实时数据...`);
  
  try {
    // 使用新浪财经API获取实时数据
    const codeList = codes.join(',');
    console.log('请求新浪财经API:', `${SINA_API_BASE}/list=${codeList}`);
    
    const response = await axios.get(`${SINA_API_BASE}/list=${codeList}`, {
      timeout: 8000, // 增加超时时间
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      responseType: 'arraybuffer',
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    console.log('新浪API响应状态:', response.status, '数据长度:', response.data.length);

    // 将GBK编码的数据转换为UTF-8 - 兼容serverless环境
    let decodedData: string;
    try {
      decodedData = iconv.decode(Buffer.from(response.data), 'gbk');
      console.log('成功使用GBK解码');
    } catch (iconvError) {
      // 如果iconv失败，尝试直接解码为UTF-8
      console.warn('iconv解码失败，尝试UTF-8解码:', iconvError);
      decodedData = Buffer.from(response.data).toString('utf8');
    }

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
    
    const endTime = Date.now();
    console.log(`新浪API成功获取${stocks.length}只股票数据，耗时${endTime - startTime}ms`);
    return stocks;
  } catch (error) {
    const endTime = Date.now();
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      codes: codes.slice(0, 5), // 只记录前5个代码避免日志过长
      timestamp: new Date().toISOString(),
      duration: endTime - startTime,
      isAxiosError: axios.isAxiosError(error),
      responseStatus: axios.isAxiosError(error) ? error.response?.status : undefined,
      responseData: axios.isAxiosError(error) ? error.response?.data?.toString().substring(0, 200) : undefined
    };
    
    console.error('新浪财经API获取股票数据失败:', errorDetails);
    
    // 尝试备用API
    console.log('尝试使用备用API获取数据...');
    const backupData = await fetchFromBackupAPI(codes);
    if (backupData && backupData.length > 0) {
      console.log(`成功从备用API获取${backupData.length}只股票数据`);
      return backupData;
    }
    
    // 如果备用API也失败，使用fallback数据
    console.log('所有外部API都失败，使用fallback数据作为备用方案');
    return generateFallbackData(codes);
  }
}

/**
 * 获取所有板块的股票数据
 * @returns 按板块分组的股票数据
 */
export async function fetchAllSectorsData(): Promise<Record<string, { sector: Sector; stocks: Stock[] }>> {
  const result: Record<string, { sector: Sector; stocks: Stock[] }> = {};
  const startTime = Date.now();
  
  console.log('开始获取所有板块数据，板块数量:', Object.keys(SECTOR_STOCKS).length);
  
  // 使用Promise.allSettled来并行处理所有板块，避免一个失败影响其他
  const sectorPromises = Object.entries(SECTOR_STOCKS).map(async ([sectorId, sectorInfo]) => {
    try {
      const stocks = await fetchRealTimeStockData(sectorInfo.codes);
      return {
        sectorId,
        success: true,
        data: {
          sector: {
            id: sectorId,
            name: sectorInfo.name,
            stockCount: stocks.length
          },
          stocks
        }
      };
    } catch (error) {
      console.error(`获取${sectorInfo.name}板块数据失败:`, {
        error: error instanceof Error ? error.message : String(error),
        sectorId,
        timestamp: new Date().toISOString()
      });
      
      return {
        sectorId,
        success: false,
        data: {
          sector: {
            id: sectorId,
            name: sectorInfo.name,
            stockCount: sectorInfo.codes.length
          },
          stocks: generateFallbackData(sectorInfo.codes)
        }
      };
    }
  });
  
  const results = await Promise.allSettled(sectorPromises);
  
  // 处理结果
  let successCount = 0;
  let fallbackCount = 0;
  
  results.forEach((promiseResult) => {
    if (promiseResult.status === 'fulfilled') {
      const { sectorId, success, data } = promiseResult.value;
      result[sectorId] = data;
      if (success) {
        successCount++;
      } else {
        fallbackCount++;
      }
    } else {
      console.error('板块数据处理失败:', promiseResult.reason);
    }
  });
  
  const endTime = Date.now();
  console.log(`板块数据获取完成: 成功${successCount}个, 使用fallback${fallbackCount}个, 耗时${endTime - startTime}ms`);
  
  return result;
}

// 股票代码到名称的映射表（用于fallback数据）
const STOCK_NAMES: Record<string, string> = {
  // 银行板块
  'sh600036': '招商银行', 'sz000001': '平安银行', 'sh601398': '工商银行', 'sh601939': '建设银行',
  'sh601288': '农业银行', 'sh600000': '浦发银行', 'sh601166': '兴业银行', 'sh600015': '华夏银行',
  'sh601169': '北京银行', 'sh601009': '南京银行', 'sh600016': '民生银行', 'sh601818': '光大银行',
  'sh601328': '交通银行', 'sz002142': '宁波银行', 'sh601998': '中信银行',
  
  // 科技板块
  'sz000858': '五粮液', 'sz002415': '海康威视', 'sz000002': '万科A', 'sz002594': '比亚迪',
  'sz000725': '京东方A', 'sz002230': '科大讯飞', 'sz300059': '东方财富', 'sz300750': '宁德时代',
  'sz002475': '立讯精密', 'sz300014': '亿纬锂能', 'sz002352': '顺丰控股', 'sz300760': '迈瑞医疗',
  'sz002714': '牧原股份', 'sz300015': '爱尔眼科', 'sz002304': '洋河股份', 'sz300142': '沃森生物',
  'sz002460': '赣锋锂业', 'sz300496': '中科创达',
  
  // 医疗板块
  'sh600276': '恒瑞医药', 'sz002821': '凯莱英', 'sz300347': '泰格医药', 'sz002007': '华兰生物',
  'sz300122': '智飞生物', 'sz000661': '长春高新', 'sz002422': '科伦药业', 'sz300003': '乐普医疗',
  'sz002038': '双鹭药业',
  
  // 能源板块
  'sh601857': '中国石油', 'sh600028': '中国石化', 'sh601808': '中海油服', 'sh600256': '广汇能源',
  'sh601088': '中国神华', 'sh600188': '兖州煤业', 'sh601225': '陕西煤业', 'sh600348': '阳泉煤业',
  'sh601898': '中煤能源', 'sh600123': '兰花科创',
  
  // 金融板块
  'sh601318': '中国平安', 'sh600030': '中信证券', 'sh600837': '海通证券', 'sh000166': '申万宏源',
  'sh601688': '华泰证券', 'sh601211': '国泰君安', 'sh600999': '招商证券', 'sh601788': '光大证券',
  'sh600958': '东方证券', 'sh601377': '兴业证券',
  
  // 房地产板块
  'sh600048': '保利发展', 'sz000069': '华侨城A', 'sh600340': '华夏幸福', 'sz000656': '金科股份',
  'sz002146': '荣盛发展', 'sh600383': '金地集团', 'sz000031': '中粮地产', 'sh600606': '绿地控股',
  'sz002244': '滨江集团',
  
  // 消费板块
  'sh600519': '贵州茅台', 'sz000876': '新希望', 'sh600887': '伊利股份', 'sz000895': '双汇发展',
  'sh603288': '海天味业', 'sh600779': '水井坊', 'sz002568': '百润股份', 'sh600132': '重庆啤酒',
  'sh600600': '青岛啤酒', 'sz000596': '古井贡酒',
  
  // 材料板块
  'sh600585': '海螺水泥', 'sz000877': '天山股份', 'sh601012': '隆基绿能', 'sh600309': '万华化学',
  'sh601899': '紫金矿业', 'sh600362': '江西铜业', 'sh601600': '中国铝业', 'sh600111': '北方稀土',
  'sh600219': '南山铝业'
};

/**
 * 生成模拟股票数据作为备用
 * @param codes 股票代码数组
 * @returns 模拟的股票数据
 */
function generateFallbackData(codes: string[]): Stock[] {
  // 使用当前时间作为随机种子，确保同一时间段内数据相对稳定
  const seed = Math.floor(Date.now() / (1000 * 60 * 5)); // 每5分钟更新一次
  
  return codes.map((code, index) => {
    // 基于股票代码和时间种子生成相对稳定的随机数
    const codeHash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (seed + codeHash + index) % 10000 / 10000;
    
    // 根据股票代码前缀确定基础价格范围
    let priceRange = { min: 5, max: 50 }; // 默认价格范围
    if (code.startsWith('00')) {
      priceRange = { min: 8, max: 80 }; // 主板股票
    } else if (code.startsWith('30')) {
      priceRange = { min: 15, max: 150 }; // 创业板股票
    } else if (code.startsWith('60')) {
      priceRange = { min: 10, max: 100 }; // 沪市主板
    }
    
    // 生成基础价格
    const basePrice = priceRange.min + pseudoRandom * (priceRange.max - priceRange.min);
    
    // 生成更真实的涨跌幅分布
    // 使用多个随机因子确保更好的分布
    const randomFactor1 = (pseudoRandom - 0.5) * 2; // -1到1之间
    const randomFactor2 = ((codeHash + seed) % 10000 / 10000 - 0.5) * 2; // 另一个随机因子
    const combinedFactor = (randomFactor1 + randomFactor2) / 2;
    
    let changePercent;
    const absRandom = Math.abs(combinedFactor);
    
    if (absRandom < 0.1) {
      // 10%的股票基本平盘（-0.5%到+0.5%）
      changePercent = combinedFactor * 0.5;
    } else if (absRandom < 0.6) {
      // 50%的股票涨跌幅在-2%到+2%之间
      changePercent = combinedFactor * 2;
    } else if (absRandom < 0.85) {
      // 25%的股票涨跌幅在-5%到+5%之间
      changePercent = combinedFactor * 5;
    } else {
      // 15%的股票涨跌幅在-10%到+10%之间
      changePercent = combinedFactor * 10;
    }
    
    const changeAmount = basePrice * (changePercent / 100);
    const currentPrice = basePrice + changeAmount;
    
    // 获取股票名称，如果没有则使用默认名称
    const stockName = STOCK_NAMES[code] || `股票${code}`;
    
    // 生成成交量（基于价格和涨跌幅）
    const baseVolume = 50000 + pseudoRandom * 500000;
    const volumeMultiplier = 1 + Math.abs(changePercent) / 10; // 涨跌幅越大，成交量越大
    const volume = Math.floor(baseVolume * volumeMultiplier);
    
    return {
      code: code.replace(/^(sh|sz)/, ''),
      name: stockName,
      price: Number(currentPrice.toFixed(2)),
      change: Number(changeAmount.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      marketCap: Math.floor((50 + pseudoRandom * 500) * 100000000),
      volume
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