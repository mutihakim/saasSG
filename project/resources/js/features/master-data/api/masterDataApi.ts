import axios from 'axios';

import { Category, Currency, MasterDataModule, Tag, Uom } from '../types';

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

export async function fetchCategories(tenantRoute: TenantRouteLike, module?: MasterDataModule): Promise<Category[]> {
    const params = module ? { module } : undefined;
    const res = await axios.get(tenantRoute.apiTo('/master/categories'), { params });
    const payload = res.data?.data;

    return toArray<Category>(payload?.categories ?? payload);
}

export async function deleteCategory(tenantRoute: TenantRouteLike, id: number, rowVersion?: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/categories/${id}`), {
        data: rowVersion == null ? undefined : { row_version: rowVersion },
    });
}

export async function fetchCurrencies(tenantRoute: TenantRouteLike): Promise<Currency[]> {
    const res = await axios.get(tenantRoute.apiTo('/master/currencies'));
    return toArray<Currency>(res.data?.data ?? res.data);
}

export async function deleteCurrency(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/currencies/${id}`));
}

export async function fetchTags(tenantRoute: TenantRouteLike): Promise<Tag[]> {
    const res = await axios.get(tenantRoute.apiTo('/master/tags'));
    const payload = res.data?.data;

    return toArray<Tag>(payload?.tags ?? payload);
}

export async function deleteTag(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/tags/${id}`));
}

export async function fetchUom(tenantRoute: TenantRouteLike): Promise<Uom[]> {
    const res = await axios.get(tenantRoute.apiTo('/master/uom'));
    return toArray<Uom>(res.data?.data ?? res.data);
}

export async function deleteUom(tenantRoute: TenantRouteLike, id: number): Promise<void> {
    await axios.delete(tenantRoute.apiTo(`/master/uom/${id}`));
}
