import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                        return 'charts-vendor';
                    }

                    if (id.includes('fullcalendar') || id.includes('@fullcalendar')) {
                        return 'calendar-vendor';
                    }

                    if (id.includes('resources/js/locales/')) {
                        return 'i18n-locales';
                    }

                    return undefined;
                },
            },
        },
    },
});
