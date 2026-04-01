import { usePage } from '@inertiajs/react';

function buildTenantPath(slug: string | undefined, isSuperadmin: boolean, path = ''): string {
    if (!slug) return isSuperadmin ? '/admin/tenants' : '/tenant-access-required';
    const normalized = path.startsWith('/') ? path : `/${path}`;

    // Add /admin prefix for tenant management routes if not already present
    // We keep '/' as is for the Landing/Profile page.
    let finalPath = normalized;
    if (normalized !== '/' && !normalized.startsWith('/admin')) {
        finalPath = `/admin${normalized}`;
    }

    return `//${slug}.appsah.my.id${finalPath}`;
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
