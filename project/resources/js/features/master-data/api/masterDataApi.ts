import axios from 'axios';

import { Category, Currency, MasterDataModule, PaginatedCollection, PaginationMeta, SortDirection, Tag, Uom } from '../types';

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const normalizePagination = (value: any): PaginationMeta => ({
    current_page: Number(value?.current_page || 1),
    total: Number(value?.total || 0),
    last_page: Number(value?.last_page || 1),
    has_more: Boolean(value?.has_more ?? false),
});

type BaseListParams = {
    page?: number;
    sortBy?: string;
    sortDirection?: SortDirection;
};

type CategoriesParams = BaseListParams & {
    name?: string;
    description?: string;
    modules?: MasterDataModule[];
    subTypes?: string[];
    statuses?: Array<"active" | "inactive">;
    rootsOnly?: boolean;
    excludeChildren?: boolean;
};

type TagsParams = BaseListParams & {
    name?: string;
    usage?: string;
};

type CurrencyParams = BaseListParams & {
    code?: string;
    name?: string;
    symbol?: string;
    symbolPositions?: string[];
    statuses?: Array<"active" | "inactive">;
};

type UomParams = BaseListParams & {
    code?: string;
    name?: string;
    abbreviation?: string;
    dimensionTypes?: string[];
    statuses?: Array<"active" | "inactive">;
    baseFactor?: string;
};

const toPaginatedCollection = <T>(items: unknown, pagination: unknown, stats?: unknown, sort?: unknown): PaginatedCollection<T> => ({
    items: toArray<T>(items),
    pagination: normalizePagination(pagination),
    stats: stats && typeof stats === "object" ? (stats as Record<string, number>) : undefined,
    sort: sort && typeof sort === "object"
        ? {
            by: String((sort as any).by || ""),
            direction: String((sort as any).direction || "asc") === "desc" ? "desc" : "asc",
        }
        : undefined,
});

export async function fetchCategories(tenantRoute: TenantRouteLike, options: CategoriesParams = {}): Promise<PaginatedCollection<Category>> {
    const params = {
        name: options.name,
        description: options.description,
        module: options.modules,
        sub_type: options.subTypes,
        status: options.statuses,
        page: options.page,
        sort_by: options.sortBy,
        sort_direction: options.sortDirection,
        roots_only: options.rootsOnly ? 1 : undefined,
        exclude_children: options.excludeChildren ? 1 : undefined,
    };
    const res = await axios.get(tenantRoute.apiTo('/master/categories'), { params });
    const payload = res.data?.data;

    return toPaginatedCollection<Category>(payload?.categories, payload?.pagination, payload?.stats, payload?.sort);
}

export async function deleteCategory(tenantRoute: TenantRouteLike, id: number, rowVersion?: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/categories/${id}`), {
        data: rowVersion == null ? undefined : { row_version: rowVersion },
    });
}

export async function deleteCategories(tenantRoute: TenantRouteLike, ids: number[]): Promise<any> {
    const res = await axios.delete(tenantRoute.apiTo('/master/categories'), {
        data: { ids },
    });
    return res.data;
}

export async function fetchCurrencies(tenantRoute: TenantRouteLike, options: CurrencyParams = {}): Promise<PaginatedCollection<Currency>> {
    const res = await axios.get(tenantRoute.apiTo('/master/currencies'), {
        params: {
            code: options.code,
            name: options.name,
            symbol: options.symbol,
            symbol_position: options.symbolPositions,
            status: options.statuses,
            page: options.page,
            sort_by: options.sortBy,
            sort_direction: options.sortDirection,
        },
    });
    const payload = res.data?.data;

    return toPaginatedCollection<Currency>(payload?.currencies, payload?.pagination, undefined, payload?.sort);
}

export async function deleteCurrency(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/currencies/${id}`));
}

export async function deleteCurrencies(tenantRoute: TenantRouteLike, ids: number[]): Promise<any> {
    const res = await axios.delete(tenantRoute.apiTo('/master/currencies'), {
        data: { ids },
    });
    return res.data;
}

export async function fetchTags(tenantRoute: TenantRouteLike, options: TagsParams = {}): Promise<PaginatedCollection<Tag>> {
    const res = await axios.get(tenantRoute.apiTo('/master/tags'), {
        params: {
            name: options.name,
            usage: options.usage,
            page: options.page,
            sort_by: options.sortBy,
            sort_direction: options.sortDirection,
        },
    });
    const payload = res.data?.data;

    return toPaginatedCollection<Tag>(payload?.tags, payload?.pagination, undefined, payload?.sort);
}

export async function deleteTag(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/tags/${id}`));
}

export async function fetchUom(tenantRoute: TenantRouteLike, options: UomParams = {}): Promise<PaginatedCollection<Uom>> {
    const res = await axios.get(tenantRoute.apiTo('/master/uom'), {
        params: {
            code: options.code,
            name: options.name,
            abbreviation: options.abbreviation,
            dimension_type: options.dimensionTypes,
            status: options.statuses,
            base_factor: options.baseFactor,
            page: options.page,
            sort_by: options.sortBy,
            sort_direction: options.sortDirection,
        },
    });
    const payload = res.data?.data;

    return toPaginatedCollection<Uom>(payload?.units, payload?.pagination, undefined, payload?.sort);
}

export async function deleteUom(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/uom/${id}`));
}

export async function deleteUoms(tenantRoute: TenantRouteLike, ids: number[]): Promise<any> {
    const res = await axios.delete(tenantRoute.apiTo('/master/uom'), {
        data: { ids },
    });
    return res.data;
}
