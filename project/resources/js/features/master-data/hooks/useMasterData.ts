import { useCallback } from 'react';


import {
    deleteCategory,
    deleteCurrency,
    deleteTag,
    deleteUom,
    fetchCategories,
    fetchCurrencies,
    fetchTags,
    fetchUom,
} from '../api/masterDataApi';
import { MasterDataModule } from '../types';

import { useTenantRoute } from '@/core/config/routes';

export function useMasterData() {
    const tenantRoute = useTenantRoute();

    const refreshCategories = useCallback(
        (module?: MasterDataModule) => fetchCategories(tenantRoute, module),
        [tenantRoute]
    );

    const removeCategory = useCallback(
        (id: number, rowVersion?: number) => deleteCategory(tenantRoute, id, rowVersion),
        [tenantRoute]
    );

    const refreshCurrencies = useCallback(() => fetchCurrencies(tenantRoute), [tenantRoute]);
    const removeCurrency = useCallback((id: number) => deleteCurrency(tenantRoute, id), [tenantRoute]);

    const refreshTags = useCallback(() => fetchTags(tenantRoute), [tenantRoute]);
    const removeTag = useCallback((id: number) => deleteTag(tenantRoute, id), [tenantRoute]);

    const refreshUom = useCallback(() => fetchUom(tenantRoute), [tenantRoute]);
    const removeUom = useCallback((id: number) => deleteUom(tenantRoute, id), [tenantRoute]);

    return {
        refreshCategories,
        removeCategory,
        refreshCurrencies,
        removeCurrency,
        refreshTags,
        removeTag,
        refreshUom,
        removeUom,
    };
}
