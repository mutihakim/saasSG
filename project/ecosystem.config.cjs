module.exports = {
  apps: [
    {
      name: "family2-reverb",
      cwd: __dirname,
      script: "artisan",
      args: "reverb:start --host=127.0.0.1 --port=8095",
      interpreter: "php",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        APP_ENV: "local"
      }
    },
    {
      name: "family2-queue-worker",
      cwd: __dirname,
      script: "artisan",
      args: "queue:work --sleep=1 --tries=3 --timeout=120",
      interpreter: "php",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        APP_ENV: "local"
      }
    }
  ]
};
