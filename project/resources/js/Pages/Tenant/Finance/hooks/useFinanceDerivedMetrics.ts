import { useMemo } from "react";

import { toMonthLabel } from "../components/pwa/types";
import { FinanceAccount, FinanceBudget, FinanceCategoryBreakdownItem, FinanceFilterDraft, FinanceLimits, FinanceMember, FinancePermissions, FinanceTransaction } from "../types";

type Args = {
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    transactions: FinanceTransaction[];
    statsMetric: "expense" | "income";
    filters: FinanceFilterDraft;
    members: FinanceMember[];
    permissions: FinancePermissions;
    limits: FinanceLimits;
    defaultCurrency: string;
    t: (key: string) => string;
};

export const useFinanceDerivedMetrics = ({
    accounts,
    budgets,
    transactions,
    statsMetric,
    filters,
    members,
    permissions,
    limits,
    defaultCurrency,
    t,
}: Args) => {
    const canManageFinanceStructures = permissions.manageShared || permissions.managePrivateStructures;

    const totalAssets = useMemo(
        () => accounts.filter((account) => !["credit_card", "paylater"].includes(account.type)).reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
        [accounts],
    );

    const totalLiabilities = useMemo(
        () => accounts.filter((account) => ["credit_card", "paylater"].includes(account.type)).reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
        [accounts],
    );

    const categoryBreakdown = useMemo<FinanceCategoryBreakdownItem[]>(() => {
        const targetType = statsMetric === "expense" ? "pengeluaran" : "pemasukan";
        const grouped = new Map<string, { name: string; amount: number }>();

        transactions
            .filter((transaction) => transaction.type === targetType)
            .forEach((transaction) => {
                const key = transaction.category?.name || t("finance.shared.uncategorized");
                const current = grouped.get(key) || { name: key, amount: 0 };
                current.amount += Number(transaction.amount_base || 0);
                grouped.set(key, current);
            });

        return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
    }, [statsMetric, t, transactions]);

    const categoryChartOptions: ApexCharts.ApexOptions = useMemo(() => ({
        chart: { type: "donut", toolbar: { show: false } },
        labels: categoryBreakdown.map((item) => item.name),
        legend: { show: false },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        colors: ["#ff7a6b", "#4ba3ff", "#ffbf69", "#7bd389", "#b388eb", "#4ecdc4"],
        plotOptions: { pie: { donut: { size: "72%" } } },
    }), [categoryBreakdown]);

    const categoryChartSeries = useMemo(
        () => categoryBreakdown.map((item) => item.amount),
        [categoryBreakdown],
    );

    const subtitle = useMemo(
        () => filters.use_custom_range ? `${filters.date_from} - ${filters.date_to}` : toMonthLabel(filters.month),
        [filters.date_from, filters.date_to, filters.month, filters.use_custom_range],
    );

    const ownerLabel = useMemo(
        () => filters.owner_member_id
            ? members.find((member) => String(member.id) === filters.owner_member_id)?.full_name
            : permissions.manageShared
                ? t("finance.pwa.scope.all")
                : t("finance.pwa.scope.relevant"),
        [filters.owner_member_id, members, permissions.manageShared, t],
    );

    const kindLabel = useMemo(
        () => filters.transaction_kind !== "all" ? t(`finance.pwa.filters.kind_${filters.transaction_kind}`) : null,
        [filters.transaction_kind, t],
    );

    const accountCreateDisabled = canManageFinanceStructures
        && limits.accounts.limit !== null
        && limits.accounts.limit !== -1
        && accounts.length >= limits.accounts.limit;

    const budgetCreateDisabled = canManageFinanceStructures
        && limits.budgets.limit !== null
        && limits.budgets.limit !== -1
        && budgets.filter((budget) => budget.is_active !== false).length >= limits.budgets.limit;

    return {
        canManageFinanceStructures,
        totalAssets,
        totalLiabilities,
        categoryBreakdown,
        categoryChartOptions,
        categoryChartSeries,
        subtitle,
        ownerLabel,
        kindLabel,
        accountCreateDisabled,
        budgetCreateDisabled,
        defaultCurrency,
    };
};
