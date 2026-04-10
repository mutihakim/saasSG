import { Link } from "@inertiajs/react";
import axios from "axios";
import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";



import FinanceTabPanel from "./components/FinanceTabPanel";
import FinanceTopbar from "./components/pwa/FinanceTopbar";
import { useFinanceData } from "./hooks/useFinanceData";
import { useFinanceDeleteFlow } from "./hooks/useFinanceDeleteFlow";
import { useFinanceDerivedMetrics } from "./hooks/useFinanceDerivedMetrics";
import { useFinanceFilters } from "./hooks/useFinanceFilters";
import { useFinanceListSync } from "./hooks/useFinanceListSync";
import { useFinancePageState } from "./hooks/useFinancePageState";
import { useFinanceTransactionEntry } from "./hooks/useFinanceTransactionEntry";
import { useFinanceWhatsappIntent } from "./hooks/useFinanceWhatsappIntent";
import { FinancePageProps, FinanceTransaction } from "./types";

import { useTenantRoute } from "@/core/config/routes";
import { shiftMonthValue } from "@/core/constants/month";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const FinanceDialogs = React.lazy(() => import("./components/FinanceDialogs"));

const ReportsPage = ({
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    members,
    accounts: seededAccounts,
    budgets: seededBudgets,
    wallets: seededPockets,
    transferDestinationPockets,
    activeMemberId,
    permissions,
    walletSubscribed,
    limits,
    financeRoute,
}: FinancePageProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const activeSection = "reports";
    const page = useFinancePageState(financeRoute?.initial_tab ?? "report");
    const hasLoadedFinanceRef = useRef(false);
    const detailRequestRef = useRef(0);

    const { filters, setFilters, draftFilters, setDraftFilters, apiParams } = useFinanceFilters({
        activeMemberId,
        canManageShared: permissions.manageShared,
    });

    const {
        transactions,
        setTransactions,
        accounts,
        setAccounts,
        budgets,
        setBudgets,
        pockets,
        loading,
        errorState,
        transactionsMeta,
        loadingMoreTransactions,
        refreshFinanceSideData,
        loadFinance,
        fetchAccounts,
        fetchBudgets,
        fetchPockets,
    } = useFinanceData({
        seededAccounts,
        seededBudgets,
        seededPockets,
        _walletSubscribed: walletSubscribed,
        activeSection,
        filters,
        apiParams,
        tenantRoute,
        loadErrorMessage: t("finance.notifications.transaction_load_failed"),
        preloaded: financeRoute?.preloaded,
    });

    const clearWhatsappQuery = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("source");
        url.searchParams.delete("action");
        url.searchParams.delete("intent");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }, []);

    useEffect(() => {
        const isFirstLoad = !hasLoadedFinanceRef.current;
        void loadFinance({
            preserveTransactions: !isFirstLoad,
            silentSummary: !isFirstLoad,
            silentLoading: !isFirstLoad,
        }).then(() => {
            hasLoadedFinanceRef.current = true;
        });
    }, [loadFinance]);

    const shouldMountDialogs = Boolean(
        page.deleteModal
        || page.showDetailSheet
        || page.transactionModal
        || page.batchEntryModal
        || page.batchModal
        || page.transferModal
        || page.budgetModal
        || page.showFilters,
    );

    useFinanceWhatsappIntent({
        activeMemberId,
        defaultCurrency,
        tenantRoute,
        clearWhatsappQuery,
        setBatchDraft: page.setBatchDraft,
        setBatchModal: page.setBatchModal,
        setTransactionDraft: page.setTransactionDraft,
        setTransactionDraftMeta: page.setTransactionDraftMeta,
        setSelectedTransaction: page.setSelectedTransaction,
        setTransactionPresetType: page.setTransactionPresetType,
        setTransactionModal: page.setTransactionModal,
    });

    const transactionEntry = useFinanceTransactionEntry({
        activeMemberId,
        defaultCurrency,
        selectedTransaction: page.selectedTransaction,
        setFocusedTransactionId: page.setFocusedTransactionId,
        setShowDetailSheet: page.setShowDetailSheet,
        setTransactionPresetType: page.setTransactionPresetType,
        setTransactionGroupLock: page.setTransactionGroupLock,
        setTransactionModal: page.setTransactionModal,
        setSelectedTransaction: page.setSelectedTransaction,
        setTransactionDraft: page.setTransactionDraft,
        setTransactionDraftMeta: page.setTransactionDraftMeta,
        setShowComposer: page.setShowComposer,
        setBatchEntryModal: page.setBatchEntryModal,
        setTransferModal: page.setTransferModal,
    });

    const listSync = useFinanceListSync({
        filters,
        setTransactions,
        setAccounts,
        setBudgets,
        focusTransactionRow: transactionEntry.focusTransactionRow,
        setSelectedTransaction: page.setSelectedTransaction,
        setFocusedTransactionId: page.setFocusedTransactionId,
    });

    const metrics = useFinanceDerivedMetrics({
        accounts,
        budgets,
        transactions,
        statsMetric: page.statsMetric,
        filters,
        members,
        permissions,
        limits,
        defaultCurrency,
        t,
    });

    const handleDelete = useFinanceDeleteFlow({
        deleteTarget: page.deleteTarget,
        deleteTargetType: page.deleteTargetType,
        tenantRoute,
        refreshFinanceSideData,
        selectedTransaction: page.selectedTransaction,
        removeTransactionFromList: listSync.removeTransactionFromList,
        removeTransactionGroupFromList: listSync.removeTransactionGroupFromList,
        removeAccountFromList: listSync.removeAccountFromList,
        removeBudgetFromList: listSync.removeBudgetFromList,
        setDeleteModal: page.setDeleteModal,
        setIsDeleting: page.setIsDeleting,
        setShowDetailSheet: page.setShowDetailSheet,
        setSelectedTransaction: page.setSelectedTransaction,
        setSelectedAccount: page.setSelectedAccount,
        setSelectedBudget: page.setSelectedBudget,
        t,
    });

    const handleTransactionClick = useCallback((transaction: FinanceTransaction) => {
        detailRequestRef.current += 1;
        const requestId = detailRequestRef.current;

        page.setFocusedTransactionId(String(transaction.id));
        page.setSelectedTransaction(transaction);
        page.setShowDetailSheet(true);

        void axios
            .get(tenantRoute.apiTo(`/finance/transactions/${transaction.id}`))
            .then((response) => {
                if (detailRequestRef.current !== requestId) {
                    return;
                }

                const hydrated = response.data?.data?.transaction;
                if (hydrated) {
                    page.setSelectedTransaction(hydrated);
                }
            })
            .catch(() => {
                // Keep the list payload if detail hydration fails.
            });
    }, [page, tenantRoute]);

    const ensureTransactionDialogData = useCallback(async (options?: {
        includeAccounts?: boolean;
        includeBudgets?: boolean;
        includePockets?: boolean;
    }) => {
        const promises: Promise<unknown>[] = [];

        if (options?.includeAccounts ?? true) {
            promises.push(fetchAccounts());
        }

        if (options?.includeBudgets ?? true) {
            promises.push(fetchBudgets(filters.month));
        }

        if (options?.includePockets ?? true) {
            promises.push(fetchPockets());
        }

        await Promise.all(promises);
    }, [fetchAccounts, fetchBudgets, fetchPockets, filters.month]);

    const handleOpenFilters = useCallback(() => {
        void ensureTransactionDialogData({ includeAccounts: true, includeBudgets: false, includePockets: false })
            .then(() => {
                page.setShowFilters(true);
            });
    }, [ensureTransactionDialogData, page]);

    const handleOpenCreateFromGroupedTransaction = useCallback((transaction: FinanceTransaction | null, options?: {
        duplicate?: boolean;
    }) => {
        void ensureTransactionDialogData().then(() => {
            transactionEntry.openCreateFromGroupedTransaction(transaction, options);
        });
    }, [ensureTransactionDialogData, transactionEntry]);

    const handleEditFromDetailSheet = useCallback(() => {
        void ensureTransactionDialogData().then(() => {
            transactionEntry.editFromDetailSheet();
        });
    }, [ensureTransactionDialogData, transactionEntry]);

    return (
        <FinanceShellLayout
            activeSection="reports"
            periodMonth={filters.month}
            topbar={(
                <FinanceTopbar
                    title={financeRoute?.title ?? (page.activeTab === "report" ? t("finance.reports.title") : t("finance.pwa.headers.stats"))}
                    subtitle={metrics.subtitle}
                    searchOpen={page.searchOpen}
                    draftSearch={draftFilters.search}
                    onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                    onDraftSearchChange={(value) => setDraftFilters((prev) => ({ ...prev, search: value }))}
                    onApplySearch={() => setFilters((prev) => ({ ...prev, search: draftFilters.search }))}
                    onOpenFilter={handleOpenFilters}
                    onPrevMonth={() => {
                        const next = shiftMonthValue(filters.month, -1);
                        setDraftFilters((prev) => ({ ...prev, month: next }));
                        setFilters((prev) => ({ ...prev, month: next, use_custom_range: false }));
                    }}
                    onNextMonth={() => {
                        const next = shiftMonthValue(filters.month, 1);
                        setDraftFilters((prev) => ({ ...prev, month: next }));
                        setFilters((prev) => ({ ...prev, month: next, use_custom_range: false }));
                    }}
                    filterOwnerLabel={metrics.ownerLabel}
                    filterKindLabel={metrics.kindLabel}
                />
            )}
        >
            <>
                {shouldMountDialogs ? (
                    <Suspense fallback={null}>
                        <FinanceDialogs
                            deleteModal={page.deleteModal}
                            isDeleting={page.isDeleting}
                            deleteTargetType={page.deleteTargetType}
                            deleteTarget={page.deleteTarget}
                            handleDelete={handleDelete}
                            setDeleteModal={page.setDeleteModal}
                            showDetailSheet={page.showDetailSheet}
                            selectedTransaction={page.selectedTransaction}
                            defaultCurrency={defaultCurrency}
                            closeDetailSheet={transactionEntry.closeDetailSheet}
                            editFromDetailSheet={handleEditFromDetailSheet}
                            openCreateFromGroupedTransaction={handleOpenCreateFromGroupedTransaction}
                            permissions={permissions}
                            setDeleteTarget={page.setDeleteTarget}
                            setDeleteTargetType={page.setDeleteTargetType}
                            setSelectedTransaction={page.setSelectedTransaction}
                            setShowDetailSheet={page.setShowDetailSheet}
                            transactionModal={page.transactionModal}
                            setTransactionModal={page.setTransactionModal}
                            setTransactionDraft={page.setTransactionDraft}
                            setTransactionDraftMeta={page.setTransactionDraftMeta}
                            setTransactionGroupLock={page.setTransactionGroupLock}
                            clearWhatsappQuery={clearWhatsappQuery}
                            transactionDraft={page.transactionDraft}
                            transactionDraftMeta={page.transactionDraftMeta}
                            transactionGroupLock={page.transactionGroupLock}
                            categories={categories}
                            currencies={currencies}
                            paymentMethods={paymentMethods}
                            accounts={accounts}
                            budgets={budgets}
                            pockets={pockets}
                            transferDestinationPockets={transferDestinationPockets}
                            members={members}
                            activeMemberId={activeMemberId}
                            walletSubscribed={walletSubscribed}
                            transactionPresetType={page.transactionPresetType}
                            upsertTransactionInList={listSync.upsertTransactionInList}
                            refreshFinanceSideData={refreshFinanceSideData}
                            tenantRoute={tenantRoute}
                            batchEntryModal={page.batchEntryModal}
                            setBatchEntryModal={page.setBatchEntryModal}
                            batchModal={page.batchModal}
                            setBatchModal={page.setBatchModal}
                            batchDraft={page.batchDraft}
                            setBatchDraft={page.setBatchDraft}
                            transferModal={page.transferModal}
                            setTransferModal={page.setTransferModal}
                            budgetModal={page.budgetModal}
                            setBudgetModal={page.setBudgetModal}
                            selectedBudget={page.selectedBudget}
                            setSelectedBudget={page.setSelectedBudget}
                            upsertBudgetInList={listSync.upsertBudgetInList}
                            showFilters={page.showFilters}
                            setShowFilters={page.setShowFilters}
                            draftFilters={draftFilters}
                            setDraftFilters={setDraftFilters}
                            setFilters={setFilters}
                            categoriesForFilters={categories}
                        />
                    </Suspense>
                ) : null}

                {!errorState && !loading && (
                    <>
                        <div className="d-flex gap-2 mb-3">
                            <Link
                                href="/finance/reports?view=stats"
                                className={`btn flex-fill rounded-pill ${page.activeTab === "stats" ? "btn-info text-white" : "btn-light"}`}
                            >
                                {t("finance.pwa.tabs.stats")}
                            </Link>
                            <Link
                                href="/finance/reports?view=report"
                                className={`btn flex-fill rounded-pill ${page.activeTab === "report" ? "btn-info text-white" : "btn-light"}`}
                            >
                                {t("finance.pwa.tabs.report")}
                            </Link>
                        </div>

                        <FinanceTabPanel
                            activeTab={page.activeTab}
                            moreView={page.moreView}
                            setMoreView={page.setMoreView}
                            defaultCurrency={defaultCurrency}
                            transactions={transactions}
                            showTransferHint={false}
                            focusedTransactionId={page.focusedTransactionId}
                            transactionsMeta={transactionsMeta}
                            loadingMoreTransactions={loadingMoreTransactions}
                            loadMoreRef={page.loadMoreRef}
                            openCreateFromGroupedTransaction={handleOpenCreateFromGroupedTransaction}
                            onTransactionClick={handleTransactionClick}
                            setDeleteTarget={page.setDeleteTarget}
                            setDeleteTargetType={page.setDeleteTargetType}
                            setDeleteModal={page.setDeleteModal}
                            statsMetric={page.statsMetric}
                            setStatsMetric={page.setStatsMetric}
                            categoryBreakdown={metrics.categoryBreakdown}
                            categoryChartOptions={metrics.categoryChartOptions}
                            categoryChartSeries={metrics.categoryChartSeries}
                            accounts={accounts}
                            budgets={budgets}
                            categories={categories}
                            members={members}
                            activeMemberId={activeMemberId}
                            permissions={permissions}
                            canManageFinanceStructures={metrics.canManageFinanceStructures}
                            budgetCreateDisabled={metrics.budgetCreateDisabled}
                            limits={limits}
                            totalAssets={metrics.totalAssets}
                            totalLiabilities={metrics.totalLiabilities}
                            setSelectedBudget={page.setSelectedBudget}
                            setBudgetModal={page.setBudgetModal}
                        />
                    </>
                )}
            </>
        </FinanceShellLayout>
    );
};

export default ReportsPage;
