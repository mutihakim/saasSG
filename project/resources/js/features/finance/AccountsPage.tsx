import axios from "axios";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";



import AccountDialogs from "./components/AccountDialogs";
import FinanceAccountsTab from "./components/FinanceAccountsTab";
import FinanceEntityDialogs from "./components/FinanceEntityDialogs";
import TransactionModal from "./components/TransactionModal";
import TransferModal from "./components/TransferModal";
import FinancePlanningTopbar from "./components/pwa/FinancePlanningTopbar";
import useFinanceOverviewMetrics from "./hooks/useFinanceOverviewMetrics";
import useFinancePlanningState from "./hooks/useFinancePlanningState";
import useFinanceStructuresData from "./hooks/useFinanceStructuresData";
import { FinanceAccount, FinancePlanningPageProps, FinanceWallet, FinanceWalletFormState } from "./types";

import { currentMonthValue } from "@/core/constants/month";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const DangerDeleteModal = React.lazy(() => import("@/components/ui/DangerDeleteModal"));

const AccountsPage = ({
    accounts: seededAccounts,
    wallets: seededPockets,
    budgets: seededBudgets,
    goals: seededGoals,
    wishes: seededWishes,
    summary: seededSummary,
    monthlyReview: seededMonthlyReview,
    members,
    currencies,
    categories,
    paymentMethods,
    defaultCurrency,
    activeMemberId,
    walletSubscribed,
    permissions,
    limits,
    financeRoute,
}: FinancePlanningPageProps) => {
    const { t } = useTranslation();
    const page = useFinancePlanningState(
        seededAccounts[0]?.id ?? null,
        "accounts"
    );
    const {
        tenantRoute,
        accounts,
        setWallets,
        wallets,
        budgets,
        filteredAccounts,
        filteredWallets,
        syncAll,
        syncForTab,
        fetchBudgets,
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

    const { groupedWallets, extraWalletCount } = useFinanceOverviewMetrics({
        activeTab: page.activeTab,
        filteredAccounts,
        filteredWallets,
        wishes: seededWishes,
        summary: seededSummary,
        t,
    });

    const canCreateAccount = permissions.create && (limits.accounts === null || limits.accounts === -1 || accounts.length < limits.accounts);
    const canCreateWallet = permissions.create && (limits.wallets === null || limits.wallets === -1 || extraWalletCount < limits.wallets);
    const planningMonth = financeRoute?.period_month ?? currentMonthValue();

    const shouldMountAccountDialogs = page.showAccountDetailSheet || page.showAccountModal;
    const shouldMountWalletDialogs = page.showWalletDetailSheet || page.showWalletModal;
    const shouldMountTransactionModal = page.transactionModal;
    const shouldMountTransferModal = page.transferModal;

    const [deleteIntent, setDeleteIntent] = useState<{ kind: "account" | "wallet"; id: string; name: string } | null>(null);
    const [deletingEntity, setDeletingEntity] = useState(false);
    const shouldMountDeleteDialog = Boolean(deleteIntent);

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

    const openAccountModal = (account?: any | null, duplicateFrom?: any | null) => {
        page.setSelectedAccount(account ?? null);
        page.setSeedAccount(duplicateFrom ?? null);
        page.setShowAccountModal(true);
    };

    const openWalletModal = async (wallet?: any | null, _accountId?: string) => {
        await fetchBudgets(planningMonth);
        page.setSelectedWallet(wallet ?? null);
        page.setShowWalletModal(true);
    };

    const requestDeleteAccount = () => {
        if (!page.selectedAccount) return;
        setDeleteIntent({ kind: "account", id: page.selectedAccount.id, name: page.selectedAccount.name });
    };

    const handleDeleteAccount = async () => {
        if (!page.selectedAccount) return;
        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/accounts/${page.selectedAccount.id}`));
            page.setShowAccountDetailSheet(false);
            setDeleteIntent(null);
            notify.success(t("finance.accounts.messages.deleted"));
            await syncForTab("accounts", { force: true });
        } catch {
            notify.error(t("finance.accounts.messages.delete_failed"));
        } finally {
            setDeletingEntity(false);
        }
    };

    const requestDeleteWallet = (wallet: any) => {
        if (!wallet) return;
        setDeleteIntent({ kind: "wallet", id: wallet.id, name: wallet.name });
    };

    const handleDeleteWallet = async (wallet: any) => {
        if (!wallet) return;
        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/wallets/${wallet.id}`));
            page.setShowWalletDetailSheet(false);
            setDeleteIntent(null);
            notify.success(t("wallet.messages.wallet_deleted"));
            await syncForTab("accounts", { force: true });
        } catch {
            notify.error(t("wallet.messages.wallet_delete_failed"));
        } finally {
            setDeletingEntity(false);
        }
    };

    const handleWalletQuotaClick = (accountId: string) => {
        if (!permissions.create) return;
        if (!canCreateWallet) {
            notify.error({ title: t("wallet.messages.wallet_limit_reached_title"), detail: t("wallet.messages.wallet_limit_reached") });
            return;
        }
        void openWalletModal(null, accountId);
    };

    const openAccountDetail = async (account: FinanceAccount) => {
        page.setSelectedAccount(account);
        page.setShowAccountDetailSheet(true);
        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/accounts/${account.id}`));
            page.setSelectedAccount(response.data?.data?.account ?? account);
        } catch {
            // Keep optimistic detail payload if hydration fails.
        }
    };

    const openWalletDetail = async (wallet: FinanceWallet) => {
        page.setSelectedWallet(wallet);
        page.setShowWalletDetailSheet(true);
        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/wallets/${wallet.id}`));
            page.setSelectedWallet(response.data?.data?.wallet ?? response.data?.data?.pocket ?? wallet);
        } catch {
            // Keep optimistic detail payload if hydration fails.
        }
    };

    const handleFabClick = () => {
        if (!canCreateAccount) return;
        openAccountModal(null, null);
    };

    return (
        <FinanceShellLayout
            activeSection="accounts"
            topbar={(
                <FinancePlanningTopbar
                    title={financeRoute?.title ?? "Accounts & Wallets"}
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
                        disabled={!canCreateAccount}
                        onClick={handleFabClick}
                    >
                        <i className="ri-add-line fs-3" />
                    </button>
                </div>
            )}
        >
            <>
                <FinanceAccountsTab
                    groupedWallets={groupedWallets}
                    permissions={permissions}
                    activeMemberId={activeMemberId}
                    onOpenAccountDetail={openAccountDetail}
                    onOpenWalletDetail={openWalletDetail}
                    onAddWallet={handleWalletQuotaClick}
                />

                {shouldMountAccountDialogs && (
                    <AccountDialogs
                        showAccountDetailSheet={page.showAccountDetailSheet}
                        selectedAccount={page.selectedAccount}
                        setShowAccountDetailSheet={page.setShowAccountDetailSheet}
                        openAccountModal={openAccountModal}
                        handleDeleteAccount={requestDeleteAccount}
                        permissions={permissions}
                        showAccountModal={page.showAccountModal}
                        setShowAccountModal={page.setShowAccountModal}
                        seedAccount={page.seedAccount}
                        setSeedAccount={page.setSeedAccount}
                        syncAccounts={() => syncForTab("accounts", { force: true })}
                        currencies={currencies}
                        members={members}
                        activeMemberId={activeMemberId}
                    />
                )}

                {shouldMountWalletDialogs && (
                    <FinanceEntityDialogs
                        showWalletDetailSheet={page.showWalletDetailSheet}
                        selectedWallet={page.selectedWallet}
                        setShowWalletDetailSheet={page.setShowWalletDetailSheet}
                        openWalletModal={openWalletModal}
                        setSelectedWallet={page.setSelectedWallet}
                        setWalletForm={page.setWalletForm}
                        handleDeleteWallet={requestDeleteWallet}
                        permissions={permissions}
                        showWalletModal={page.showWalletModal}
                        setShowWalletModal={page.setShowWalletModal}
                        accounts={accounts}
                        budgets={budgets}
                        currencies={currencies}
                        members={members}
                        activeMemberId={activeMemberId}
                        handleSaveWallet={async (values: FinanceWalletFormState) => {
                            page.setSavingWallet(true);
                            try {
                                const response = await axios({
                                    method: page.selectedWallet ? "patch" : "post",
                                    url: page.selectedWallet ? tenantRoute.apiTo(`/finance/wallets/${page.selectedWallet.id}`) : tenantRoute.apiTo("/finance/wallets"),
                                    data: {
                                        ...values,
                                        owner_member_id: values.owner_member_id ? Number(values.owner_member_id) : null,
                                        default_budget_id: values.default_budget_id || null,
                                        default_budget_key: values.default_budget_key || null,
                                        budget_lock_enabled: values.budget_lock_enabled,
                                        member_access: [],
                                    },
                                });

                                const savedWallet = response.data?.data?.wallet;
                                if (savedWallet) {
                                    setWallets((prev) => [savedWallet, ...prev.filter((item) => item.id !== savedWallet.id)]);
                                }
                                page.setShowWalletModal(false);
                                notify.success(t(page.selectedWallet ? "wallet.messages.wallet_updated" : "wallet.messages.wallet_created"));
                                await syncForTab("accounts", { force: true });
                            } catch (error: any) {
                                const parsed = parseApiError(error, t("wallet.messages.wallet_save_failed"));
                                notify.error({ title: parsed.title, detail: parsed.detail });
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

                {shouldMountDeleteDialog && (
                    <Suspense fallback={null}>
                        <DangerDeleteModal
                            key={deleteIntent ? `${deleteIntent.kind}-${deleteIntent.id}` : "wallet-delete"}
                            show={Boolean(deleteIntent)}
                            onClose={() => !deletingEntity && setDeleteIntent(null)}
                            onConfirm={() => {
                                if (!deleteIntent) return;
                                if (deleteIntent.kind === "account") {
                                    void handleDeleteAccount();
                                    return;
                                }
                                const wallet = wallets.find((item) => item.id === deleteIntent.id) || page.selectedWallet;
                                if (wallet) void handleDeleteWallet(wallet);
                            }}
                            loading={deletingEntity}
                            title={deleteIntent?.kind === "account" ? "Hapus akun ini?" : "Hapus wallet ini?"}
                            entityLabel={deleteIntent?.kind === "account" ? "Akun" : "Wallet"}
                            entityName={deleteIntent?.name || ""}
                            message={deleteIntent?.kind === "account"
                                ? "Akun hanya bisa dihapus jika backend mengizinkan."
                                : "Wallet hanya bisa dihapus jika backend mengizinkan."}
                            confirmLabel={deleteIntent?.kind === "account" ? "Ya, Hapus Akun" : "Ya, Hapus Wallet"}
                        />
                    </Suspense>
                )}

                {shouldMountTransactionModal && (
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

                {shouldMountTransferModal && (
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

export default AccountsPage;
