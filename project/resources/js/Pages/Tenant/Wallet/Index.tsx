import axios from "axios";
import React, { Suspense, useState } from "react";
import TransactionModal from "../Finance/components/TransactionModal";
import { useTranslation } from "react-i18next";

import { notify } from "../../../common/notify";
import { parseApiError } from "../../../common/apiError";
import { FinanceAccount, FinancePocket, FinanceSavingsGoal } from "../Finance/types";

// EAGER: Default tab components (loaded immediately)
import WalletDashboardTab from "./components/WalletDashboardTab";
import WalletPageContent from "./components/WalletPageContent";
import useWalletData from "./hooks/useWalletData";
import useWalletDerivedMetrics from "./hooks/useWalletDerivedMetrics";
import useWalletPageState from "./hooks/useWalletPageState";

// LAZY: Non-default tab components (loaded on-demand)
const WalletAccountsTab = React.lazy(() => import("./components/WalletAccountsTab"));
const WalletWishesTab = React.lazy(() => import("./components/WalletWishesTab"));
const WalletGoalsTab = React.lazy(() => import("./components/WalletGoalsTab"));
const WalletDialogs = React.lazy(() => import("./components/WalletDialogs"));
const MonthlyReviewWizard = React.lazy(() => import("./components/MonthlyReviewWizard"));

import { ConvertWishFormState, GoalFormState, WalletFormState, WalletPageProps, WalletWish, WishFormState } from "./types";

// Loading fallback component
const TabLoadingFallback = () => (
    <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Memuat...</div>
    </div>
);

