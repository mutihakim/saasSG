import axios from "axios";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";



import AccountDialogs from "./components/AccountDialogs";
import FinanceDashboardTab from "./components/FinanceDashboardTab";
import FinanceEntityDialogs from "./components/FinanceEntityDialogs";
import MonthlyReviewWizard from "./components/MonthlyReviewWizard";
import TransactionModal from "./components/TransactionModal";
import TransferModal from "./components/TransferModal";
import FinancePlanningTopbar from "./components/pwa/FinancePlanningTopbar";
import useFinanceOverviewMetrics from "./hooks/useFinanceOverviewMetrics";
import useFinancePlanningState from "./hooks/useFinancePlanningState";
import useFinanceStructuresData from "./hooks/useFinanceStructuresData";
import { FinancePlanningPageProps, FinanceWallet } from "./types";

import { currentMonthValue } from "@/core/constants/month";
import { notify } from "@/core/lib/notify";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const OverviewPage = ({
    accounts: seededAccounts = [],
    wallets: seededPockets = [],
    budgets: seededBudgets = [],
    goals: seededGoals = [],
    wishes: seededWishes = [],
    summary: seededSummary = {} as any,
    monthlyReview: seededMonthlyReview = null as any,
    members,
    currencies,
    categories,
    paymentMethods,
    defaultCurrency,
    activeMemberId,
    walletSubscribed,
    permissions,
    limits: _limits,
    financeRoute,
}: FinancePlanningPageProps) => {
    const { t } = useTranslation();
    const page = useFinancePlanningState(
        seededAccounts[0]?.id ?? null,
        "dashboard"
    );

    const {
        tenantRoute,
        accounts,
        wallets,
        budgets,
        summary: walletSummary,
        syncing,
        filteredGoals,
        filteredWishes,
        monthlyReview,
        syncForTab,
        syncAll,
    } = useFinanceStructuresData({
        seededAccounts,
        seededPockets,
        seededBudgets,
        seededGoals,
        seededWishes,
        seededSummary,
        seededMonthlyReview,
        search: page.search,
        periodMonth: financeRoute?.period_month ?? currentMonthValue(),
        preloaded: financeRoute?.preloaded,
    });

    const { summary } = useFinanceOverviewMetrics({
        activeTab: "dashboard",
        filteredAccounts: accounts,
        filteredWallets: wallets,
        wishes: seededWishes,
        summary: walletSummary,
        t,
    });

    const shouldOpenMonthlyReview = Boolean(financeRoute?.open_monthly_review && monthlyReview);
    const didBootstrapSyncRef = React.useRef(false);

    useEffect(() => {
        if (shouldOpenMonthlyReview) {
            page.setShowMonthlyReviewWizard(true);
        }
    }, [page, shouldOpenMonthlyReview]);

    useEffect(() => {
        const preloaded = financeRoute?.preloaded;
        const shouldPrimeDeferredHome = financeRoute?.section === "home"
            && financeRoute?.payload_strategy === "deferred"
            && !preloaded?.accounts
            && !preloaded?.wallets
            && !preloaded?.goals
            && !preloaded?.wishes
            && !preloaded?.summary
            && !preloaded?.monthly_review;

        if (!shouldPrimeDeferredHome || didBootstrapSyncRef.current) {
            return;
        }

        didBootstrapSyncRef.current = true;
        void syncForTab("dashboard");
    }, [financeRoute, syncForTab]);

    const openAddMoney = (wallet: FinanceWallet) => {
        page.setTransactionPresetType("pemasukan");
        page.setTransactionDraft({
            wallet_id: wallet.id,
            bank_account_id: wallet.real_account_id,
            currency_code: wallet.currency_code,
            amount: "",
            description: `Top-up ${wallet.name}`,
        });
        page.setTransactionModal(true);
    };

    const openMoveMoney = (wallet: FinanceWallet) => {
        page.setTransactionPresetType("transfer");
        page.setTransactionDraft({
            from_wallet_id: wallet.id,
            bank_account_id: wallet.real_account_id,
            currency_code: wallet.currency_code,
            amount: "",
            description: `Pindah dana dari ${wallet.name}`,
        });
        page.setTransferModal(true);
    };

    const openPaySend = (wallet: FinanceWallet) => {
        page.setTransactionPresetType("pengeluaran");
        page.setTransactionDraft({
            wallet_id: wallet.id,
            bank_account_id: wallet.real_account_id,
            currency_code: wallet.currency_code,
            amount: "",
            description: "",
        });
        page.setTransactionModal(true);
    };

    return (
        <FinanceShellLayout
            activeSection="home"
            topbar={(
                <FinancePlanningTopbar
                    title={financeRoute?.title ?? "Finance Overview"}
                    entityLabel={financeRoute?.entity_label ?? t("wallet.entity_label")}
                    searchOpen={page.searchOpen}
                    searchValue={page.search}
                    onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                    onSearchChange={page.setSearch}
                />
            )}
            fab={permissions.create && (
                <div className="position-fixed end-0 z-3" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", right: 20 }}>
                    <button
                        type="button"
                        className="btn btn-primary rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center"
                        style={{ width: 58, height: 58 }}
                        onClick={() => {
                            if (wallets.length > 0) {
                                page.setTransactionPresetType("pengeluaran");
                                page.setTransactionDraft({
                                    wallet_id: wallets[0]?.id ?? "",
                                    bank_account_id: wallets[0]?.real_account_id ?? accounts[0]?.id ?? "",
                                    currency_code: wallets[0]?.currency_code ?? defaultCurrency,
                                    amount: "",
                                    description: "",
                                });
                                page.setTransactionModal(true);
                            } else if (permissions.create) {
                                page.setShowAccountModal(true);
                            }
                        }}
                    >
                        <i className="ri-add-line fs-3" />
                    </button>
                </div>
            )}
        >
            <>
                <FinanceDashboardTab
                    summary={summary}
                    monthlyReview={monthlyReview}
                    filteredGoals={filteredGoals}
                    filteredWishes={filteredWishes}
                    loading={syncing}
                    onOpenMonthlyReview={() => page.setShowMonthlyReviewWizard(true)}
                />

                {Boolean(monthlyReview) && page.showMonthlyReviewWizard && (
                    <MonthlyReviewWizard
                        show={page.showMonthlyReviewWizard}
                        onHide={() => page.setShowMonthlyReviewWizard(false)}
                        monthlyReview={monthlyReview!}
                        syncAll={syncAll}
                    />
                )}

                {(page.showAccountDetailSheet || page.showAccountModal) && (
                    <AccountDialogs
                        showAccountDetailSheet={page.showAccountDetailSheet}
                        selectedAccount={page.selectedAccount}
                        setShowAccountDetailSheet={page.setShowAccountDetailSheet}
                        openAccountModal={(acc) => {
                            page.setSelectedAccount(acc ?? null);
                            page.setShowAccountModal(true);
                        }}
                        handleDeleteAccount={async () => {
                            if (!page.selectedAccount) return;
                            try {
                                await axios.delete(tenantRoute.apiTo(`/finance/accounts/${page.selectedAccount.id}`));
                                page.setShowAccountDetailSheet(false);
                                notify.success(t("finance.accounts.messages.deleted"));
                                await syncAll();
                            } catch {
                                notify.error(t("finance.accounts.messages.delete_failed"));
                            }
                        }}
                        permissions={permissions}
                        showAccountModal={page.showAccountModal}
                        setShowAccountModal={page.setShowAccountModal}
                        seedAccount={page.seedAccount}
                        setSeedAccount={page.setSeedAccount}
                        syncAccounts={syncAll}
                        currencies={currencies}
                        members={members}
                        activeMemberId={activeMemberId}
                    />
                )}

                {(page.showWalletDetailSheet || page.showWalletModal) && (
                    <FinanceEntityDialogs
                        showWalletDetailSheet={page.showWalletDetailSheet}
                        selectedWallet={page.selectedWallet}
                        setShowWalletDetailSheet={page.setShowWalletDetailSheet}
                        openWalletModal={(w) => {
                            page.setSelectedWallet(w ?? null);
                            page.setShowWalletModal(true);
                        }}
                        setSelectedWallet={page.setSelectedWallet}
                        setWalletForm={page.setWalletForm}
                        handleDeleteWallet={async (w) => {
                            try {
                                await axios.delete(tenantRoute.apiTo(`/finance/wallets/${w.id}`));
                                page.setShowWalletDetailSheet(false);
                                notify.success(t("wallet.messages.wallet_deleted"));
                                await syncAll();
                            } catch {
                                notify.error(t("wallet.messages.wallet_delete_failed"));
                            }
                        }}
                        permissions={permissions}
                        showWalletModal={page.showWalletModal}
                        setShowWalletModal={page.setShowWalletModal}
                        accounts={accounts}
                        budgets={budgets}
                        currencies={currencies}
                        members={members}
                        activeMemberId={activeMemberId}
                        handleSaveWallet={async (values) => {
                            page.setSavingWallet(true);
                            try {
                                await axios({
                                    method: page.selectedWallet ? "patch" : "post",
                                    url: page.selectedWallet ? tenantRoute.apiTo(`/finance/wallets/${page.selectedWallet.id}`) : tenantRoute.apiTo("/finance/wallets"),
                                    data: values,
                                });
                                page.setShowWalletModal(false);
                                notify.success(t("wallet.messages.wallet_saved"));
                                await syncAll();
                            } finally {
                                page.setSavingWallet(false);
                            }
                        }}
                        savingWallet={page.savingWallet}
                        onAddMoney={() => page.selectedWallet && openAddMoney(page.selectedWallet)}
                        onMoveMoney={() => page.selectedWallet && openMoveMoney(page.selectedWallet)}
                        onPaySend={() => page.selectedWallet && openPaySend(page.selectedWallet)}
                    />
                )}

                {page.transactionModal && (
                    <TransactionModal
                        show={page.transactionModal}
                        onClose={() => page.setTransactionModal(false)}
                        onSuccess={async () => {
                            await syncAll();
                            page.setTransactionModal(false);
                        }}
                        categories={categories}
                        currencies={currencies}
                        defaultCurrency={defaultCurrency}
                        paymentMethods={paymentMethods}
                        accounts={accounts}
                        budgets={budgets}
                        pockets={wallets}
                        members={members}
                        activeMemberId={activeMemberId}
                        walletSubscribed={walletSubscribed}
                        initialType={page.transactionPresetType as any}
                        initialDraft={page.transactionDraft}
                        draftMeta={page.transactionDraftMeta}
                    />
                )}

                {page.transferModal && (
                    <TransferModal
                        show={page.transferModal}
                        onClose={() => page.setTransferModal(false)}
                        onSuccess={async () => {
                            await syncAll();
                            page.setTransferModal(false);
                        }}
                        accounts={accounts}
                        pockets={wallets}
                        destinationPockets={wallets}
                        members={members}
                        activeMemberId={activeMemberId}
                    />
                )}
            </>
        </FinanceShellLayout>
    );
};

export default OverviewPage;
