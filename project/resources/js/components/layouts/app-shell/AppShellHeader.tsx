import { Link, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import LanguageDropdown from '@/components/layouts/LanguageDropdown';
import LightDark from '@/components/layouts/LightDark';
import ProfileDropdown from '@/components/layouts/ProfileDropdown';
import SearchOption from '@/components/layouts/SearchOption';
import ApplicationLogo from '@/components/ui/ApplicationLogo';
import { AppShellPreferences, SharedPageProps } from '@/types/page';

type Props = {
    headerClass: string;
    preferences: AppShellPreferences;
    hideCustomizer?: boolean;
    onToggleTheme: (mode: 'light' | 'dark') => void;
    onOpenCustomizer: () => void;
    onToggleHamburger: () => void;
};

function resolveHomeLink(props: SharedPageProps) {
    if (props.app?.area === 'admin') {
        return '/admin/dashboard';
    }

    if (props.auth?.is_superadmin && !props.currentTenant?.slug) {
        return '/admin/dashboard';
    }

    if (props.currentTenant?.slug) {
        return '/admin/dashboard';
    }

    return '/tenant-access-required';
}

export default function AppShellHeader({
    headerClass,
    preferences,
    hideCustomizer,
    onToggleTheme,
    onOpenCustomizer,
    onToggleHamburger,
}: Props) {
    const { props } = usePage<SharedPageProps>();
    const { t } = useTranslation();
    const homeLink = resolveHomeLink(props);
    const usesDarkLogo = preferences.topbarThemeType !== 'dark' && preferences.layoutModeType !== 'dark';
    const tenantLabel = props.currentTenant?.presentable_name || props.currentTenant?.display_name || props.currentTenant?.name;
    const [search, setSearch] = useState(false);

    return (
        <header id="page-topbar" className={headerClass}>
            <div className="layout-width">
                <div className="navbar-header">
                    <div className="d-flex">
                        <div className="navbar-brand-box horizontal-logo">
                            <Link href={homeLink} className="logo logo-dark">
                                <span className="logo-sm">
                                    <ApplicationLogo compact dark />
                                </span>
                                <span className="logo-lg">
                                    <ApplicationLogo dark />
                                </span>
                            </Link>

                            <Link href={homeLink} className="logo logo-light">
                                <span className="logo-sm">
                                    <ApplicationLogo compact dark={usesDarkLogo} />
                                </span>
                                <span className="logo-lg">
                                    <ApplicationLogo dark={usesDarkLogo} />
                                </span>
                            </Link>
                        </div>

                        <button
                            onClick={onToggleHamburger}
                            type="button"
                            className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                            id="topnav-hamburger-icon"
                        >
                            <span className="hamburger-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>

                        <SearchOption />

                        {tenantLabel ? (
                            <div className="d-none d-xl-flex align-items-center ms-3">
                                <span
                                    className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2"
                                    title={t('layout.shell.topbar.active_workspace', { tenant: tenantLabel })}
                                >
                                    <i className="ri-building-4-line align-bottom me-1"></i>
                                    {tenantLabel}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div className="d-flex align-items-center">
                        <Dropdown
                            show={search}
                            onToggle={(nextShow) => setSearch(nextShow)}
                            className="d-md-none topbar-head-dropdown header-item"
                        >
                            <Dropdown.Toggle
                                type="button"
                                as="button"
                                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                aria-label={t('layout.shell.search.mobile_trigger')}
                            >
                                <i className="ri-search-line fs-22"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="dropdown-menu-lg dropdown-menu-end p-0">
                                <Form className="p-3">
                                    <div className="form-group m-0">
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={t('layout.shell.search.placeholder')}
                                                aria-label={t('layout.shell.search.placeholder')}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                type="submit"
                                                aria-label={t('layout.shell.search.submit')}
                                            >
                                                <i className="ri-search-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                </Form>
                            </Dropdown.Menu>
                        </Dropdown>

                        <LanguageDropdown />
                        <LightDark layoutMode={preferences.layoutModeType} onChangeLayoutMode={onToggleTheme} />

                        {!hideCustomizer ? (
                            <div className="ms-1 header-item d-none d-sm-flex">
                                <button
                                    type="button"
                                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                    aria-label={t('layout.shell.topbar.open_customizer')}
                                    title={t('layout.shell.topbar.open_customizer')}
                                    onClick={onOpenCustomizer}
                                >
                                    <i className="ri-settings-3-line fs-22"></i>
                                </button>
                            </div>
                        ) : null}

                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
}
