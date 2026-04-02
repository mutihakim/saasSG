import '../../scss/app-shell.scss';
import 'simplebar-react/dist/simplebar.min.css';

import { usePage } from '@inertiajs/react';
import axios from 'axios';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

import faviconFallback from '../../images/favicon.ico';
import { buildShellNavigation } from '../common/shellNavigation';
import {
    applyAppShellPreferences,
    normalizeUiPreferences,
    serializeAppShellPreferences,
    serializeUiPreferences,
} from '../common/shellPreferences';
import { AppShellPreferences, SharedPageProps, UiPreferences } from '../types/page';

import AppShellCustomizer from './AppShellCustomizer';
import AppShellHeader from './AppShellHeader';
import AppShellSidebar from './AppShellSidebar';

type Props = {
    children: React.ReactNode;
    lockPreferences?: Partial<AppShellPreferences>;
    hideCustomizer?: boolean;
};

function syncResponsiveSidebar(preferences: AppShellPreferences) {
    const windowSize = document.documentElement.clientWidth;
    const hamburgerIcon = document.querySelector('.hamburger-icon');

    if (windowSize >= 1025) {
        if (document.documentElement.getAttribute('data-layout') === 'vertical' || document.documentElement.getAttribute('data-layout') === 'semibox') {
            document.documentElement.setAttribute('data-sidebar-size', preferences.leftsidbarSizeType);
        }

        if (
            preferences.sidebarVisibilitytype === 'show'
            || preferences.layoutType === 'vertical'
            || preferences.layoutType === 'twocolumn'
        ) {
            hamburgerIcon?.classList.remove('open');
        } else {
            hamburgerIcon?.classList.add('open');
        }

        return;
    }

    if (windowSize < 1025 && windowSize > 767) {
        document.body.classList.remove('twocolumn-panel');
        if (document.documentElement.getAttribute('data-layout') === 'vertical' || document.documentElement.getAttribute('data-layout') === 'semibox') {
            document.documentElement.setAttribute('data-sidebar-size', 'sm');
        }
        hamburgerIcon?.classList.add('open');
        return;
    }

    document.body.classList.remove('vertical-sidebar-enable');
    if (document.documentElement.getAttribute('data-layout') !== 'horizontal') {
        document.documentElement.setAttribute('data-sidebar-size', 'lg');
    }
    hamburgerIcon?.classList.add('open');
}

