import { usePage } from "@inertiajs/react";
import { useMemo } from "react";

function buildTenantPath(slug: string | undefined, isSuperadmin: boolean, path = ""): string {
    if (!slug) return isSuperadmin ? "/admin/tenants" : "/tenant-access-required";
    const normalized = path.startsWith("/") ? path : `/${path}`;

    let finalPath = normalized;
    if (normalized !== "/" && !normalized.startsWith("/admin")) {
        finalPath = `/admin${normalized}`;
    }

    return `//${slug}.sanjo.my.id${finalPath}`;
}

function tenantSlugFromPath(): string | undefined {
    const match = window.location.hostname.match(/^([^.]+)\.sanjo\.my\.id/);
    return match?.[1];
}

export function useTenantRoute() {
    const page = usePage<any>();
    const slug = page.props.currentTenant?.slug ?? tenantSlugFromPath();
    const isSuperadmin = Boolean(page.props.auth?.user?.is_superadmin);

    return useMemo(
        () => ({
            to: (path = "") => buildTenantPath(slug, isSuperadmin, path),
            routeTenant: (path = "") => buildTenantPath(slug, isSuperadmin, path),
            apiTo: (path = "") => `/api/v1/tenants/${slug}${path.startsWith("/") ? path : `/${path}`}`,
        }),
        [slug, isSuperadmin]
    );
}
