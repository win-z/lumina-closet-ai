module.exports = {
  apps: [
    {
      name: 'lumina-backend',
      script: 'dist/server.js',
      cwd: '/www/wwwroot/lumina-closet/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/www/wwwlogs/lumina-backend-out.log',
      error_file: '/www/wwwlogs/lumina-backend-err.log',
      merge_logs: true,
    },
  ],
};
