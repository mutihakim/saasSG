import { useCallback } from 'react';


import {
    deleteCategory,
    deleteCategories,
    deleteCurrency,
    deleteCurrencies,
    deleteTag,
    deleteUom,
    deleteUoms,
    fetchCategories,
    fetchCurrencies,
    fetchTags,
    fetchUom,
} from '../api/masterDataApi';
import { MasterDataModule, SortDirection } from '../types';

import { useTenantRoute } from '@/core/config/routes';

export function useMasterData() {
    const tenantRoute = useTenantRoute();

    const refreshCategories = useCallback(
        (options?: { name?: string; description?: string; modules?: MasterDataModule[]; subTypes?: string[]; statuses?: Array<"active" | "inactive">; page?: number; sortBy?: string; sortDirection?: SortDirection; rootsOnly?: boolean; excludeChildren?: boolean }) => fetchCategories(tenantRoute, options),
        [tenantRoute]
    );

    const removeCategory = useCallback(
        (id: number, rowVersion?: number) => deleteCategory(tenantRoute, id, rowVersion),
        [tenantRoute]
    );

    const removeCategories = useCallback(
        (ids: number[]) => deleteCategories(tenantRoute, ids),
        [tenantRoute]
    );

    const refreshCurrencies = useCallback(
        (options?: { code?: string; name?: string; symbol?: string; symbolPositions?: string[]; statuses?: Array<"active" | "inactive">; page?: number; sortBy?: string; sortDirection?: SortDirection }) => fetchCurrencies(tenantRoute, options),
        [tenantRoute]
    );
    const removeCurrency = useCallback((id: number) => deleteCurrency(tenantRoute, id), [tenantRoute]);
    const removeCurrencies = useCallback((ids: number[]) => deleteCurrencies(tenantRoute, ids), [tenantRoute]);

    const refreshTags = useCallback(
        (options?: { name?: string; usage?: string; page?: number; sortBy?: string; sortDirection?: SortDirection }) => fetchTags(tenantRoute, options),
        [tenantRoute]
    );
    const removeTag = useCallback((id: number) => deleteTag(tenantRoute, id), [tenantRoute]);

    const refreshUom = useCallback(
        (options?: { code?: string; name?: string; abbreviation?: string; dimensionTypes?: string[]; statuses?: Array<"active" | "inactive">; baseFactor?: string; page?: number; sortBy?: string; sortDirection?: SortDirection }) => fetchUom(tenantRoute, options),
        [tenantRoute]
    );
    const removeUom = useCallback((id: number) => deleteUom(tenantRoute, id), [tenantRoute]);
    const removeUoms = useCallback((ids: number[]) => deleteUoms(tenantRoute, ids), [tenantRoute]);

    return {
        refreshCategories,
        removeCategory,
        removeCategories,
        refreshCurrencies,
        removeCurrency,
        removeCurrencies,
        refreshTags,
        removeTag,
        refreshUom,
        removeUom,
        removeUoms,
    };
}
