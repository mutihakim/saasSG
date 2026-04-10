import axios from "axios";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import FinancePlanningTopbar from "../components/pwa/FinancePlanningTopbar";
import useFinancePlanningState from "../hooks/useFinancePlanningState";
import useFinanceStructuresData from "../hooks/useFinanceStructuresData";
import { FinanceGoalDetailPayload, FinanceGoalFormState, FinanceGoalFundFormState, FinanceGoalSpendFormState, FinancePlanningPageProps } from "../types";
import { FinanceSavingsGoal } from "../types";

import { currentMonthValue } from "@/core/constants/month";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const FinanceGoalsTab = React.lazy(() => import("../components/FinanceGoalsTab"));
const GoalDialogs = React.lazy(() => import("../components/GoalDialogs"));
const GoalDetailSheet = React.lazy(() => import("../components/pwa/GoalDetailSheet"));
const GoalActionModal = React.lazy(() => import("../components/GoalActionModal"));

const TabLoadingFallback = () => (
    <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Memuat...</div>
    </div>
);

const GoalsPage = ({
    accounts: seededAccounts,
    wallets: seededPockets,
    budgets: seededBudgets,
    goals: seededGoals,
    wishes: seededWishes,
    summary: seededSummary,
    monthlyReview: seededMonthlyReview,
    categories,
    paymentMethods,
    activeMemberId,
    permissions,
    financeRoute,
}: FinancePlanningPageProps) => {
    const { t } = useTranslation();
    const page = useFinancePlanningState(
        seededAccounts[0]?.id ?? null,
        "goals"
    );

    const {
        tenantRoute,
        wallets,
        budgets,
        setGoals,
        filteredGoals,
        syncForTab,
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

    const [goalForm, setGoalForm] = useState<FinanceGoalFormState>({
        wallet_id: seededPockets.find((wallet) => !wallet.is_system)?.id || seededPockets[0]?.id || "",
        name: "",
        target_amount: "",
        target_date: "",
        status: "active",
        notes: "",
        row_version: 1,
    });
    const [goalActivities, setGoalActivities] = useState<FinanceGoalDetailPayload["activities"]>([]);
    const [goalFundForm, setGoalFundForm] = useState<FinanceGoalFundFormState>({
        source_wallet_id: "",
        amount: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
    });
    const [goalSpendForm, setGoalSpendForm] = useState<FinanceGoalSpendFormState>({
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

    const resetGoalForm = (goal?: FinanceSavingsGoal | null, walletId?: string) => {
        page.setSelectedGoal(goal ?? null);
        setGoalForm({
            wallet_id: goal?.wallet_id || walletId || wallets.find((w) => !w.is_system)?.id || wallets[0]?.id || "",
            name: goal?.name || "",
            target_amount: goal?.target_amount ? String(goal.target_amount) : "",
            target_date: goal?.target_date || "",
            status: goal?.status || "active",
            notes: goal?.notes || "",
            row_version: goal?.row_version || 1,
        });
    };

    const handleSaveGoal = async (values: FinanceGoalFormState) => {
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
            await syncForTab("goals", { force: true });
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
            source_wallet_id: wallets.find((wallet) => wallet.id !== goal.wallet_id)?.id || wallets[0]?.id || "",
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

    const handleFundGoal = async () => {
        if (!page.selectedGoal) return;
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
            await syncForTab("goals", { force: true });
        } finally {
            page.setFundingGoal(false);
        }
    };

    const handleSpendGoal = async () => {
        if (!page.selectedGoal) return;
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
            await syncForTab("goals", { force: true });
        } finally {
            page.setSpendingGoal(false);
        }
    };

    const handleDeleteGoal = async (goal: FinanceSavingsGoal) => {
        if (!window.confirm(t("wallet.messages.goal_delete_confirm"))) return;
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/goals/${goal.id}`));
            notify.success(t("wallet.messages.goal_deleted"));
            await syncForTab("goals", { force: true });
        } catch {
            notify.error(t("wallet.messages.goal_delete_failed"));
        }
    };

    return (
        <FinanceShellLayout
            activeSection="planning"
            planningView="goals"
            topbar={(
                <FinancePlanningTopbar
                    title={financeRoute?.title ?? "Goals"}
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
                            resetGoalForm(null);
                            page.setShowGoalModal(true);
                        }}
                    >
                        <i className="ri-add-line fs-3" />
                    </button>
                </div>
            )}
        >
            <>
                <Suspense fallback={<TabLoadingFallback />}>
                    <FinanceGoalsTab
                        goals={filteredGoals}
                        onOpenDetail={(goal) => void openGoalDetail(goal)}
                    />
                </Suspense>

                {page.showGoalModal && (
                    <Suspense fallback={null}>
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
                    </Suspense>
                )}

                {page.showGoalDetailSheet && (
                    <Suspense fallback={null}>
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
                    </Suspense>
                )}

                {(page.showGoalFundModal || page.showGoalSpendModal) && (
                    <Suspense fallback={null}>
                        <>
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
                        </>
                    </Suspense>
                )}
            </>
        </FinanceShellLayout>
    );
};

export default GoalsPage;
