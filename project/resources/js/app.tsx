import '../scss/themes.scss';
import './bootstrap';
import './i18n';
import 'bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import.meta.glob('../images/**');
import.meta.glob('../fonts/**');

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <ToastContainer closeButton={false} limit={1} newestOnTop />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
