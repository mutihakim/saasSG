import { TFunction } from "i18next";
import { useMemo } from "react";

import { FinanceAccount, FinancePocket } from "../../Finance/types";
import { formatCurrency } from "../components/pwa/types";
import { GroupedWalletAccount, WalletMetricsItem, WalletSummary, WalletWish } from "../types";

type Props = {
    activeTab: "dashboard" | "accounts" | "wishes" | "goals";
    filteredAccounts: FinanceAccount[];
    filteredWallets: FinancePocket[];
    wishes: WalletWish[];
    summary: WalletSummary;
    t: TFunction;
};

const useWalletDerivedMetrics = ({
    activeTab,
    filteredAccounts,
    filteredWallets,
    wishes,
    summary,
    t,
}: Props) => {
    const groupedWallets = useMemo<GroupedWalletAccount[]>(() => filteredAccounts.map((account) => ({
        account,
        wallets: filteredWallets.filter((wallet) => String(wallet.real_account_id) === String(account.id)),
    })), [filteredAccounts, filteredWallets]);

    const systemWalletCount = useMemo(() => filteredWallets.filter((wallet) => wallet.is_system).length, [filteredWallets]);
    const extraWalletCount = filteredWallets.length - systemWalletCount;

    const metrics = useMemo<WalletMetricsItem[]>(() => {
        if (activeTab === "dashboard") {
            return [
                { label: t("wallet.metrics.net_worth"), value: formatCurrency(summary.netWorth), tone: "success" },
                { label: t("wallet.metrics.liquidity_ratio"), value: `${Number(summary.liquidityRatio || 0).toFixed(1)}%`, tone: "info" },
                { label: t("wallet.metrics.debt_ratio"), value: `${Number(summary.debtRatio || 0).toFixed(1)}%`, tone: Number(summary.debtRatio || 0) > 30 ? "warning" : "success" },
            ];
        }

        if (activeTab === "accounts") {
            return [
                { label: t("wallet.metrics.cash_bank"), value: formatCurrency(summary.totalAssets), tone: "success" },
                { label: t("wallet.metrics.liabilities"), value: formatCurrency(summary.totalLiabilities), tone: "warning" },
                { label: t("wallet.metrics.net_worth"), value: formatCurrency(summary.netWorth), tone: "info" },
            ];
        }

        if (activeTab === "wishes") {
            return [
                { label: t("wallet.metrics.wish_total"), value: formatCurrency(wishes.reduce((sum, wish) => sum + Number(wish.estimated_amount || 0), 0)) },
                { label: t("wallet.metrics.wish_approved"), value: String(wishes.filter((wish) => wish.status === "approved").length), tone: "info" },
                { label: t("wallet.metrics.wish_pending"), value: String(wishes.filter((wish) => wish.status === "pending").length), tone: "warning" },
            ];
        }

        return [
            { label: t("wallet.metrics.goal_target"), value: formatCurrency(summary.goalTargetTotal || 0) },
            { label: t("wallet.metrics.goal_current"), value: formatCurrency(summary.goalCurrentTotal || 0), tone: "info" },
            { label: t("wallet.metrics.goal_remaining"), value: formatCurrency(Math.max(Number(summary.goalTargetTotal || 0) - Number(summary.goalCurrentTotal || 0), 0)), tone: "warning" },
        ];
    }, [activeTab, summary, t, wishes]);

    return {
        groupedWallets,
        systemWalletCount,
        extraWalletCount,
        summary,
        metrics,
    };
};

export default useWalletDerivedMetrics;
