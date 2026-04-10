import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

type SupportedLanguage = "en" | "id";

const DEFAULT_LANGUAGE: SupportedLanguage = "en";
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "id"];
const I18N_STORAGE_KEY = "I18N_LANGUAGE";

const TRANSLATION_FILES = [
    "common.json",
    "layout.json",
    "auth.json",
    "admin.json",
    "tenant/shared.json",
    "tenant/members.json",
    "tenant/roles.json",
    "tenant/invitations.json",
    "tenant/dashboard.json",
    "tenant/errors.json",
    "tenant/settings.json",
    "tenant/whatsapp.json",
    "tenant/finance.json",
    "tenant/wallet.json",
    "tenant/master.json",
] as const;

const localeLoaders = import.meta.glob("./locales/**/*.json");

const safeStorageGet = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeStorageSet = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore storage write failures (private mode / blocked storage).
    }
};

const getStoredLanguage = (): SupportedLanguage => {
    const stored = safeStorageGet(I18N_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
        return stored as SupportedLanguage;
    }

    safeStorageSet(I18N_STORAGE_KEY, DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
};

const buildLocalePaths = (language: SupportedLanguage) => (
    TRANSLATION_FILES.map((file) => `./locales/${language}/${file}`)
);

const loadLanguageBundle = async (language: SupportedLanguage): Promise<Record<string, unknown>> => {
    const segments = await Promise.all(buildLocalePaths(language).map(async (path) => {
        const loader = localeLoaders[path] as (() => Promise<{ default: Record<string, unknown> }>) | undefined;
        if (!loader) {
            throw new Error(`Missing i18n resource: ${path}`);
        }

        const module = await loader();
        return module.default || {};
    }));

    return Object.assign({}, ...segments);
};

let initPromise: Promise<typeof i18n> | null = null;

export const ensureI18nLanguage = async (language: string) => {
    if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
        return;
    }

    if (i18n.hasResourceBundle(language, "translation")) {
        return;
    }

    const bundle = await loadLanguageBundle(language as SupportedLanguage);
    i18n.addResourceBundle(language, "translation", bundle, true, true);
};

export const initI18n = () => {
    if (i18n.isInitialized) {
        return Promise.resolve(i18n);
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const language = getStoredLanguage();
        const primaryBundle = await loadLanguageBundle(language);
        const resources: Record<string, { translation: Record<string, unknown> }> = {
            [language]: { translation: primaryBundle },
        };

        if (language !== DEFAULT_LANGUAGE) {
            resources[DEFAULT_LANGUAGE] = {
                translation: await loadLanguageBundle(DEFAULT_LANGUAGE),
            };
        }

        await i18n
            .use(detector)
            .use(initReactI18next)
            .init({
                resources,
                lng: language,
                fallbackLng: DEFAULT_LANGUAGE,
                keySeparator: false,
                interpolation: {
                    escapeValue: false,
                },
            });

        i18n.on("languageChanged", (nextLanguage) => {
            void ensureI18nLanguage(nextLanguage);
            if (SUPPORTED_LANGUAGES.includes(nextLanguage as SupportedLanguage)) {
                safeStorageSet(I18N_STORAGE_KEY, nextLanguage);
            }
        });

        return i18n;
    })().catch((error) => {
        initPromise = null;
        throw error;
    });

    return initPromise;
};

export default i18n;
