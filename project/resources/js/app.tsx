import '../scss/themes.scss';
import './bootstrap';
import 'bootstrap';
import 'react-toastify/dist/ReactToastify.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';

import { initI18n } from './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pageModules = import.meta.glob('./pages/**/*.tsx');

function renderBootError(error: unknown): void {
    const rootElement = document.getElementById('app');
    if (!rootElement) {
        return;
    }

    const message = error instanceof Error ? error.message : 'Unknown startup error';
    const root = createRoot(rootElement);
    root.render(
        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
            <h2 style={{ marginBottom: '8px' }}>Failed to Load Application</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>
                Please refresh this page. If it still fails, contact support with this message:
            </p>
            <pre
                style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f4f4f5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {message}
            </pre>
        </div>
    );
}

function resolveInertiaPagePath(name: string) {
    const [root, ...rest] = name.split('/');
    const normalizedRoot = root.toLowerCase();
    const normalizedName = [normalizedRoot, ...rest].join('/');
    const candidates = [
        `./pages/${name}.tsx`,
        `./pages/${normalizedName}.tsx`,
    ];

    for (const candidate of candidates) {
        if (candidate in pageModules) {
            return candidate;
        }
    }

    throw new Error(`Inertia page not found for "${name}"`);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.debug('[PWA] service worker registered', {
                    scope: registration.scope,
                });
            })
            .catch((error) => {
                console.warn('[PWA] service worker registration failed', error);
            });
    });
} else {
    console.debug('[PWA] service worker unsupported in this browser');
}

const startApp = async () => {
    try {
        await initI18n();

        await createInertiaApp({
            title: (title) => `${title} - ${appName}`,
            resolve: (name) => resolvePageComponent(resolveInertiaPagePath(name), pageModules),
            setup({ el, App, props }) {
                const root = createRoot(el);
                root.render(
                    <>
                        <App {...props} />
                        <ToastContainer closeButton={false} newestOnTop />
                    </>
                );
            },
            progress: {
                color: '#4B5563',
            },
        });
    } catch (error) {
        console.error('[app] bootstrap failed', error);
        renderBootError(error);
    }
};

void startApp();
