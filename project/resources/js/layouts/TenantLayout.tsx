import React from 'react';

import AppShellLayout from '../components/layouts/app-shell/AppShellLayout';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    return <AppShellLayout>{children}</AppShellLayout>;
}
