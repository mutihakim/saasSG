import axios from "axios";
import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { shiftMonthValue } from "../../../common/month";
import { useTenantRoute } from "../../../common/tenantRoute";

// EAGER: Always needed
import FinancePageContent from "./components/FinancePageContent";
import { useFinanceData } from "./hooks/useFinanceData";
import { useFinanceDeleteFlow } from "./hooks/useFinanceDeleteFlow";
import { useFinanceDerivedMetrics } from "./hooks/useFinanceDerivedMetrics";
import { useFinanceFilters } from "./hooks/useFinanceFilters";
import { useFinanceListSync } from "./hooks/useFinanceListSync";
import { useFinancePageState } from "./hooks/useFinancePageState";
import { useFinanceTransactionEntry } from "./hooks/useFinanceTransactionEntry";
import { useFinanceWhatsappIntent } from "./hooks/useFinanceWhatsappIntent";
import { FinancePageProps, FinanceTransaction } from "./types";

// LAZY: Dialogs only opened on-demand
const FinanceDialogs = React.lazy(() => import("./components/FinanceDialogs"));

const FinanceIndex = ({
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    members,
    accounts: seededAccounts,
    budgets: seededBudgets,
    pockets: seededPockets,
    transferDestinationPockets,
    activeMemberId,
    permissions,
    walletSubscribed,
    limits,
    financeRoute,
}: FinancePageProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const activeSection = financeRoute?.section ?? "transactions";
    const page = useFinancePageState(financeRoute?.initial_tab ?? "transactions");
    const hasLoadedFinanceRef = useRef(false);
    const detailRequestRef = useRef(0);

    const { filters, setFilters, draftFilters, setDraftFilters, apiParams } = useFinanceFilters({
        activeMemberId,
        canManageShared: permissions.manageShared,
    });
    const {
        transactions,
        setTransactions,
        summary,
        accounts,
        setAccounts,
        budgets,
        setBudgets,
        pockets,
        loading,
        summaryLoading,
        errorState,
        transactionsMeta,
        loadingMoreTransactions,
        refreshFinanceSideData,
        loadFinance,
        loadMoreTransactions,
    } = useFinanceData({
        seededAccounts,
        seededBudgets,
        seededPockets,
        walletSubscribed,
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

    useEffect(() => {
        if (page.activeTab !== "transactions" || !transactionsMeta.hasMore || !page.loadMoreRef.current) {
            return;
        }

        const node = page.loadMoreRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                void loadMoreTransactions();
            }
        }, { rootMargin: "240px 0px" });

        observer.observe(node);
        return () => observer.disconnect();
    }, [loadMoreTransactions, page.activeTab, page.loadMoreRef, transactionsMeta.hasMore]);

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

    return (
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
                        editFromDetailSheet={transactionEntry.editFromDetailSheet}
                        openCreateFromGroupedTransaction={transactionEntry.openCreateFromGroupedTransaction}
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

            <FinancePageContent
                activeSection={activeSection}
                activeTab={page.activeTab}
                moreView={page.moreView}
                setMoreView={page.setMoreView}
                showComposer={page.showComposer}
                setShowComposer={page.setShowComposer}
                permissions={permissions}
                title={financeRoute?.title}
                routeViewHref={financeRoute?.section === "reports" ? "/finance/reports" : null}
                subtitle={metrics.subtitle}
                searchOpen={page.searchOpen}
                setSearchOpen={page.setSearchOpen}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                setFilters={setFilters}
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
                ownerLabel={metrics.ownerLabel}
                kindLabel={metrics.kindLabel}
                setShowFilters={page.setShowFilters}
                errorState={errorState}
                loading={loading}
                summaryLoading={summaryLoading}
                loadFinance={loadFinance}
                summary={summary}
                defaultCurrency={defaultCurrency}
                pockets={pockets}
                transactions={transactions}
                showTransferHint={(summary?.transaction_count || 0) > 0
                    && filters.transaction_kind !== "internal_transfer"
                    && !filters.owner_member_id
                    && permissions.manageShared
                    && (summary?.transfer_total_base || 0) > 0}
                focusedTransactionId={page.focusedTransactionId}
                transactionsMeta={transactionsMeta}
                loadingMoreTransactions={loadingMoreTransactions}
                loadMoreRef={page.loadMoreRef}
                openCreateFromGroupedTransaction={transactionEntry.openCreateFromGroupedTransaction}
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
                canManageFinanceStructures={metrics.canManageFinanceStructures}
                budgetCreateDisabled={metrics.budgetCreateDisabled}
                limits={limits}
                totalAssets={metrics.totalAssets}
                totalLiabilities={metrics.totalLiabilities}
                setSelectedBudget={page.setSelectedBudget}
                setBudgetModal={page.setBudgetModal}
                openNewTransaction={transactionEntry.openNewTransaction}
                t={t}
            />
        </>
    );
};

export default FinanceIndex;
