// PM2 Configuration for wpp-bot
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'wpp-bot',
      script: 'dist/index.js',
      cwd: '/home/ubuntu/wpp-bot',

      // Node.js ES modules support
      node_args: '--experimental-specifier-resolution=node',

      // Environment
      env: {
        NODE_ENV: 'production',
      },

      // Restart behavior
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/ubuntu/wpp-bot/logs/error.log',
      out_file: '/home/ubuntu/wpp-bot/logs/out.log',
      merge_logs: true,

      // Memory management (important for 1GB RAM)
      max_memory_restart: '500M',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 3000,
    },
  ],
};
