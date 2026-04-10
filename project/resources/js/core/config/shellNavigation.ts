import type { SharedPageProps } from '@/types/page';

export type ShellNavBadgeTone = 'primary' | 'success' | 'warning' | 'info';

export type ShellNavBadge = {
    labelKey: string;
    tone: ShellNavBadgeTone;
};

export type ShellNavMatcher = (pathname: string) => boolean;

export type ShellNavItem = {
    id: string;
    labelKey: string;
    href?: string;
    icon?: string;
    match?: ShellNavMatcher;
    locked?: boolean;
    badge?: ShellNavBadge;
    children?: ShellNavItem[];
};

export type ShellNavSection = {
    id: string;
    titleKey: string;
    icon: string;
    items: ShellNavItem[];
};

function startsWith(path: string) {
    return (pathname: string) => pathname === path || pathname.startsWith(`${path}/`);
}

function upgradeHref(workspaceBase: string, moduleKey: string, hasTenant: boolean) {
    return hasTenant
        ? `${workspaceBase}/upgrade-required?module=${encodeURIComponent(moduleKey)}`
        : '/tenant-access-required';
}

function lockedItem(
    id: string,
    labelKey: string,
    href: string,
    icon: string,
    locked: boolean,
    match: ShellNavMatcher
): ShellNavItem {
    return {
        id,
        labelKey,
        href,
        icon,
        locked,
        match,
    };
}

