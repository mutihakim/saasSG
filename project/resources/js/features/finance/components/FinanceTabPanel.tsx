import React, { Suspense } from "react";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceDeleteTarget, FinanceLimits, FinanceMember, FinancePermissions, FinanceTransaction } from "../types";

import TransactionsTab from "./TransactionsTab";
import { MainTab, MoreView } from "./pwa/types";

// LAZY: Non-default tab components (loaded on-demand)
const StatsTab = React.lazy(() => import("./StatsTab"));
const MoreTab = React.lazy(() => import("./MoreTab"));

// Loading fallback component
const TabLoadingFallback = () => (
    <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Memuat...</div>
    </div>
);

type Props = {
    activeTab: MainTab;
    moreView: MoreView;
    setMoreView: React.Dispatch<React.SetStateAction<MoreView>>;
    defaultCurrency: string;
    transactions: FinanceTransaction[];
    showTransferHint: boolean;
    focusedTransactionId: string | null;
    transactionsMeta: { hasMore: boolean };
    loadingMoreTransactions: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    openCreateFromGroupedTransaction: (transaction: FinanceTransaction | null, options?: { duplicate?: boolean }) => void;
    onTransactionClick: (transaction: FinanceTransaction) => void;
    setDeleteTarget: React.Dispatch<React.SetStateAction<FinanceDeleteTarget | null>>;
    setDeleteTargetType: React.Dispatch<React.SetStateAction<"transaction" | "transaction_group" | "account" | "budget">>;
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    statsMetric: "expense" | "income";
    setStatsMetric: React.Dispatch<React.SetStateAction<"expense" | "income">>;
    categoryBreakdown: Array<{ name: string; amount: number }>;
    categoryChartOptions: ApexCharts.ApexOptions;
    categoryChartSeries: number[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    categories: FinanceCategory[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    permissions: FinancePermissions;
    canManageFinanceStructures: boolean;
    budgetCreateDisabled: boolean;
    limits: FinanceLimits;
    totalAssets: number;
    totalLiabilities: number;
    setSelectedBudget: React.Dispatch<React.SetStateAction<FinanceBudget | null>>;
    setBudgetModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const FinanceTabPanel = ({
    activeTab,
    moreView,
    setMoreView,
    defaultCurrency,
    transactions,
    showTransferHint,
    focusedTransactionId,
    transactionsMeta,
    loadingMoreTransactions,
    loadMoreRef,
    openCreateFromGroupedTransaction,
    onTransactionClick,
    setDeleteTarget,
    setDeleteTargetType,
    setDeleteModal,
    statsMetric,
    setStatsMetric,
    categoryBreakdown,
    categoryChartOptions,
    categoryChartSeries,
    accounts,
    budgets,
    categories,
    members,
    activeMemberId,
    permissions,
    canManageFinanceStructures,
    budgetCreateDisabled,
    limits,
    totalAssets: _totalAssets,
    totalLiabilities: _totalLiabilities,
    setSelectedBudget,
    setBudgetModal,
}: Props) => {
    if (activeTab === "transactions") {
        return (
            <TransactionsTab
                transactions={transactions}
                defaultCurrency={defaultCurrency}
                showTransferHint={showTransferHint}
                selectedTransactionId={focusedTransactionId}
                hasMore={transactionsMeta.hasMore}
                isLoadingMore={loadingMoreTransactions}
                loadMoreRef={loadMoreRef}
                onAddItemToGroup={openCreateFromGroupedTransaction}
                onDeleteGroup={(group) => {
                    setDeleteTarget(group as FinanceDeleteTarget);
                    setDeleteTargetType("transaction_group");
                    setDeleteModal(true);
                }}
                onTransactionClick={onTransactionClick}
            />
        );
    }

    if (activeTab === "stats") {
        return (
            <Suspense fallback={<TabLoadingFallback />}>
                <StatsTab
                    statsMetric={statsMetric}
                    onMetricChange={setStatsMetric}
                    categoryBreakdown={categoryBreakdown}
                    categoryChartOptions={categoryChartOptions}
                    categoryChartSeries={categoryChartSeries}
                    accounts={accounts}
                    budgets={budgets}
                    categories={categories}
                    members={members}
                />
            </Suspense>
        );
    }

    if (activeTab === "budget") {
        return (
            <Suspense fallback={<TabLoadingFallback />}>
                <MoreTab
                    moreView="budgets"
                    budgets={budgets}
                    accounts={accounts}
                    categories={categories}
                    members={members}
                    defaultCurrency={defaultCurrency}
                    activeMemberId={activeMemberId}
                    permissions={{ manageShared: permissions.manageShared }}
                    canManageFinanceStructures={canManageFinanceStructures}
                    budgetCreateDisabled={budgetCreateDisabled}
                    limits={limits}
                    onChangeView={setMoreView}
                    onCreateBudget={() => {
                        setSelectedBudget(null);
                        setBudgetModal(true);
                    }}
                    onEditBudget={(budget) => {
                        setSelectedBudget(budget);
                        setBudgetModal(true);
                    }}
                />
            </Suspense>
        );
    }

    if (activeTab === "report") {
        return (
            <Suspense fallback={<TabLoadingFallback />}>
                <MoreTab
                    moreView="reports"
                    budgets={budgets}
                    accounts={accounts}
                    categories={categories}
                    members={members}
                    defaultCurrency={defaultCurrency}
                    activeMemberId={activeMemberId}
                    permissions={{ manageShared: permissions.manageShared }}
                    canManageFinanceStructures={canManageFinanceStructures}
                    budgetCreateDisabled={budgetCreateDisabled}
                    limits={limits}
                    onChangeView={setMoreView}
                    onCreateBudget={() => {
                        setSelectedBudget(null);
                        setBudgetModal(true);
                    }}
                    onEditBudget={(budget) => {
                        setSelectedBudget(budget);
                        setBudgetModal(true);
                    }}
                />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<TabLoadingFallback />}>
            <MoreTab
                moreView={moreView}
                budgets={budgets}
                accounts={accounts}
                categories={categories}
                members={members}
                defaultCurrency={defaultCurrency}
                activeMemberId={activeMemberId}
                permissions={{ manageShared: permissions.manageShared }}
                canManageFinanceStructures={canManageFinanceStructures}
                budgetCreateDisabled={budgetCreateDisabled}
                limits={limits}
                onChangeView={setMoreView}
                onCreateBudget={() => {
                    setSelectedBudget(null);
                    setBudgetModal(true);
                }}
                onEditBudget={(budget) => {
                    setSelectedBudget(budget);
                    setBudgetModal(true);
                }}
            />
        </Suspense>
    );
};

export default FinanceTabPanel;
