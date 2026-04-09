import axios from "axios";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import DangerDeleteModal from "../../../Components/Common/DangerDeleteModal";
import { currentMonthValue, shiftMonthValue } from "../../../common/month";
import { parseApiError } from "../../../common/apiError";
import { notify } from "../../../common/notify";
import BudgetModal from "../Finance/components/BudgetModal";
import TransactionModal from "../Finance/components/TransactionModal";
import { FinanceAccount, FinanceBudget, FinancePocket, FinanceSavingsGoal } from "../Finance/types";

// EAGER: Route shell + accounts surface
import WalletPageContent from "./components/WalletPageContent";
import useWalletData from "./hooks/useWalletData";
import useWalletDerivedMetrics from "./hooks/useWalletDerivedMetrics";
import useWalletPageState from "./hooks/useWalletPageState";
import { ConvertWishFormState, GoalDetailPayload, GoalFormState, GoalFundFormState, GoalSpendFormState, WalletFormState, WalletPageProps, WalletWish, WishFormState } from "./types";

// LAZY: Route-specific or non-default tab components (loaded on-demand)
const WalletDashboardTab = React.lazy(() => import("./components/WalletDashboardTab"));
const WalletAccountsTab = React.lazy(() => import("./components/WalletAccountsTab"));
const WalletBudgetsTab = React.lazy(() => import("./components/WalletBudgetsTab"));
const WalletWishesTab = React.lazy(() => import("./components/WalletWishesTab"));
const WalletGoalsTab = React.lazy(() => import("./components/WalletGoalsTab"));
const AccountDialogs = React.lazy(() => import("./components/AccountDialogs"));
const WalletEntityDialogs = React.lazy(() => import("./components/WalletEntityDialogs"));
const GoalDialogs = React.lazy(() => import("./components/GoalDialogs"));
const GoalActionModal = React.lazy(() => import("./components/GoalActionModal"));
const WishDialogs = React.lazy(() => import("./components/WishDialogs"));
const MonthlyReviewWizard = React.lazy(() => import("./components/MonthlyReviewWizard"));
const GoalDetailSheet = React.lazy(() => import("./components/pwa/GoalDetailSheet"));

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
    financeRoute,
}: WalletPageProps) => {
    const { t } = useTranslation();
    const page = useWalletPageState(
        seededAccounts[0]?.id ?? null,
        financeRoute?.initial_tab ?? "dashboard"
    );
    const {
        tenantRoute,
        accounts,
        setBudgets,
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
        periodMonth: financeRoute?.period_month ?? currentMonthValue(),
        preloaded: financeRoute?.preloaded,
    });

    const { groupedWallets, extraWalletCount, summary } = useWalletDerivedMetrics({
        activeTab: page.activeTab,
        filteredAccounts,
        filteredWallets,
        wishes,
        summary: walletSummary,
        t,
    });

    const canCreateAccount = permissions.create && (limits.accounts === null || limits.accounts === -1 || accounts.length < limits.accounts);
    const canCreateWallet = permissions.create && (limits.pockets === null || limits.pockets === -1 || extraWalletCount < limits.pockets);
    const canCreateBudget = permissions.create;
    const canCreateGoal = permissions.create && (limits.goals === null || limits.goals === -1 || goals.length < limits.goals);
    const canCreateWish = permissions.create && (limits.wishes === null || limits.wishes === -1 || wishes.length < limits.wishes);
    const shouldOpenMonthlyReview = Boolean(financeRoute?.open_monthly_review && monthlyReview);
    const [planningMonth, setPlanningMonth] = useState(financeRoute?.period_month ?? currentMonthValue());
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<FinanceBudget | null>(null);
    const planningMonthLabel = new Date(`${planningMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const bootstrapSyncRef = useRef<string | null>(null);

    useEffect(() => {
        if (!shouldOpenMonthlyReview) {
            return;
        }

        page.setShowMonthlyReviewWizard(true);
    }, [page.setShowMonthlyReviewWizard, shouldOpenMonthlyReview]);

    useEffect(() => {
        const activeSection = financeRoute?.section ?? "home";
        const activeTab = page.activeTab;

        const shouldBootstrap = (() => {
            if (activeSection === "accounts") {
                return !financeRoute?.preloaded?.accounts || !financeRoute?.preloaded?.pockets;
            }

            if (activeSection === "planning" && activeTab === "budgets") {
                return !financeRoute?.preloaded?.budgets || !financeRoute?.preloaded?.pockets;
            }

            if (activeSection === "planning" && activeTab === "goals") {
                return !financeRoute?.preloaded?.goals || !financeRoute?.preloaded?.pockets;
            }

            if (activeSection === "planning" && activeTab === "wishes") {
                return !financeRoute?.preloaded?.wishes;
            }

            return false;
        })();

        if (!shouldBootstrap) {
            bootstrapSyncRef.current = null;
            return;
        }

        const syncKey = `${activeSection}:${activeTab}:${planningMonth}`;
        if (bootstrapSyncRef.current === syncKey) {
            return;
        }

        bootstrapSyncRef.current = syncKey;
        void syncForTab(activeTab, {
            periodMonth: activeTab === "budgets" ? planningMonth : undefined,
        });
    }, [
        financeRoute?.preloaded?.accounts,
        financeRoute?.preloaded?.budgets,
        financeRoute?.preloaded?.goals,
        financeRoute?.preloaded?.pockets,
        financeRoute?.preloaded?.wishes,
        financeRoute?.section,
        page.activeTab,
        planningMonth,
        syncForTab,
    ]);

    const isSectionBootstrapping = (() => {
        const activeSection = financeRoute?.section ?? "home";

        if (activeSection === "accounts") {
            return syncing && (!financeRoute?.preloaded?.accounts || !financeRoute?.preloaded?.pockets) && accounts.length === 0 && wallets.length === 0;
        }

        if (activeSection === "planning" && page.activeTab === "budgets") {
            return syncing && (!financeRoute?.preloaded?.budgets || !financeRoute?.preloaded?.pockets) && budgets.length === 0 && wallets.length === 0;
        }

        if (activeSection === "planning" && page.activeTab === "goals") {
            return syncing && (!financeRoute?.preloaded?.goals || !financeRoute?.preloaded?.pockets) && goals.length === 0 && wallets.length === 0;
        }

        if (activeSection === "planning" && page.activeTab === "wishes") {
            return syncing && !financeRoute?.preloaded?.wishes && wishes.length === 0;
        }

        return false;
    })();

    const [, setWalletForm] = useState<WalletFormState>({
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
        member_access: [],
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
    const [goalActivities, setGoalActivities] = useState<GoalDetailPayload["activities"]>([]);
    const [goalFundForm, setGoalFundForm] = useState<GoalFundFormState>({
        source_pocket_id: "",
        amount: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
    });
    const [goalSpendForm, setGoalSpendForm] = useState<GoalSpendFormState>({
        amount: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        category_id: "",
        budget_id: "",
        payment_method: "",
        description: "",
        merchant_name: "",
        reference_number: "",
        location: "",
        notes: "",
    });
    const [deleteIntent, setDeleteIntent] = useState<{ kind: "account" | "wallet" | "budget"; id: string; name: string } | null>(null);
    const [deletingEntity, setDeletingEntity] = useState(false);

    const resetWalletForm = (wallet?: any | null, accountId?: string) => {
        page.setSelectedWallet(wallet ?? null);
        setWalletForm({
            name: wallet?.name || "",
            type: wallet?.type || "personal",
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
            member_access: wallet?.member_access || (wallet as any)?.memberAccess || [],
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

    const handleSaveWallet = async (values: WalletFormState) => {
        page.setSavingWallet(true);
        try {
            const response = await axios({
                method: page.selectedWallet ? "patch" : "post",
                url: page.selectedWallet ? tenantRoute.apiTo(`/finance/pockets/${page.selectedWallet.id}`) : tenantRoute.apiTo("/finance/pockets"),
                data: {
                    ...values,
                    owner_member_id: values.owner_member_id ? Number(values.owner_member_id) : null,
                    default_budget_id: values.default_budget_id || null,
                    default_budget_key: values.default_budget_key || null,
                    budget_lock_enabled: values.budget_lock_enabled,
                    member_access: [],
                },
            });

            const savedWallet = response.data?.data?.wallet ?? response.data?.data?.pocket;
            setWallets((prev) => [savedWallet, ...prev.filter((item) => item.id !== savedWallet.id)]);
            notify.success(t(page.selectedWallet ? "wallet.messages.wallet_updated" : "wallet.messages.wallet_created"));
            page.setShowWalletModal(false);
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wallet_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingWallet(false);
        }
    };

    const requestDeleteAccount = () => {
        if (!page.selectedAccount) {
            return;
        }

        setDeleteIntent({
            kind: "account",
            id: page.selectedAccount.id,
            name: page.selectedAccount.name,
        });
    };

    const handleDeleteAccount = async () => {
        if (!page.selectedAccount) {
            return;
        }

        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/accounts/${page.selectedAccount.id}`));
            page.setShowAccountModal(false);
            page.setShowAccountDetailSheet(false);
            setDeleteIntent(null);
            notify.success(t("finance.accounts.messages.deleted"));
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.accounts.messages.delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setDeletingEntity(false);
        }
    };

    const requestDeleteWallet = (wallet: any) => {
        if (!wallet) {
            return;
        }

        setDeleteIntent({
            kind: "wallet",
            id: wallet.id,
            name: wallet.name,
        });
    };

    const handleDeleteWallet = async (wallet: any) => {
        if (!wallet) {
            return;
        }

        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/pockets/${wallet.id}`));
            setWallets((prev) => prev.filter((item) => item.id !== wallet.id));
            if (page.selectedWallet?.id === wallet.id) {
                page.setSelectedWallet(null);
            }
            page.setShowWalletDetailSheet(false);
            setDeleteIntent(null);
            notify.success(t("wallet.messages.wallet_deleted"));
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wallet_delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setDeletingEntity(false);
        }
    };

    const openBudgetModal = (budget?: FinanceBudget | null) => {
        setSelectedBudget(budget ?? null);
        setShowBudgetModal(true);
    };

    const handleSaveBudget = async (budget?: FinanceBudget) => {
        if (!budget) {
            await syncForTab("budgets", { periodMonth: planningMonth, force: true });
            return;
        }

        setBudgets((prev) => [budget, ...prev.filter((item) => item.id !== budget.id)]);
        await syncForTab("budgets", { periodMonth: budget.period_month || planningMonth, force: true });
    };

    const handleDeleteBudget = async () => {
        if (!selectedBudget) {
            return;
        }

        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/budgets/${selectedBudget.id}`));
            setBudgets((prev) => prev.filter((item) => item.id !== selectedBudget.id));
            setShowBudgetModal(false);
            setSelectedBudget(null);
            setDeleteIntent(null);
            notify.success(t("finance.budgets.messages.updated", { defaultValue: "Budget berhasil dihapus" }));
            await syncForTab("budgets", { periodMonth: planningMonth, force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.budgets.messages.save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setDeletingEntity(false);
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

    const handleSaveGoal = async (values: GoalFormState) => {
        page.setSavingGoal(true);
        try {
            const response = await axios({
                method: page.selectedGoal ? "patch" : "post",
                url: page.selectedGoal ? tenantRoute.apiTo(`/finance/goals/${page.selectedGoal.id}`) : tenantRoute.apiTo("/finance/goals"),
                data: {
                    ...values,
                    target_amount: Number(values.target_amount || 0),
                },
            });

            const savedGoal = response.data?.data?.goal;
            setGoals((prev) => [savedGoal, ...prev.filter((item) => item.id !== savedGoal.id)]);
            notify.success(t(page.selectedGoal ? "wallet.messages.goal_updated" : "wallet.messages.goal_created"));
            page.setShowGoalModal(false);
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingGoal(false);
        }
    };

    const openGoalDetail = async (goal: FinanceSavingsGoal) => {
        page.setSelectedGoal(goal);
        page.setShowGoalDetailSheet(true);
        setGoalActivities([]);

        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/goals/${goal.id}`));
            const detailedGoal = response.data?.data?.goal ?? goal;
            const activities = response.data?.data?.activities ?? [];
            page.setSelectedGoal(detailedGoal);
            setGoalActivities(activities);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const openGoalFundModal = (goal: FinanceSavingsGoal) => {
        page.setSelectedGoal(goal);
        setGoalFundForm({
            source_pocket_id: wallets.find((wallet) => wallet.id !== goal.pocket_id)?.id || wallets[0]?.id || "",
            amount: "",
            transaction_date: new Date().toISOString().slice(0, 10),
            description: `Top up goal ${goal.name}`,
            notes: "",
        });
        page.setShowGoalFundModal(true);
    };

    const openGoalSpendModal = (goal: FinanceSavingsGoal) => {
        page.setSelectedGoal(goal);
        setGoalSpendForm({
            amount: "",
            transaction_date: new Date().toISOString().slice(0, 10),
            category_id: "",
            budget_id: "",
            payment_method: "",
            description: "",
            merchant_name: "",
            reference_number: "",
            location: "",
            notes: "",
        });
        page.setShowGoalSpendModal(true);
    };

    const openAccountDetail = async (account: FinanceAccount) => {
        page.setSelectedAccount(account);
        page.setShowAccountDetailSheet(true);

        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/accounts/${account.id}`));
            const detailedAccount = response.data?.data?.account ?? account;
            page.setSelectedAccount(detailedAccount);
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.accounts.messages.load_failed", { defaultValue: "Gagal memuat detail akun" }));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const openWalletDetail = async (wallet: FinancePocket) => {
        page.setSelectedWallet(wallet);
        page.setShowWalletDetailSheet(true);

        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/pockets/${wallet.id}`));
            const detailedWallet = response.data?.data?.wallet ?? response.data?.data?.pocket ?? wallet;
            page.setSelectedWallet(detailedWallet);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wallet_load_failed", { defaultValue: "Gagal memuat detail dompet" }));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleFundGoal = async () => {
        if (!page.selectedGoal) {
            return;
        }

        page.setFundingGoal(true);
        try {
            const response = await axios.post(tenantRoute.apiTo(`/finance/goals/${page.selectedGoal.id}/fund`), {
                ...goalFundForm,
                amount: Number(goalFundForm.amount || 0),
            });
            const savedGoal = response.data?.data?.goal;
            const activities = response.data?.data?.activities ?? [];
            setGoals((prev) => [savedGoal, ...prev.filter((item) => item.id !== savedGoal.id)]);
            page.setSelectedGoal(savedGoal);
            setGoalActivities(activities);
            page.setShowGoalFundModal(false);
            notify.success(t("wallet.actions.top_up", { defaultValue: "Top up goal berhasil" }));
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setFundingGoal(false);
        }
    };

    const handleSpendGoal = async () => {
        if (!page.selectedGoal) {
            return;
        }

        page.setSpendingGoal(true);
        try {
            const response = await axios.post(tenantRoute.apiTo(`/finance/goals/${page.selectedGoal.id}/spend`), {
                ...goalSpendForm,
                amount: Number(goalSpendForm.amount || 0),
                budget_id: goalSpendForm.budget_id || null,
                payment_method: goalSpendForm.payment_method || null,
                reference_number: goalSpendForm.reference_number || null,
                merchant_name: goalSpendForm.merchant_name || null,
                location: goalSpendForm.location || null,
            });
            const savedGoal = response.data?.data?.goal;
            const activities = response.data?.data?.activities ?? [];
            setGoals((prev) => [savedGoal, ...prev.filter((item) => item.id !== savedGoal.id)]);
            page.setSelectedGoal(savedGoal);
            setGoalActivities(activities);
            page.setShowGoalSpendModal(false);
            notify.success(t("wallet.actions.spend_goal", { defaultValue: "Dana goal berhasil dipakai" }));
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSpendingGoal(false);
        }
    };

    const handleDeleteGoal = async (goal: FinanceSavingsGoal) => {
        if (!window.confirm(t("wallet.messages.goal_delete_confirm"))) {
            return;
        }

        try {
            await axios.delete(tenantRoute.apiTo(`/finance/goals/${goal.id}`));
            notify.success(t("wallet.messages.goal_deleted"));
            await syncForTab(page.activeTab, { force: true });
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
                url: page.selectedWish ? tenantRoute.apiTo(`/finance/wishes/${page.selectedWish.id}`) : tenantRoute.apiTo("/finance/wishes"),
                data: {
                    ...wishForm,
                    estimated_amount: wishForm.estimated_amount ? Number(wishForm.estimated_amount) : null,
                },
            });

            const savedWish = response.data?.data?.wish;
            setWishes((prev) => [savedWish, ...prev.filter((item) => item.id !== savedWish.id)]);
            notify.success(t(page.selectedWish ? "wallet.messages.wish_updated" : "wallet.messages.wish_created"));
            page.setShowWishModal(false);
            await syncForTab(page.activeTab, { force: true });
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
            await axios.delete(tenantRoute.apiTo(`/finance/wishes/${wish.id}`));
            notify.success(t("wallet.messages.wish_deleted"));
            await syncForTab(page.activeTab, { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        }
    };

    const handleWishStatus = async (wish: WalletWish, action: "approve" | "reject") => {
        try {
            await axios.post(tenantRoute.apiTo(`/finance/wishes/${wish.id}/${action}`));
            notify.success(t(action === "approve" ? "wallet.messages.wish_approved" : "wallet.messages.wish_rejected"));
            await syncForTab(page.activeTab, { force: true });
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
            await axios.post(tenantRoute.apiTo(`/finance/wishes/${page.selectedWish.id}/convert`), {
                wallet_id: page.convertForm.wallet_id,
                target_amount: page.convertForm.target_amount ? Number(page.convertForm.target_amount) : undefined,
                target_date: page.convertForm.target_date || undefined,
                notes: page.convertForm.notes || undefined,
            });
            notify.success(t("wallet.messages.wish_converted"));
            page.setShowConvertModal(false);
            await syncForTab(page.activeTab, { force: true });
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
                activeSection={financeRoute?.section ?? "home"}
                activeTab={page.activeTab}
                title={financeRoute?.title ?? "Wallet"}
                entityLabel={financeRoute?.entity_label ?? t("wallet.entity_label")}
                planningHref={financeRoute?.section === "planning" ? "/finance/planning" : null}
                planningMonth={planningMonth}
                searchOpen={page.searchOpen}
                searchValue={page.search}
                onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                onSearchChange={page.setSearch}
                periodLabel={financeRoute?.section === "planning" && page.activeTab === "budgets" ? planningMonthLabel : null}
                onPrevMonth={financeRoute?.section === "planning" && page.activeTab === "budgets"
                    ? () => {
                        const nextMonth = shiftMonthValue(planningMonth, -1);
                        setPlanningMonth(nextMonth);
                        void syncForTab("budgets", { periodMonth: nextMonth });
                        window.history.replaceState({}, "", `/finance/planning?view=budgets&period_month=${nextMonth}`);
                    }
                    : null}
                onNextMonth={financeRoute?.section === "planning" && page.activeTab === "budgets"
                    ? () => {
                        const nextMonth = shiftMonthValue(planningMonth, 1);
                        setPlanningMonth(nextMonth);
                        void syncForTab("budgets", { periodMonth: nextMonth });
                        window.history.replaceState({}, "", `/finance/planning?view=budgets&period_month=${nextMonth}`);
                    }
                    : null}
                showFab={permissions.create && financeRoute?.section !== "review"}
                canCreateAccount={canCreateAccount}
                canCreateBudget={canCreateBudget}
                canCreateWish={canCreateWish}
                canCreateGoal={canCreateGoal}
                onFabClick={() => {
                    if (financeRoute?.section === "home") {
                        if (wallets.length > 0) {
                            page.setTransactionPresetType("pengeluaran");
                            page.setTransactionDraft({
                                pocket_id: wallets[0]?.id ?? "",
                                bank_account_id: wallets[0]?.real_account_id ?? accounts[0]?.id ?? "",
                                currency_code: wallets[0]?.currency_code ?? defaultCurrency,
                                amount: "",
                                description: "",
                            });
                            page.setTransactionModal(true);
                            return;
                        }

                        if (canCreateAccount) {
                            openAccountModal(null, null);
                        }
                        return;
                    }

                    if (financeRoute?.section === "accounts") {
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

                    if (page.activeTab === "budgets") {
                        if (!canCreateBudget) {
                            return;
                        }
                        openBudgetModal(null);
                    }

                }}
            >
                {(financeRoute?.section === "home" || financeRoute?.section === "review") && page.activeTab === "dashboard" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <WalletDashboardTab
                            summary={summary}
                            monthlyReview={monthlyReview}
                            filteredGoals={filteredGoals}
                            filteredWishes={filteredWishes}
                            loading={syncing}
                            onOpenMonthlyReview={() => page.setShowMonthlyReviewWizard(true)}
                        />
                    </Suspense>
                )}

                {financeRoute?.section === "accounts" && page.activeTab === "accounts" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        {isSectionBootstrapping ? (
                            <TabLoadingFallback />
                        ) : (
                            <WalletAccountsTab
                                groupedWallets={groupedWallets}
                                permissions={permissions}
                                activeMemberId={activeMemberId}
                                onOpenAccountDetail={(account) => void openAccountDetail(account)}
                                onOpenWalletDetail={(wallet) => void openWalletDetail(wallet)}
                                onAddWallet={handleWalletQuotaClick}
                            />
                        )}
                    </Suspense>
                )}

                {financeRoute?.section === "planning" && page.activeTab === "wishes" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        {isSectionBootstrapping ? (
                            <TabLoadingFallback />
                        ) : (
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
                        )}
                    </Suspense>
                )}

                {financeRoute?.section === "planning" && page.activeTab === "goals" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        {isSectionBootstrapping ? (
                            <TabLoadingFallback />
                        ) : (
                            <WalletGoalsTab
                                goals={filteredGoals}
                                onOpenDetail={(goal) => void openGoalDetail(goal)}
                            />
                        )}
                    </Suspense>
                )}

                {financeRoute?.section === "planning" && page.activeTab === "budgets" && (
                    <Suspense fallback={<TabLoadingFallback />}>
                        {isSectionBootstrapping ? (
                            <TabLoadingFallback />
                        ) : (
                            <WalletBudgetsTab
                                budgets={budgets}
                                defaultCurrency={defaultCurrency}
                                canManageFinanceStructures={permissions.manageShared}
                                budgetCreateDisabled={!canCreateBudget}
                                activeMemberId={activeMemberId}
                                onCreateBudget={() => openBudgetModal(null)}
                                onEditBudget={(budget) => openBudgetModal(budget)}
                            />
                        )}
                    </Suspense>
                )}
            </WalletPageContent>

            <Suspense fallback={null}>
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
                
                <WalletEntityDialogs
                    showWalletDetailSheet={page.showWalletDetailSheet}
                    selectedWallet={page.selectedWallet}
                    setShowWalletDetailSheet={page.setShowWalletDetailSheet}
                    openWalletModal={openWalletModal}
                    setSelectedWallet={page.setSelectedWallet}
                    setWalletForm={setWalletForm}
                    handleDeleteWallet={requestDeleteWallet}
                    permissions={permissions}
                    showWalletModal={page.showWalletModal}
                    setShowWalletModal={page.setShowWalletModal}
                    accounts={accounts}
                    budgets={budgets}
                    currencies={currencies}
                    members={members}
                    activeMemberId={activeMemberId}
                    handleSaveWallet={handleSaveWallet}
                    savingWallet={page.savingWallet}
                    onAddMoney={() => page.selectedWallet && openAddMoney(page.selectedWallet)}
                    onMoveMoney={() => page.selectedWallet && openMoveMoney(page.selectedWallet)}
                    onPaySend={() => page.selectedWallet && openPaySend(page.selectedWallet)}
                />

                <GoalDialogs
                    selectedGoal={page.selectedGoal}
                    showGoalModal={page.showGoalModal}
                    setShowGoalModal={page.setShowGoalModal}
                    goalForm={goalForm}
                    setGoalForm={setGoalForm}
                    handleSaveGoal={handleSaveGoal}
                    savingGoal={page.savingGoal}
                    wallets={wallets}
                />

                <GoalDetailSheet
                    show={page.showGoalDetailSheet}
                    goal={page.selectedGoal}
                    activities={goalActivities}
                    onClose={() => page.setShowGoalDetailSheet(false)}
                    onEdit={() => {
                        if (!page.selectedGoal) return;
                        resetGoalForm(page.selectedGoal);
                        page.setShowGoalDetailSheet(false);
                        page.setShowGoalModal(true);
                    }}
                    onDelete={() => {
                        if (!page.selectedGoal) return;
                        page.setShowGoalDetailSheet(false);
                        void handleDeleteGoal(page.selectedGoal);
                    }}
                    onFund={() => page.selectedGoal && openGoalFundModal(page.selectedGoal)}
                    onSpend={() => page.selectedGoal && openGoalSpendModal(page.selectedGoal)}
                    canManage={permissions.manageShared || String(page.selectedGoal?.owner_member_id || "") === String(activeMemberId || "")}
                />

                <GoalActionModal
                    mode="fund"
                    show={page.showGoalFundModal}
                    onHide={() => page.setShowGoalFundModal(false)}
                    goal={page.selectedGoal}
                    wallets={wallets}
                    form={goalFundForm}
                    setForm={setGoalFundForm}
                    onSubmit={handleFundGoal}
                    loading={page.fundingGoal}
                />

                <GoalActionModal
                    mode="spend"
                    show={page.showGoalSpendModal}
                    onHide={() => page.setShowGoalSpendModal(false)}
                    goal={page.selectedGoal}
                    wallets={wallets}
                    budgets={budgets}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    form={goalSpendForm}
                    setForm={setGoalSpendForm}
                    onSubmit={handleSpendGoal}
                    loading={page.spendingGoal}
                />

                <WishDialogs
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
                    wallets={wallets}
                />

                <BudgetModal
                    show={showBudgetModal}
                    onClose={() => {
                        setShowBudgetModal(false);
                        setSelectedBudget(null);
                    }}
                    onSuccess={(budget) => void handleSaveBudget(budget)}
                    onDelete={() => {
                        if (!selectedBudget) return;
                        setDeleteIntent({
                            kind: "budget",
                            id: selectedBudget.id,
                            name: selectedBudget.name,
                        });
                    }}
                    budget={selectedBudget}
                    members={members}
                    pockets={wallets}
                    activeMemberId={activeMemberId}
                    canManageShared={permissions.manageShared}
                    canDelete={permissions.delete}
                />

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
                        if (deleteIntent.kind === "budget") {
                            void handleDeleteBudget();
                            return;
                        }
                        const wallet = wallets.find((item) => item.id === deleteIntent.id) || page.selectedWallet;
                        if (wallet) {
                            void handleDeleteWallet(wallet);
                        }
                    }}
                    loading={deletingEntity}
                    title={deleteIntent?.kind === "account" ? "Hapus akun ini?" : deleteIntent?.kind === "budget" ? "Hapus budget ini?" : "Hapus wallet ini?"}
                    entityLabel={deleteIntent?.kind === "account" ? "Akun" : deleteIntent?.kind === "budget" ? "Budget" : "Wallet"}
                    entityName={deleteIntent?.name || ""}
                    message={deleteIntent?.kind === "account"
                        ? "Akun hanya bisa dihapus jika backend mengizinkan. Pastikan Anda benar-benar ingin menghapus struktur ini."
                        : deleteIntent?.kind === "budget"
                            ? "Budget hanya bisa dihapus jika backend mengizinkan. Pastikan histori bulanan yang terkait sudah tidak dibutuhkan."
                        : "Wallet hanya bisa dihapus jika backend mengizinkan. Pastikan tidak ada konteks operasional yang masih dibutuhkan."}
                    warnings={deleteIntent?.kind === "account"
                        ? [
                            "Wallet turunan, goal, dan konteks struktur account bisa ikut terdampak secara operasional.",
                            "Jika account sudah dipakai transaksi, backend akan menolak penghapusan ini.",
                            "Aksi ini tidak dapat dipulihkan dari UI biasa.",
                        ]
                        : deleteIntent?.kind === "budget"
                            ? [
                                "Transaksi yang sudah mereferensikan budget ini bisa kehilangan konteks pelacakan anggarannya.",
                                "Jika backend menemukan relasi yang harus dipertahankan, penghapusan akan ditolak.",
                                "Aksi ini tidak dapat dipulihkan dari UI biasa.",
                            ]
                        : [
                            "Goal dan alokasi yang menempel pada wallet ini bisa kehilangan konteks operasionalnya.",
                            "Jika wallet sudah dipakai transaksi, backend akan menolak penghapusan ini.",
                            "Aksi ini tidak dapat dipulihkan dari UI biasa.",
                        ]}
                    confirmLabel={deleteIntent?.kind === "account" ? "Ya, Hapus Akun" : deleteIntent?.kind === "budget" ? "Ya, Hapus Budget" : "Ya, Hapus Wallet"}
                />
            </Suspense>

            {monthlyReview && (
                <Suspense fallback={null}>
                    <MonthlyReviewWizard
                        show={page.showMonthlyReviewWizard}
                        onHide={() => page.setShowMonthlyReviewWizard(false)}
                        monthlyReview={monthlyReview}
                        syncAll={syncAll}
                    />
                </Suspense>
            )}
            
            <TransactionModal
                show={page.transactionModal}
                onClose={() => page.setTransactionModal(false)}
                onSuccess={async () => {
                    await syncForTab(page.activeTab, { force: true });
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
