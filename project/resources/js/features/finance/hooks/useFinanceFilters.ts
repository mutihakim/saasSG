import { useMemo, useState } from "react";

import { FinanceFilters } from "../components/pwa/types";

import { currentMonthValue } from "@/core/constants/month";

type UseFinanceFiltersArgs = {
    activeMemberId?: number | null;
    canManageShared: boolean;
};

const todayDate = () => new Date().toISOString().slice(0, 10);
const monthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const buildInitialFilters = ({ activeMemberId, canManageShared }: UseFinanceFiltersArgs): FinanceFilters => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

    return {
        search: params.get("search") || "",
        owner_member_id: params.get("owner_member_id") || (canManageShared ? "" : String(activeMemberId ?? "")),
        bank_account_id: params.get("bank_account_id") || "",
        wallet_id: params.get("wallet_id") || params.get("wallet_id") || "",
        budget_id: params.get("budget_id") || "",
        type: (params.get("type") as any) || "",
        category_id: params.get("category_id") || "",
        transaction_kind: (params.get("transaction_kind") as any) || "all",
        month: params.get("month") || currentMonthValue(),
        date_from: params.get("date_from") || monthStartDate(),
        date_to: params.get("date_to") || todayDate(),
        use_custom_range: params.get("use_custom_range") === "true",
    };
};

export const useFinanceFilters = ({ activeMemberId, canManageShared }: UseFinanceFiltersArgs) => {
    const [filters, setFilters] = useState<FinanceFilters>(() => buildInitialFilters({ activeMemberId, canManageShared }));
    const [draftFilters, setDraftFilters] = useState<FinanceFilters>(() => buildInitialFilters({ activeMemberId, canManageShared }));

    const apiParams = useMemo(() => {
        const params: Record<string, string> = {
            search: filters.search,
            owner_member_id: filters.owner_member_id,
            bank_account_id: filters.bank_account_id,
            wallet_id: filters.wallet_id,
            budget_id: filters.budget_id,
            type: filters.type,
            category_id: filters.category_id,
            transaction_kind: filters.transaction_kind,
        };

        if (filters.use_custom_range) {
            params.date_from = filters.date_from;
            params.date_to = filters.date_to;
        } else {
            params.month = filters.month;
        }

        Object.keys(params).forEach((key) => {
            if (!params[key]) {
                delete params[key];
            }
        });

        return params;
    }, [filters]);

    return {
        filters,
        setFilters,
        draftFilters,
        setDraftFilters,
        apiParams,
    };
};