const WalletIndex = ({
    accounts: seededAccounts,
    pockets: seededPockets,
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
}: WalletPageProps) => {
    const { t } = useTranslation();
    const page = useWalletPageState(seededAccounts[0]?.id ?? null);
    const {
        tenantRoute,
        accounts,
        setWallets,
        wallets,
        budgets,
        goals,
        setGoals,
        wishes,
        setWishes,
        summary: walletSummary,
        syncing,
        filteredAccounts,
        filteredWallets,
        filteredGoals,
        filteredWishes,
        monthlyReview,
        syncAll,
        syncForTab,
    } = useWalletData({
        seededAccounts,
        seededPockets,
        seededBudgets,
        seededGoals,
        seededWishes,
        seededSummary,
        seededMonthlyReview,
        search: page.search,
    });

    const { groupedWallets, extraWalletCount, summary, metrics } = useWalletDerivedMetrics({
        activeTab: page.activeTab,
        filteredAccounts,
        filteredWallets,
        wishes,
        summary: walletSummary,
        t,
    });

    const canCreateAccount = permissions.create && (limits.accounts === null || limits.accounts === -1 || accounts.length < limits.accounts);
    const canCreateWallet = permissions.create && (limits.pockets === null || limits.pockets === -1 || extraWalletCount < limits.pockets);
    const canCreateGoal = permissions.create && (limits.goals === null || limits.goals === -1 || goals.length < limits.goals);
    const canCreateWish = permissions.create && (limits.wishes === null || limits.wishes === -1 || wishes.length < limits.wishes);

    const [walletForm, setWalletForm] = useState<WalletFormState>({
        name: "",
        type: "personal",
        purpose_type: "spending",
        scope: "private",
        real_account_id: seededAccounts[0]?.id || "",
        owner_member_id: activeMemberId ? String(activeMemberId) : (members[0] ? String(members[0].id) : ""),
        default_budget_id: "",
        default_budget_key: "",
        budget_lock_enabled: false,
        icon_key: "ri-wallet-3-line",
        notes: "",
        background_color: "#fef08a",
        row_version: 1,
    });
    const [goalForm, setGoalForm] = useState<GoalFormState>({
        pocket_id: seededPockets.find((wallet) => !wallet.is_system)?.id || seededPockets[0]?.id || "",
        name: "",
        target_amount: "",
        target_date: "",
        status: "active",
        notes: "",
        row_version: 1,
    });
    const [wishForm, setWishForm] = useState<WishFormState>({
        title: "",
        description: "",
        estimated_amount: "",
        priority: "medium",
        image_url: "",
        notes: "",
        row_version: 1,
    });

    const resetWalletForm = (wallet?: any | null, accountId?: string) => {
        page.setSelectedWallet(wallet ?? null);
        setWalletForm({
            name: wallet?.name || "",
            type: (wallet?.type as WalletFormState["type"]) || "personal",
            purpose_type: (wallet?.purpose_type as WalletFormState["purpose_type"]) || "spending",
            scope: wallet?.scope || "private",
            real_account_id: wallet?.real_account_id || wallet?.real_account?.id || accountId || accounts[0]?.id || "",
            owner_member_id: wallet?.owner_member_id ? String(wallet.owner_member_id) : (activeMemberId ? String(activeMemberId) : (members[0] ? String(members[0].id) : "")),
            default_budget_id: wallet?.default_budget_id ? String(wallet.default_budget_id) : "",
            default_budget_key: wallet?.default_budget_key ? String(wallet.default_budget_key) : "",
            budget_lock_enabled: Boolean(wallet?.budget_lock_enabled),
            icon_key: wallet?.icon_key || "ri-wallet-3-line",
            notes: wallet?.notes || "",
            background_color: wallet?.background_color || "#fef08a",
            row_version: wallet?.row_version || 1,
        });
    };

    const resetGoalForm = (goal?: FinanceSavingsGoal | null, walletId?: string) => {
        page.setSelectedGoal(goal ?? null);
        setGoalForm({
            pocket_id: goal?.pocket_id || walletId || filteredWallets.find((wallet) => !wallet.is_system)?.id || filteredWallets[0]?.id || "",
            name: goal?.name || "",
            target_amount: goal?.target_amount ? String(goal.target_amount) : "",
            target_date: goal?.target_date || "",
            status: goal?.status || "active",
            notes: goal?.notes || "",
            row_version: goal?.row_version || 1,
        });
    };

    const resetWishForm = (wish?: WalletWish | null) => {
        page.setSelectedWish(wish ?? null);
        setWishForm({
            title: wish?.title || "",
            description: wish?.description || "",
            estimated_amount: wish?.estimated_amount ? String(wish.estimated_amount) : "",
            priority: wish?.priority || "medium",
            image_url: wish?.image_url || "",
            notes: wish?.notes || "",
            row_version: wish?.row_version || 1,
        });
    };

    const openAddMoney = (wallet: FinancePocket) => {
        page.setTransactionPresetType("pemasukan");
        page.setTransactionDraft({
            pocket_id: wallet.id,
            bank_account_id: wallet.real_account_id,
            currency_code: wallet.currency_code,
            amount: "",
            description: `Top-up ${wallet.name}`,
        });
        page.setTransactionModal(true);
    };

    const openMoveMoney = (wallet: FinancePocket) => {
        page.setTransactionPresetType("transfer");
        page.setTransactionDraft({
            from_pocket_id: wallet.id,
            bank_account_id: wallet.real_account_id,
            currency_code: wallet.currency_code,
            amount: "",
            description: `Pindah dana dari ${wallet.name}`,
        });
        page.setTransactionModal(true);
    };

    const openPaySend = (wallet: FinancePocket) => {
        page.setTransactionPresetType("pengeluaran");
        page.setTransactionDraft({
            pocket_id: wallet.id,
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

    const openWalletModal = (wallet?: any | null, accountId?: string) => {
        resetWalletForm(wallet ?? null, accountId);
        page.setShowWalletModal(true);
    };

    const handleSaveWallet = async () => {
        page.setSavingWallet(true);
        try {
            const response = await axios({
                method: page.selectedWallet ? "patch" : "post",
                url: page.selectedWallet ? tenantRoute.apiTo(`/wallet/wallets/${page.selectedWallet.id}`) : tenantRoute.apiTo("/wallet/wallets"),
                data: {
                    ...walletForm,
                    owner_member_id: walletForm.owner_member_id ? Number(walletForm.owner_member_id) : null,
                    default_budget_id: walletForm.default_budget_id || null,
                    default_budget_key: walletForm.default_budget_key || null,
                    budget_lock_enabled: walletForm.budget_lock_enabled,
                    member_access_ids: [],
                },
            });

            const savedWallet = response.data?.data?.wallet ?? response.data?.data?.pocket;
            setWallets((prev) => [savedWallet, ...prev.filter((item) => item.id !== savedWallet.id)]);
            notify.success(t(page.selectedWallet ? "wallet.messages.wallet_updated" : "wallet.messages.wallet_created"));
            page.setShowWalletModal(false);
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wallet_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingWallet(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!page.selectedAccount || !window.confirm(t("finance.accounts.messages.delete_confirm"))) {
            return;
        }

        try {
            await axios.delete(tenantRoute.apiTo(`/wallet/accounts/${page.selectedAccount.id}`));
            page.setShowAccountModal(false);
            notify.success(t("finance.accounts.messages.deleted"));
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.accounts.messages.delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleDeleteWallet = async (wallet: any) => {
        if (!window.confirm(t("wallet.messages.wallet_delete_confirm"))) {
            return;
        }

        try {
            await axios.delete(tenantRoute.apiTo(`/wallet/wallets/${wallet.id}`));
            notify.success(t("wallet.messages.wallet_deleted"));
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wallet_delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleWalletQuotaClick = (accountId: string) => {
        if (!permissions.create) {
            return;
        }

        if (!canCreateWallet) {
            notify.error({
                title: t("wallet.messages.wallet_limit_reached_title"),
                detail: t("wallet.messages.wallet_limit_reached"),
            });
            return;
        }

        openWalletModal(null, accountId);
    };

    const handleSaveGoal = async () => {
        page.setSavingGoal(true);
        try {
            const response = await axios({
                method: page.selectedGoal ? "patch" : "post",
                url: page.selectedGoal ? tenantRoute.apiTo(`/wallet/goals/${page.selectedGoal.id}`) : tenantRoute.apiTo("/wallet/goals"),
                data: {
                    ...goalForm,
                    target_amount: Number(goalForm.target_amount || 0),
                },
            });

            const savedGoal = response.data?.data?.goal;
            setGoals((prev) => [savedGoal, ...prev.filter((item) => item.id !== savedGoal.id)]);
            notify.success(t(page.selectedGoal ? "wallet.messages.goal_updated" : "wallet.messages.goal_created"));
            page.setShowGoalModal(false);
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingGoal(false);
        }
    };

    const handleDeleteGoal = async (goal: FinanceSavingsGoal) => {
        if (!window.confirm(t("wallet.messages.goal_delete_confirm"))) {
            return;
        }

        try {
            await axios.delete(tenantRoute.apiTo(`/wallet/goals/${goal.id}`));
            notify.success(t("wallet.messages.goal_deleted"));
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleSaveWish = async () => {
        page.setSavingWish(true);
        try {
            const response = await axios({
                method: page.selectedWish ? "patch" : "post",
                url: page.selectedWish ? tenantRoute.apiTo(`/wallet/wishes/${page.selectedWish.id}`) : tenantRoute.apiTo("/wallet/wishes"),
                data: {
                    ...wishForm,
                    estimated_amount: wishForm.estimated_amount ? Number(wishForm.estimated_amount) : null,
                },
            });

            const savedWish = response.data?.data?.wish;
            setWishes((prev) => [savedWish, ...prev.filter((item) => item.id !== savedWish.id)]);
            notify.success(t(page.selectedWish ? "wallet.messages.wish_updated" : "wallet.messages.wish_created"));
            page.setShowWishModal(false);
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingWish(false);
        }
    };

    const handleDeleteWish = async (wish: WalletWish) => {
        if (!window.confirm(t("wallet.messages.wish_delete_confirm"))) {
            return;
        }

        try {
            await axios.delete(tenantRoute.apiTo(`/wallet/wishes/${wish.id}`));
            notify.success(t("wallet.messages.wish_deleted"));
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleWishStatus = async (wish: WalletWish, action: "approve" | "reject") => {
        try {
            await axios.post(tenantRoute.apiTo(`/wallet/wishes/${wish.id}/${action}`));
            notify.success(t(action === "approve" ? "wallet.messages.wish_approved" : "wallet.messages.wish_rejected"));
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleConvertWish = async () => {
        if (!page.selectedWish) {
            return;
        }

        page.setConvertingWish(true);
        try {
            await axios.post(tenantRoute.apiTo(`/wallet/wishes/${page.selectedWish.id}/convert`), {
                wallet_id: page.convertForm.wallet_id,
                target_amount: page.convertForm.target_amount ? Number(page.convertForm.target_amount) : undefined,
                target_date: page.convertForm.target_date || undefined,
                notes: page.convertForm.notes || undefined,
            });
            notify.success(t("wallet.messages.wish_converted"));
            page.setShowConvertModal(false);
            await syncForTab(page.activeTab);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_convert_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setConvertingWish(false);
        }
    };

    return (
        <>
            <WalletPageContent
                activeTab={page.activeTab}
                setActiveTab={page.setActiveTab}
                title="Wallet"
                entityLabel={t("wallet.entity_label")}
                searchOpen={page.searchOpen}
                searchValue={page.search}
                onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                onSearchChange={page.setSearch}
                permissionsCreate={permissions.create}
                canCreateAccount={canCreateAccount}
                canCreateWish={canCreateWish}
                canCreateGoal={canCreateGoal}
                onFabClick={() => {
                    if (page.activeTab === "accounts") {
                        if (!canCreateAccount) {
                            return;
                        }
                        openAccountModal(null, null);
                        return;
                    }

                    if (page.activeTab === "wishes") {
                        if (!canCreateWish) {
                            return;
                        }
                        resetWishForm(null);
                        page.setShowWishModal(true);
                        return;
                    }

                    if (page.activeTab === "goals") {
                        if (!canCreateGoal) {
                            return;
                        }
                        resetGoalForm(null);
                        page.setShowGoalModal(true);
                        return;
                    }

                    page.setActiveTab("accounts");
                }}
            >
                {page.activeTab === "dashboard" && (
                    <WalletDashboardTab
                        summary={summary}
                        monthlyReview={monthlyReview}
                        filteredGoals={filteredGoals}
                        filteredWishes={filteredWishes}
                        loading={syncing}
                        onOpenMonthlyReview={() => page.setShowMonthlyReviewWizard(true)}
                    />
                )}

                {page.activeTab === "accounts" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <WalletAccountsTab
                            groupedWallets={groupedWallets}
                            permissions={permissions}
                            onOpenAccountDetail={(account) => {
                                page.setSelectedAccount(account);
                                page.setShowAccountDetailSheet(true);
                            }}
                            onOpenWalletDetail={(wallet) => {
                                page.setSelectedWallet(wallet);
                                page.setShowWalletDetailSheet(true);
                            }}
                            onAddWallet={handleWalletQuotaClick}
                        />
                    </Suspense>
                )}

                {page.activeTab === "wishes" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <WalletWishesTab
                            wishes={filteredWishes}
                            canCreateGoal={canCreateGoal}
                            filteredWallets={filteredWallets}
                            onApproveReject={handleWishStatus}
                            onConvert={(wish) => {
                                page.setSelectedWish(wish);
                                page.setConvertForm({
                                    wallet_id: filteredWallets.find((wallet) => !wallet.is_system)?.id || filteredWallets[0]?.id || "",
                                    target_amount: wish.estimated_amount ? String(wish.estimated_amount) : "",
                                    target_date: "",
                                    notes: wish.notes || "",
                                } as ConvertWishFormState);
                                page.setShowConvertModal(true);
                            }}
                            onEdit={(wish) => {
                                resetWishForm(wish);
                                page.setShowWishModal(true);
                            }}
                            onDelete={(wish) => void handleDeleteWish(wish)}
                        />
                    </Suspense>
                )}

                {page.activeTab === "goals" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <WalletGoalsTab
                            goals={filteredGoals}
                            financeHref={tenantRoute.to("/finance")}
                            onEdit={(goal) => {
                                resetGoalForm(goal);
                                page.setShowGoalModal(true);
                            }}
                            onDelete={(goal) => void handleDeleteGoal(goal)}
                        />
                    </Suspense>
                )}
            </WalletPageContent>

            <Suspense fallback={null}>
                <WalletDialogs
                showAccountDetailSheet={page.showAccountDetailSheet}
                selectedAccount={page.selectedAccount}
                setShowAccountDetailSheet={page.setShowAccountDetailSheet}
                openAccountModal={openAccountModal}
                handleDeleteAccount={handleDeleteAccount}
                showWalletDetailSheet={page.showWalletDetailSheet}
                selectedWallet={page.selectedWallet}
                setShowWalletDetailSheet={page.setShowWalletDetailSheet}
                openWalletModal={openWalletModal}
                setSelectedWallet={page.setSelectedWallet}
                setWalletForm={setWalletForm}
                handleDeleteWallet={handleDeleteWallet}
                permissions={permissions}
                showAccountModal={page.showAccountModal}
                setShowAccountModal={page.setShowAccountModal}
                seedAccount={page.seedAccount}
                setSeedAccount={page.setSeedAccount}
                syncAll={syncAll}
                accounts={accounts}
                budgets={budgets}
                currencies={currencies}
                members={members}
                activeMemberId={activeMemberId}
                showWalletModal={page.showWalletModal}
                setShowWalletModal={page.setShowWalletModal}
                walletForm={walletForm}
                selectedGoal={page.selectedGoal}
                showGoalModal={page.showGoalModal}
                setShowGoalModal={page.setShowGoalModal}
                goalForm={goalForm}
                setGoalForm={setGoalForm}
                handleSaveGoal={handleSaveGoal}
                handleDeleteGoal={handleDeleteGoal}
                savingGoal={page.savingGoal}
                wallets={wallets}
                selectedWish={page.selectedWish}
                showWishModal={page.showWishModal}
                setShowWishModal={page.setShowWishModal}
                wishForm={wishForm}
                setWishForm={setWishForm}
                handleSaveWish={handleSaveWish}
                savingWish={page.savingWish}
                showConvertModal={page.showConvertModal}
                setShowConvertModal={page.setShowConvertModal}
                convertForm={page.convertForm}
                setConvertForm={page.setConvertForm}
                handleConvertWish={handleConvertWish}
                convertingWish={page.convertingWish}
                handleSaveWallet={handleSaveWallet}
                savingWallet={page.savingWallet}
                transactionModal={page.transactionModal}
                setTransactionModal={page.setTransactionModal}
                transactionDraft={page.transactionDraft}
                setTransactionDraft={page.setTransactionDraft}
                transactionDraftMeta={page.transactionDraftMeta}
                setTransactionDraftMeta={page.setTransactionDraftMeta}
                transactionPresetType={page.transactionPresetType as any}
                categories={categories}
                paymentMethods={paymentMethods}
                walletSubscribed={walletSubscribed}
                defaultCurrency={defaultCurrency}
                onAddMoney={() => page.selectedWallet && openAddMoney(page.selectedWallet)}
                onMoveMoney={() => page.selectedWallet && openMoveMoney(page.selectedWallet)}
                onPaySend={() => page.selectedWallet && openPaySend(page.selectedWallet)}
            />
            </Suspense>

            <Suspense fallback={null}>
                <MonthlyReviewWizard
                    show={page.showMonthlyReviewWizard}
                    onHide={() => page.setShowMonthlyReviewWizard(false)}
                    monthlyReview={monthlyReview}
                    syncAll={syncAll}
                />
            </Suspense>
            
            <TransactionModal
                show={page.transactionModal}
                onClose={() => page.setTransactionModal(false)}
                onSuccess={async () => {
                    await syncForTab(page.activeTab);
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
        </>
    );
};

export default WalletIndex;
