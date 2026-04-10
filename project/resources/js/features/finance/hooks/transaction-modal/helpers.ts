import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceWallet } from "../../types";

export const normalizeStringId = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export const formatLocalDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const getCategoryOptionsForType = (categories: FinanceCategory[], type: "pemasukan" | "pengeluaran") =>
    categories.filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === type);

export const isCategoryCompatibleWithType = (
    category: FinanceCategory | undefined | null,
    type: "pemasukan" | "pengeluaran",
) => {
    if (!category) {
        return false;
    }

    return !category.sub_type || category.sub_type === "all" || category.sub_type === type;
};

export const canUseForOwner = (
    item: FinanceAccount | FinanceBudget | FinanceWallet | undefined | null,
    ownerMemberId: string,
) => {
    if (!item) {
        return false;
    }

    if (item.scope === "shared") {
        return true;
    }

    const ownerId = String(ownerMemberId || "");
    if (String(item.owner_member_id || "") === ownerId) {
        return true;
    }

    const accessList = (item.member_access || item.memberAccess || []) as Array<{
        id?: string | number | null;
        can_use?: boolean | number | string;
        can_manage?: boolean | number | string;
        pivot?: {
            can_use?: boolean | number | string;
            can_manage?: boolean | number | string;
        } | null;
    }>;

    const hasManageOrUse = (value: boolean | number | string | undefined) =>
        value === true || value === 1 || value === "1" || value === "true";

    return accessList.some((access) => {
        const accessMemberId = String(access?.id || "");
        if (!ownerId || accessMemberId !== ownerId) {
            return false;
        }

        return (
            hasManageOrUse(access?.can_manage)
            || hasManageOrUse(access?.can_use)
            || hasManageOrUse(access?.pivot?.can_manage)
            || hasManageOrUse(access?.pivot?.can_use)
        );
    });
};

export const findPocketForAccount = (pockets: FinanceWallet[], ownerMemberId: string, accountId?: string | null) => {
    const visiblePockets = pockets.filter((pocket) => canUseForOwner(pocket, ownerMemberId));
    if (accountId) {
        const matched = visiblePockets.find((pocket) => String(pocket.real_account_id) === String(accountId) && pocket.is_active !== false);
        if (matched) {
            return matched;
        }
    }

    return visiblePockets[0] ?? null;
};

export const toPeriodMonth = (value: string) => String(value || "").slice(0, 7);

export const isLiabilityType = (accountType?: string | null) => ["credit_card", "paylater"].includes(String(accountType || ""));

export const transactionDelta = (type: "pemasukan" | "pengeluaran", amount: number) => (type === "pemasukan" ? amount : -amount);
