module.exports = {
    apps: [
        {
            name: 'family2-whatsapp',
            script: './src/index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'local',
                PORT: 3025,
                APP_CALLBACK_URL: 'http://146.19.216.195:8015',
                WHATSAPP_INTERNAL_TOKEN: 'change-me',
                WA_AUTH_DIR: './wa-auth',
                REQUEST_TIMEOUT_MS: 8000,
                CONNECTING_TIMEOUT_MS: 60000,
            },
        },
    ],
};
