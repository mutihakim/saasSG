import React from "react";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceDeleteTarget, FinanceFilterDraft, FinanceLimits, FinanceMember, FinancePermissions, FinancePocket, FinanceTransaction } from "../types";

import FinanceSummaryStrip from "./FinanceSummaryStrip";
import FinanceTabPanel from "./FinanceTabPanel";
import FinanceBottomNav from "./pwa/FinanceBottomNav";
import FinanceComposerFab from "./pwa/FinanceComposerFab";
import FinanceTopbar from "./pwa/FinanceTopbar";
import { MainTab, MoreView, SURFACE_BG, TransactionType } from "./pwa/types";

type Props = {
    activeTab: MainTab;
    setActiveTab: React.Dispatch<React.SetStateAction<MainTab>>;
    moreView: MoreView;
    setMoreView: React.Dispatch<React.SetStateAction<MoreView>>;
    showComposer: boolean;
    setShowComposer: React.Dispatch<React.SetStateAction<boolean>>;
    permissions: FinancePermissions;
    subtitle: string;
    searchOpen: boolean;
    setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
    draftFilters: FinanceFilterDraft;
    setDraftFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    setFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    ownerLabel?: string | null;
    kindLabel?: string | null;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    errorState: string | null;
    loading: boolean;
    summaryLoading: boolean;
    loadFinance: () => Promise<unknown>;
    summary?: {
        total_income_base?: number;
        total_expense_base?: number;
        balance_base?: number;
    } | null;
    defaultCurrency: string;
    pockets: FinancePocket[];
    transactions: FinanceTransaction[];
    showTransferHint: boolean;
    focusedTransactionId: string | null;
    transactionsMeta: { hasMore: boolean };
    loadingMoreTransactions: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    openCreateFromGroupedTransaction: (transaction: FinanceTransaction | null, options?: { duplicate?: boolean }) => void;
    setDeleteTarget: React.Dispatch<React.SetStateAction<FinanceDeleteTarget | null>>;
    setDeleteTargetType: React.Dispatch<React.SetStateAction<"transaction" | "transaction_group" | "account" | "budget">>;
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setFocusedTransactionId: React.Dispatch<React.SetStateAction<string | null>>;
    setShowDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
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
    canManageFinanceStructures: boolean;
    budgetCreateDisabled: boolean;
    limits: FinanceLimits;
    totalAssets: number;
    totalLiabilities: number;
    setSelectedBudget: React.Dispatch<React.SetStateAction<FinanceBudget | null>>;
    setBudgetModal: React.Dispatch<React.SetStateAction<boolean>>;
    openNewTransaction: (type: TransactionType | "bulk") => void;
    t: (key: string) => string;
};

const FinancePageContent = ({
    activeTab,
    setActiveTab,
    moreView,
    setMoreView,
    showComposer,
    setShowComposer,
    permissions,
    subtitle,
    searchOpen,
    setSearchOpen,
    draftFilters,
    setDraftFilters,
    setFilters,
    onPrevMonth,
    onNextMonth,
    ownerLabel,
    kindLabel,
    setShowFilters,
    errorState,
    loading,
    summaryLoading,
    loadFinance,
    summary,
    defaultCurrency,
    pockets,
    transactions,
    showTransferHint,
    focusedTransactionId,
    transactionsMeta,
    loadingMoreTransactions,
    loadMoreRef,
    openCreateFromGroupedTransaction,
    setDeleteTarget,
    setDeleteTargetType,
    setDeleteModal,
    setSelectedTransaction,
    setFocusedTransactionId,
    setShowDetailSheet,
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
    canManageFinanceStructures,
    budgetCreateDisabled,
    limits,
    totalAssets,
    totalLiabilities,
    setSelectedBudget,
    setBudgetModal,
    openNewTransaction,
    t,
}: Props) => (
    <div style={{ minHeight: "100vh" }}>
        <div className="position-relative d-flex flex-column" style={{ minHeight: "100vh", background: SURFACE_BG }}>
            <FinanceTopbar
                title={activeTab === "budget"
                    ? t("finance.budgets.title")
                    : activeTab === "report"
                        ? t("finance.reports.title")
                        : t(`finance.pwa.headers.${activeTab}`)}
                subtitle={subtitle}
                searchOpen={searchOpen}
                draftSearch={draftFilters.search}
                onToggleSearch={() => setSearchOpen((prev) => !prev)}
                onDraftSearchChange={(value) => setDraftFilters((prev) => ({ ...prev, search: value }))}
                onApplySearch={() => setFilters((prev) => ({ ...prev, search: draftFilters.search }))}
                onOpenFilter={() => setShowFilters(true)}
                onPrevMonth={onPrevMonth}
                onNextMonth={onNextMonth}
                filterOwnerLabel={ownerLabel}
                filterKindLabel={kindLabel}
            />

            <div
                className="flex-grow-1 px-3 pt-3"
                style={{
                    paddingBottom: activeTab === "transactions" && permissions.create
                        ? "calc(180px + env(safe-area-inset-bottom))"
                        : "calc(128px + env(safe-area-inset-bottom))",
                }}
            >
                <FinanceSummaryStrip
                    errorState={errorState}
                    loading={loading}
                    summaryLoading={summaryLoading}
                    loadFinance={loadFinance}
                    summary={summary}
                    defaultCurrency={defaultCurrency}
                    filters={draftFilters}
                    setDraftFilters={setDraftFilters}
                    setFilters={setFilters}
                    pockets={pockets}
                    t={t}
                />

                {!errorState && !loading && (
                    <FinanceTabPanel
                        activeTab={activeTab}
                        moreView={moreView}
                        setMoreView={setMoreView}
                        defaultCurrency={defaultCurrency}
                        transactions={transactions}
                        showTransferHint={showTransferHint}
                        focusedTransactionId={focusedTransactionId}
                        transactionsMeta={transactionsMeta}
                        loadingMoreTransactions={loadingMoreTransactions}
                        loadMoreRef={loadMoreRef}
                        openCreateFromGroupedTransaction={openCreateFromGroupedTransaction}
                        setDeleteTarget={setDeleteTarget}
                        setDeleteTargetType={setDeleteTargetType}
                        setDeleteModal={setDeleteModal}
                        setSelectedTransaction={setSelectedTransaction}
                        setFocusedTransactionId={setFocusedTransactionId}
                        setShowDetailSheet={setShowDetailSheet}
                        statsMetric={statsMetric}
                        setStatsMetric={setStatsMetric}
                        categoryBreakdown={categoryBreakdown}
                        categoryChartOptions={categoryChartOptions}
                        categoryChartSeries={categoryChartSeries}
                        accounts={accounts}
                        budgets={budgets}
                        categories={categories}
                        members={members}
                        activeMemberId={activeMemberId}
                        permissions={permissions}
                        canManageFinanceStructures={canManageFinanceStructures}
                        budgetCreateDisabled={budgetCreateDisabled}
                        limits={limits}
                        totalAssets={totalAssets}
                        totalLiabilities={totalLiabilities}
                        setSelectedBudget={setSelectedBudget}
                        setBudgetModal={setBudgetModal}
                    />
                )}
            </div>

            {permissions.create && (
                <FinanceComposerFab
                    showComposer={showComposer}
                    onToggle={() => setShowComposer((prev) => !prev)}
                    onSelect={openNewTransaction}
                />
            )}

            <FinanceBottomNav
                activeTab={activeTab}
                onChangeTab={(tab) => {
                    setActiveTab(tab);
                }}
            />
        </div>
    </div>
);

export default FinancePageContent;