export function buildShellNavigation(props: SharedPageProps): ShellNavSection[] {
    const area = props.app?.area ?? 'tenant';
    const tenantSlug = props.currentTenant?.slug;
    const hasTenant = Boolean(tenantSlug);
    const entitlements = props.entitlements?.modules ?? {};
    const features = props.features ?? {};
    const isSuperadmin = Boolean(props.auth?.is_superadmin || props.auth?.user?.is_superadmin);

    const workspaceBase = hasTenant ? '' : (isSuperadmin ? '/admin/dashboard' : '/tenant-access-required');
    const workspaceUpgradeHref = (moduleKey: string) => upgradeHref(workspaceBase, moduleKey, hasTenant);

    const accountChildren: ShellNavItem[] = [
        { id: 'account-profile', labelKey: 'layout.shell.nav.items.profile', href: '/profile', icon: 'ri-user-line', match: startsWith('/profile') },
        { id: 'account-settings', labelKey: 'layout.shell.nav.items.profile_settings', href: '/profile/settings', icon: 'ri-settings-4-line', match: startsWith('/profile/settings') },
        { id: 'account-security', labelKey: 'layout.shell.nav.items.security', href: '/profile/security', icon: 'ri-lock-password-line', match: startsWith('/profile/security') },
    ];

    if (area === 'admin') {
        return [
            {
                id: 'admin-platform',
                titleKey: 'layout.shell.nav.sections.platform',
                icon: 'ri-dashboard-line',
                items: [
                    { id: 'admin-overview', labelKey: 'layout.shell.nav.items.overview', href: '/admin/dashboard', icon: 'ri-dashboard-line', match: startsWith('/admin/dashboard') },
                    {
                        id: 'admin-operations',
                        labelKey: 'layout.shell.nav.items.operations',
                        icon: 'ri-stack-line',
                        children: [
                            { id: 'admin-tenants', labelKey: 'layout.shell.nav.items.tenants', href: '/admin/tenants', icon: 'ri-building-line', match: startsWith('/admin/tenants') },
                            {
                                id: 'admin-billing',
                                labelKey: 'layout.shell.nav.items.billing',
                                icon: 'ri-vip-crown-line',
                                children: [
                                    {
                                        id: 'admin-subscriptions',
                                        labelKey: 'layout.shell.nav.items.subscriptions',
                                        href: '/admin/tenants/subscriptions',
                                        icon: 'ri-vip-crown-line',
                                        match: startsWith('/admin/tenants/subscriptions'),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                id: 'admin-account',
                titleKey: 'layout.shell.nav.sections.account',
                icon: 'ri-user-line',
                items: [
                    {
                        id: 'admin-account-menu',
                        labelKey: 'layout.shell.nav.items.my_account',
                        icon: 'ri-account-circle-line',
                        children: accountChildren,
                    },
                ],
            },
        ];
    }

    // --- MEMBER HUB AREA ---
    // Grouped for horizontal nav (HorizontalNavMenu shows 6 items, rest in "More").
    // Structure: 1 section → items with children = horizontal dropdown groups.
    if (area === 'member') {
        return [
            {
                id: 'member-nav',
                titleKey: 'layout.shell.nav.sections.workspace',
                icon: 'ri-home-heart-line',
                items: [
                    // Dashboard — direct link
                    {
                        id: 'member-hub',
                        labelKey: 'layout.shell.nav.items.member_hub',
                        href: '/hub',
                        icon: 'ri-home-heart-line',
                        match: (p: string) => p === '/hub' || p === '/',
                    },
                    // Modul A — Perencanaan Waktu & Proyek
                    {
                        id: 'member-planning',
                        labelKey: 'layout.shell.nav.items.member_planning',
                        icon: 'ri-calendar-2-line',
                        children: [
                            { id: 'member-calendar', labelKey: 'layout.shell.nav.items.member_calendar', href: '/calendar', icon: 'ri-calendar-2-line', match: startsWith('/calendar') },
                            { id: 'member-projects', labelKey: 'layout.shell.nav.items.member_projects', href: '/projects', icon: 'ri-kanban-view', match: startsWith('/projects') },
                        ],
                    },
                    // Modul B — Tugas & Gamifikasi
                    {
                        id: 'member-tasks-group',
                        labelKey: 'layout.shell.nav.items.member_tasks_rewards',
                        icon: 'ri-trophy-line',
                        children: [
                            { id: 'member-tasks',   labelKey: 'layout.shell.nav.items.member_tasks',   href: '/tasks',   icon: 'ri-checkbox-multiple-line', match: startsWith('/tasks') },
                            { id: 'member-rewards', labelKey: 'layout.shell.nav.items.member_rewards', href: '/rewards', icon: 'ri-trophy-line', match: startsWith('/rewards') },
                        ],
                    },
                    // Modul C — Keuangan
                    {
                        id: 'member-finance',
                        labelKey: 'layout.shell.nav.items.member_finance',
                        href: '/finance',
                        icon: 'ri-money-dollar-circle-line',
                        match: startsWith('/finance'),
                    },
                    // Modul D — Dapur & Belanja
                    {
                        id: 'member-kitchen-group',
                        labelKey: 'layout.shell.nav.items.member_kitchen',
                        icon: 'ri-restaurant-2-line',
                        children: [
                            { id: 'member-kitchen',  labelKey: 'layout.shell.nav.items.member_meal_planner', href: '/kitchen',  icon: 'ri-restaurant-2-line',  match: startsWith('/kitchen') },
                            { id: 'member-shopping', labelKey: 'layout.shell.nav.items.member_shopping',     href: '/shopping', icon: 'ri-shopping-cart-line', match: startsWith('/shopping') },
                        ],
                    },
                    // Modul E — Kesehatan & Tumbuh Kembang
                    {
                        id: 'member-health-group',
                        labelKey: 'layout.shell.nav.items.member_health',
                        icon: 'ri-heart-pulse-line',
                        children: [
                            { id: 'member-health',   labelKey: 'layout.shell.nav.items.member_growth_tracker', href: '/health',   icon: 'ri-seedling-line',        match: startsWith('/health') },
                            { id: 'member-medical',  labelKey: 'layout.shell.nav.items.member_medical',        href: '/medical',  icon: 'ri-medicine-bottle-line', match: startsWith('/medical') },
                            { id: 'member-records',  labelKey: 'layout.shell.nav.items.member_records',        href: '/records',  icon: 'ri-file-medical-line',    match: startsWith('/records') },
                        ],
                    },
                    // Modul F — Aset & Inventaris (masuk More dropdown di horizontal)
                    {
                        id: 'member-assets-group',
                        labelKey: 'layout.shell.nav.items.member_assets',
                        icon: 'ri-home-gear-line',
                        children: [
                            { id: 'member-assets',      labelKey: 'layout.shell.nav.items.member_info_vault',  href: '/assets',      icon: 'ri-home-gear-line', match: startsWith('/assets') },
                            { id: 'member-inventory',   labelKey: 'layout.shell.nav.items.member_inventory',   href: '/inventory',   icon: 'ri-archive-2-line', match: startsWith('/inventory') },
                            { id: 'member-dimensions',  labelKey: 'layout.shell.nav.items.member_dimensions',  href: '/dimensions',  icon: 'ri-ruler-2-line',   match: startsWith('/dimensions') },
                        ],
                    },
                    // Modul G — Liburan & Rekreasi
                    {
                        id: 'member-leisure-group',
                        labelKey: 'layout.shell.nav.items.member_leisure',
                        icon: 'ri-earth-line',
                        children: [
                            { id: 'member-leisure',  labelKey: 'layout.shell.nav.items.member_wishlist',  href: '/leisure',  icon: 'ri-heart-3-line',    match: startsWith('/leisure') },
                            { id: 'member-vacation', labelKey: 'layout.shell.nav.items.member_vacation',  href: '/vacation', icon: 'ri-suitcase-3-line', match: startsWith('/vacation') },
                        ],
                    },
                    // Modul H — Game Center
                    {
                        id: 'member-games',
                        labelKey: 'layout.shell.nav.items.member_games',
                        href: '/games',
                        icon: 'ri-gamepad-line',
                        match: startsWith('/games'),
                    },
                    // Modul I — WhatsApp
                    {
                        id: 'member-whatsapp',
                        labelKey: 'layout.shell.nav.items.member_whatsapp',
                        href: '/whatsapp',
                        icon: 'ri-whatsapp-line',
                        match: startsWith('/whatsapp'),
                        badge: { labelKey: 'layout.shell.badges.live', tone: 'success' },
                    },
                    // Konten (Gallery, Blog, Files)
                    {
                        id: 'member-content-group',
                        labelKey: 'layout.shell.nav.items.member_content',
                        icon: 'ri-image-2-line',
                        children: [
                            { id: 'member-gallery', labelKey: 'layout.shell.nav.items.member_gallery', href: '/gallery', icon: 'ri-image-line',   match: startsWith('/gallery') },
                            { id: 'member-blog',    labelKey: 'layout.shell.nav.items.member_blog',    href: '/blog',    icon: 'ri-article-line', match: startsWith('/blog') },
                            { id: 'member-files',   labelKey: 'layout.shell.nav.items.member_files',   href: '/files',   icon: 'ri-folder-3-line', match: startsWith('/files') },
                        ],
                    },
                    // Akun
                    {
                        id: 'member-account-group',
                        labelKey: 'layout.shell.nav.items.my_account',
                        icon: 'ri-account-circle-line',
                        children: [
                            { id: 'member-me',       labelKey: 'layout.shell.nav.items.profile',      href: '/me',              icon: 'ri-user-line',      match: startsWith('/me') },
                            { id: 'member-to-admin', labelKey: 'layout.shell.nav.items.admin_panel',  href: '/admin/dashboard', icon: 'ri-settings-4-line', match: startsWith('/admin/dashboard') },
                        ],
                    },
                ],
            },
        ];
    }

    const workspaceItems: ShellNavItem[] = [
        lockedItem(
            'tenant-dashboard',
            'layout.shell.nav.items.dashboard',
            entitlements.dashboard === false ? workspaceUpgradeHref('dashboard') : `${workspaceBase}/admin/dashboard`,
            'ri-dashboard-line',
            entitlements.dashboard === false,
            startsWith(`${workspaceBase}/admin/dashboard`)
        ),
    ];

    if (hasTenant) {
        workspaceItems.push({
            id: 'tenant-team',
            labelKey: 'layout.shell.nav.items.team',
            icon: 'ri-team-line',
            children: [
                lockedItem(
                    'tenant-members',
                    'layout.shell.nav.items.members',
                    entitlements['team.members'] === false ? workspaceUpgradeHref('team.members') : `${workspaceBase}/admin/members`,
                    'ri-team-line',
                    entitlements['team.members'] === false,
                    startsWith(`${workspaceBase}/admin/members`)
                ),
                {
                    id: 'tenant-access',
                    labelKey: 'layout.shell.nav.items.access',
                    icon: 'ri-shield-user-line',
                    children: [
                        lockedItem(
                            'tenant-roles',
                            'layout.shell.nav.items.roles',
                            entitlements['team.roles'] === false ? workspaceUpgradeHref('team.roles') : `${workspaceBase}/admin/roles`,
                            'ri-shield-user-line',
                            entitlements['team.roles'] === false,
                            startsWith(`${workspaceBase}/admin/roles`)
                        ),
                        lockedItem(
                            'tenant-invitations',
                            'layout.shell.nav.items.invitations',
                            entitlements['team.invitations'] === false ? workspaceUpgradeHref('team.invitations') : `${workspaceBase}/admin/invitations`,
                            'ri-mail-open-line',
                            entitlements['team.invitations'] === false,
                            startsWith(`${workspaceBase}/admin/invitations`)
                        ),
                    ],
                },
            ],
        });

        if (features.whatsapp) {
            workspaceItems.push({
                id: 'tenant-whatsapp',
                labelKey: 'layout.shell.nav.items.whatsapp',
                icon: 'ri-whatsapp-line',
                badge: { labelKey: 'layout.shell.badges.live', tone: 'success' },
                children: [
                    lockedItem(
                        'tenant-whatsapp-settings',
                        'layout.shell.nav.items.settings',
                        entitlements['whatsapp.settings'] === false ? workspaceUpgradeHref('whatsapp.settings') : `${workspaceBase}/admin/whatsapp/settings`,
                        'ri-settings-3-line',
                        entitlements['whatsapp.settings'] === false,
                        startsWith(`${workspaceBase}/admin/whatsapp/settings`)
                    ),
                    lockedItem(
                        'tenant-whatsapp-chats',
                        'layout.shell.nav.items.chats',
                        entitlements['whatsapp.chats'] === false ? workspaceUpgradeHref('whatsapp.chats') : `${workspaceBase}/admin/whatsapp/chats`,
                        'ri-message-3-line',
                        entitlements['whatsapp.chats'] === false,
                        startsWith(`${workspaceBase}/admin/whatsapp/chats`)
                    ),
                ],
            });
        }

        // ── Master Data ─────────────────────────────────────────────────────
        workspaceItems.push({
            id: 'tenant-master-data',
            labelKey: 'layout.shell.nav.items.master_data',
            icon: 'ri-database-2-line',
            children: [
                {
                    id: 'tenant-master-categories',
                    labelKey: 'layout.shell.nav.items.master_categories',
                    href: `${workspaceBase}/admin/master/categories`,
                    icon: 'ri-price-tag-3-line',
                    match: startsWith(`${workspaceBase}/admin/master/categories`),
                },
                {
                    id: 'tenant-master-tags',
                    labelKey: 'layout.shell.nav.items.master_tags',
                    href: `${workspaceBase}/admin/master/tags`,
                    icon: 'ri-hashtag',
                    match: startsWith(`${workspaceBase}/admin/master/tags`),
                },
                {
                    id: 'tenant-master-currencies',
                    labelKey: 'layout.shell.nav.items.master_currencies',
                    href: `${workspaceBase}/admin/master/currencies`,
                    icon: 'ri-exchange-dollar-line',
                    match: startsWith(`${workspaceBase}/admin/master/currencies`),
                },
                {
                    id: 'tenant-master-uom',
                    labelKey: 'layout.shell.nav.items.master_uom',
                    href: `${workspaceBase}/admin/master/uom`,
                    icon: 'ri-ruler-2-line',
                    match: startsWith(`${workspaceBase}/admin/master/uom`),
                },
            ],
        });

        workspaceItems.push({
            id: 'tenant-settings',
            labelKey: 'layout.shell.nav.items.settings',
            icon: 'ri-settings-4-line',
            href: `${workspaceBase}/admin/settings`,
            match: startsWith(`${workspaceBase}/admin/settings`),
        });
    }

    const sections: ShellNavSection[] = [
        {
            id: 'tenant-workspace',
            titleKey: 'layout.shell.nav.sections.workspace',
            icon: 'ri-dashboard-line',
            items: workspaceItems,
        },
        {
            id: 'tenant-account',
            titleKey: 'layout.shell.nav.sections.account',
            icon: 'ri-user-line',
            items: [
                {
                    id: 'tenant-account-menu',
                    labelKey: 'layout.shell.nav.items.my_account',
                    icon: 'ri-account-circle-line',
                    children: accountChildren,
                },
            ],
        },
    ];

    if (isSuperadmin) {
        sections.push({
            id: 'tenant-platform',
            titleKey: 'layout.shell.nav.sections.platform',
            icon: 'ri-command-line',
            items: [
                {
                    id: 'tenant-admin-console',
                    labelKey: 'layout.shell.nav.items.admin_console',
                    href: '/admin/dashboard',
                    icon: 'ri-command-line',
                    match: startsWith('/admin/dashboard'),
                },
            ],
        });
    }

    return sections;
}

export function isShellNavItemActive(item: ShellNavItem, pathname: string): boolean {
    if (item.match?.(pathname) || (item.href && pathname === item.href)) {
        return true;
    }

    return item.children?.some((child) => isShellNavItemActive(child, pathname)) ?? false;
}

export function collectExpandedIds(items: ShellNavItem[], pathname: string, expanded = new Set<string>()): Set<string> {
    for (const item of items) {
        if (!item.children?.length) {
            continue;
        }

        if (item.children.some((child) => isShellNavItemActive(child, pathname))) {
            expanded.add(item.id);
            collectExpandedIds(item.children, pathname, expanded);
        }
    }

    return expanded;
}

export function buildHorizontalNavigation(sections: ShellNavSection[]): ShellNavItem[] {
    const flattenedItems: ShellNavItem[] = [];
    for (const section of sections) {
        flattenedItems.push(...section.items);
    }
    return flattenedItems;
}
