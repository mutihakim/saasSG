/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.axios = axios;
window.Pusher = Pusher;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

const resolveLocale = (): string => {
    try {
        const raw = localStorage.getItem('I18N_LANGUAGE') || 'en';
        return ['en', 'id'].includes(raw) ? raw : 'en';
    } catch {
        return 'en';
    }
};

window.axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const locale = resolveLocale();
    config.headers = config.headers ?? {};
    config.headers['X-Locale'] = locale;
    config.headers['Accept-Language'] = locale;
    return config;
});

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

const reverbKey = String(import.meta.env.VITE_REVERB_APP_KEY || '');
const reverbHost = String(import.meta.env.VITE_REVERB_HOST || window.location.hostname);
const reverbScheme = String(import.meta.env.VITE_REVERB_SCHEME || window.location.protocol.replace(':', '') || 'https').toLowerCase();
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || (reverbScheme === 'https' ? 443 : 80));
const hasValidReverbKey = reverbKey.length > 0 && !reverbKey.includes('${');

if (hasValidReverbKey) {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === 'https',
        enabledTransports: reverbScheme === 'https' ? ['wss'] : ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
    });
}
