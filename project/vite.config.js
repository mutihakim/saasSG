import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(rootDir, 'resources/js'),
            '@/core': path.resolve(rootDir, 'resources/js/core'),
            '@/assets': path.resolve(rootDir, 'resources/js/assets'),
            '@/components': path.resolve(rootDir, 'resources/js/components'),
            '@/features': path.resolve(rootDir, 'resources/js/features'),
            '@/layouts': path.resolve(rootDir, 'resources/js/layouts'),
            '@/pages': path.resolve(rootDir, 'resources/js/pages'),
            '@/types': path.resolve(rootDir, 'resources/js/types'),
        },
    },
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
                    // ApexCharts (heavy, jarang berubah)
                    if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                        return 'charts-vendor';
                    }

                    // i18n locale files
                    if (id.includes('resources/js/locales/en/')) {
                        return 'i18n-en';
                    }
                    if (id.includes('resources/js/locales/id/')) {
                        return 'i18n-id';
                    }

                    // React core (stable, cache long-term)
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')
                    ) {
                        return 'react-core';
                    }

                    // React-Bootstrap + UI dependencies
                    if (
                        id.includes('node_modules/react-bootstrap/') ||
                        id.includes('node_modules/@restart/') ||
                        id.includes('node_modules/uncontrollable/') ||
                        id.includes('node_modules/warning/') ||
                        id.includes('node_modules/dom-helpers/')
                    ) {
                        return 'ui-vendor';
                    }

                    // Utility packages (classnames, babel runtime helpers)
                    if (
                        id.includes('node_modules/classnames/') ||
                        id.includes('node_modules/@babel/runtime/')
                    ) {
                        return 'utils-vendor';
                    }

                    return undefined;
                },
            },
        },
    },
});
