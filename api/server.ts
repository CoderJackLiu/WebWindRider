/**
 * 后端服务器启动文件
 * 启动Express服务器并监听指定端口
 */

import app from './app.js';

const PORT = process.env.PORT || 3001;

/**
 * 启动服务器
 */
app.listen(PORT, () => {
  console.log(`🚀 API服务器已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🕒 启动时间: ${new Date().toLocaleString()}`);
  console.log('\n可用的API端点:');
  console.log(`  GET  /api/health - 健康检查`);
  console.log(`  GET  /api/stocks/sectors - 获取板块列表`);
  console.log(`  GET  /api/stocks/sector/:sectorId - 获取板块股票数据`);
  console.log(`  GET  /api/stocks/xueqiu-link/:stockCode - 获取雪球链接`);
  console.log('\n按 Ctrl+C 停止服务器');
});

/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
  console.log('\n📴 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});