import React from 'react';

import AppShellLayout from '../components/layouts/app-shell/AppShellLayout';
import { AppShellPreferences } from '../types/page';

/**
 * TenantMemberLayout
 *
 * Wrapper around AppShellLayout with locked preferences for the member hub area.
 * The layout is always horizontal, fluid, fixed, and light topbar.
 * The customizer drawer (theme settings) is hidden.
 *
 * Only dark/light mode toggle remains available to the user.
 */
const MEMBER_LOCKED_PREFS: Partial<AppShellPreferences> = {
    layoutType: 'horizontal',
    layoutWidthType: 'fluid',
    layoutPositionType: 'fixed',
    topbarThemeType: 'light',
};

export default function TenantMemberLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShellLayout lockPreferences={MEMBER_LOCKED_PREFS} hideCustomizer={true}>
            {children}
        </AppShellLayout>
    );
}