function AppShellLayoutInner({
    children,
    props,
    initialPreferences,
    initialUiPreferences,
    lockPreferences,
    hideCustomizer,
}: {
    children: React.ReactNode;
    props: SharedPageProps;
    initialPreferences: AppShellPreferences;
    initialUiPreferences: UiPreferences;
    lockPreferences?: Partial<AppShellPreferences>;
    hideCustomizer?: boolean;
}) {
    const lockedPrefs = useMemo(() => lockPreferences ?? {}, [lockPreferences]);
    const [preferences, setPreferences] = useState<AppShellPreferences>({
        ...initialPreferences,
        ...lockedPrefs,
    });
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [headerClass, setHeaderClass] = useState('');
    const [showPreloader, setShowPreloader] = useState(initialPreferences.preloader === 'enable');
    const pathname = `${window.location.pathname}${window.location.search}`;
    const lastSaved = useRef(
        JSON.stringify(
            serializeUiPreferences({
                ...initialUiPreferences,
                appShell: initialPreferences,
            })
        )
    );
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sections = useMemo(() => buildShellNavigation(props), [props]);
    const isImpersonating = Boolean(props.auth?.is_impersonating);
    const isAdminArea = props.app?.area === 'admin';
    const footerBrand = props.currentTenant?.presentable_name || props.currentTenant?.display_name || props.currentTenant?.name || 'appsah';

    useEffect(() => {
        applyAppShellPreferences(preferences);
        syncResponsiveSidebar(preferences);
    }, [preferences]);

    useEffect(() => {
        const handleResize = () => syncResponsiveSidebar(preferences);

        handleResize();
        window.addEventListener('resize', handleResize, true);

        return () => {
            window.removeEventListener('resize', handleResize, true);
        };
    }, [preferences]);

    useEffect(() => {
        const handleScroll = () => {
            setHeaderClass(document.documentElement.scrollTop > 50 ? 'topbar-shadow' : '');
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    useEffect(() => {
        if (preferences.preloader !== 'enable') {
            return undefined;
        }

        const showTimer = setTimeout(() => setShowPreloader(true), 0);
        const hideTimer = setTimeout(() => setShowPreloader(false), 1000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [pathname, preferences.preloader]);

    useEffect(() => {
        const href = props.currentTenant?.branding?.faviconUrl || props.app?.branding?.faviconUrl || faviconFallback;
        let link = document.querySelector<HTMLLinkElement>('link[data-app-favicon="true"]');

        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.setAttribute('data-app-favicon', 'true');
            document.head.appendChild(link);
        }

        link.href = href;
    }, [props.app?.branding?.faviconUrl, props.currentTenant?.branding?.faviconUrl]);

    useEffect(() => {
        const payload = serializeUiPreferences({
            ...initialUiPreferences,
            appShell: preferences,
        });
        const serialized = JSON.stringify(payload);

        if (serialized === lastSaved.current) {
            return;
        }

        // Don't save locked fields — only persist what the user can actually change
        const hasUnlockedChanges = Object.keys(payload.appShell).some(
            (key) => !(key in lockedPrefs) && (payload.appShell as Record<string, unknown>)[key] !==
                (JSON.parse(lastSaved.current) as typeof payload).appShell[key as keyof typeof payload.appShell]
        );

        if (!hasUnlockedChanges) {
            return;
        }

        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }

        saveTimer.current = setTimeout(() => {
            axios.put('/settings/theme', payload).then(() => {
                lastSaved.current = serialized;
            }).catch(() => {
                // Ignore transient save failures; the next preference change retries.
            });
        }, 400);

        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }
        };
    }, [initialUiPreferences, preferences, lockedPrefs]);

    const setPreferencesLocked = (updater: AppShellPreferences | ((p: AppShellPreferences) => AppShellPreferences)) => {
        setPreferences((current) => {
            const next = typeof updater === 'function' ? updater(current) : updater;
            return { ...next, ...lockedPrefs };
        });
    };

    const toggleHamburger = () => {
        const windowSize = document.documentElement.clientWidth;
        const hamburgerIcon = document.querySelector('.hamburger-icon');

        if (windowSize > 767 && hamburgerIcon) {
            hamburgerIcon.classList.toggle('open');
        }

        if (preferences.layoutType === 'horizontal') {
            document.body.classList.toggle('menu');
            return;
        }

        if (preferences.layoutType === 'twocolumn') {
            document.body.classList.toggle('twocolumn-panel');
            return;
        }

        if (preferences.sidebarVisibilitytype === 'show' && (preferences.layoutType === 'vertical' || preferences.layoutType === 'semibox')) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                setPreferences((current) => ({
                    ...current,
                    leftsidbarSizeType: current.leftsidbarSizeType === 'sm' ? 'lg' : 'sm',
                }));
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                setPreferences((current) => ({
                    ...current,
                    leftsidbarSizeType: current.leftsidbarSizeType === 'lg' ? 'sm' : 'lg',
                }));
            } else if (windowSize <= 767) {
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute('data-sidebar-size', 'lg');
            }
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                }}
                className="btn btn-danger btn-icon"
                id="back-to-top"
                type="button"
            >
                <i className="ri-arrow-up-line"></i>
            </button>

            {preferences.preloader === 'enable' && showPreloader ? (
                <div id="preloader">
                    <div id="status">
                        <div className="spinner-border text-primary avatar-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            ) : null}

            <div id="layout-wrapper" className="app-shell-layout">
                <AppShellHeader
                    headerClass={headerClass}
                    preferences={preferences}
                    hideCustomizer={hideCustomizer}
                    onToggleTheme={(mode) => setPreferencesLocked((current) => ({ ...current, layoutModeType: mode }))}
                    onOpenCustomizer={() => setCustomizerOpen(true)}
                    onToggleHamburger={toggleHamburger}
                />
                <AppShellSidebar
                    sections={sections}
                    preferences={preferences}
                    onCloseMobileSidebar={() => {
                        document.body?.classList.remove('vertical-sidebar-enable');
                    }}
                />

                <div className="main-content">
                    <div className="page-content">
                        <div className={preferences.layoutWidthType === 'boxed' ? 'container-fluid layout-width' : 'container-fluid'}>
                            {isImpersonating && !isAdminArea ? (
                                <Alert variant="warning" className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                                    <div>
                                        <strong>Impersonation Active.</strong> You are operating as a tenant user.
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="dark"
                                        onClick={async () => {
                                            await axios.delete('/admin/impersonations');
                                            window.location.href = '/admin/tenants';
                                        }}
                                    >
                                        Stop Impersonation
                                    </Button>
                                </Alert>
                            ) : null}
                            {children}
                        </div>
                    </div>

                    <footer className="footer">
                        <div className={preferences.layoutWidthType === 'boxed' ? 'layout-width mx-auto' : undefined}>
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-sm-6">{new Date().getFullYear()} (c) appsah.</div>
                                    <div className="col-sm-6">
                                        <div className="text-sm-end d-none d-sm-block">{footerBrand} workspace on the shared Velzon SaaS shell.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

            {!hideCustomizer ? (
                <AppShellCustomizer
                    show={customizerOpen}
                    preferences={preferences}
                    onOpen={() => setCustomizerOpen(true)}
                    onClose={() => setCustomizerOpen(false)}
                    onChange={(patch) => setPreferencesLocked((current) => ({ ...current, ...patch }))}
                />
            ) : null}
        </>
    );
}

export default function AppShellLayout({ children, lockPreferences, hideCustomizer }: Props) {
    const { props } = usePage<SharedPageProps>();
    const initialUiPreferences = useMemo(
        () => normalizeUiPreferences(props.auth?.ui_preferences),
        [props.auth?.ui_preferences]
    );
    const initialPreferences = useMemo(() => ({
        ...initialUiPreferences.appShell,
        ...(lockPreferences ?? {}),
    }), [initialUiPreferences.appShell, lockPreferences]);
    const shellStateKey = useMemo(
        () => JSON.stringify(serializeAppShellPreferences(initialPreferences)),
        [initialPreferences]
    );

    return (
        <AppShellLayoutInner
            key={shellStateKey}
            props={props}
            initialPreferences={initialPreferences}
            initialUiPreferences={initialUiPreferences}
            lockPreferences={lockPreferences}
            hideCustomizer={hideCustomizer}
        >
            {children}
        </AppShellLayoutInner>
    );
}
