module.exports = {
    apps: [
        {
            name: 'sanjo-whatsapp',
            script: './src/index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3026,
                APP_CALLBACK_URL: 'https://sanjo.my.id',
                WHATSAPP_INTERNAL_TOKEN: 'change-me',
                WA_AUTH_DIR: './wa-auth',
                REQUEST_TIMEOUT_MS: 8000,
                CONNECTING_TIMEOUT_MS: 60000,
            },
        },
    ],
};
