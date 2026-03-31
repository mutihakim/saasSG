import { usePage } from '@inertiajs/react';

function buildTenantPath(slug: string | undefined, isSuperadmin: boolean, path = ''): string {
    if (!slug) return isSuperadmin ? '/tenants' : '/tenant-access-required';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `//${slug}.appsah.my.id${normalized}`;
}

function tenantSlugFromPath(): string | undefined {
    const match = window.location.hostname.match(/^([^.]+)\.appsah\.my\.id/);
    return match?.[1];
}

export function useTenantRoute() {
    const page = usePage<any>();
    const slug = page.props.currentTenant?.slug ?? tenantSlugFromPath();
    const isSuperadmin = Boolean(page.props.auth?.user?.is_superadmin);

    return {
        to: (path = '') => buildTenantPath(slug, isSuperadmin, path),
        routeTenant: (path = '') => buildTenantPath(slug, isSuperadmin, path),
        apiTo: (path = '') => `/api/v1/tenants/${slug}${path.startsWith('/') ? path : `/${path}`}`,
    };
}
